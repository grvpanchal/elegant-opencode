// state-saga skill — per-slice saga generators + watcher.
//
// Skill principles (state-saga / chota-react-saga template):
//   • "Effects are declarative" — yield put / call / select / takeLatest
//   • "watcher per slice"      — one watch<Entity>() generator per slice that
//                                takeLatest's the REQUEST type → worker generator
//   • "errors as actions"      — workers catch, dispatch <op>Error(...) on failure
//   • "optimistic with rollback" — toggle/delete read previousState<Items> from
//                                 the slice on error (state-reducer is the
//                                 source of truth for that key).
//
// Emits two files:
//   src/state/<slice>/<slice>.operations.js
//   src/state/<slice>/<slice>.operations.test.js (smoke test only)

import { actionType } from "./_naming.js";

const ASYNC_OPS_DEFAULT = ["create", "read", "update", "toggle", "delete"];

export function emit(entity) {
  const slice = entity.slice;
  const E = entity.name;
  const ops = entity.operations || [];
  const syncOps = new Set(entity.syncOps || ["edit"]);
  const asyncOps = ops.filter((op) => !syncOps.has(op));

  // Each async op needs:
  //   - an API caller (REST verb derived from op)
  //   - a worker generator (calls API, puts SUCCESS/ERROR)
  // The watcher takeLatest's the REQUEST type per worker.

  // toggle reuses update's API caller (PUT). Dedupe by emitted fn name.
  const seenApi = new Set();
  const apiFns = asyncOps
    .map((op) => {
      const code = apiCallerFor(op, slice);
      if (!code) return null;
      const m = code.match(/export function (\w+)/);
      if (!m) return code;
      if (seenApi.has(m[1])) return null;
      seenApi.add(m[1]);
      return code;
    })
    .filter(Boolean)
    .join("\n\n");

  const workers = asyncOps.map((op) => workerFor(op, slice, E)).join("\n\n");

  const watcher = `export function* watch${E}s() {\n${asyncOps
    .map((op) => `  yield takeLatest(${actionType(op, E)}, ${workerName(op, slice)});`)
    .join("\n")}\n}`;

  const requestTypes = asyncOps.map((op) => actionType(op, E)).join(", ");
  const successErrorCreators = asyncOps
    .flatMap((op) => [`${op}${E}Success`, `${op}${E}Error`])
    .join(", ");

  const operations =
`import { put, takeLatest, call, select, delay } from "redux-saga/effects";
import { ${requestTypes} } from "./${slice}.type";
import { ${successErrorCreators} } from "./${slice}.actions";
import { mapTodoData, toggleCheckedState } from "./${slice}.helper";
import fetchApi from "../../utils/api";

${apiFns}

${workers}

${watcher}
`;

  const test =
`import { runSaga } from "redux-saga";
import { ${asyncOps.map((op) => workerName(op, slice)).join(", ")} } from './${slice}.operations';

// Smoke tests: each worker is a generator and runs to completion.
describe('${slice} operations', () => {
${asyncOps
    .map((op) => `  it('${workerName(op, slice)} is a generator', () => {
    expect(typeof ${workerName(op, slice)}).toBe('function');
  });`)
    .join("\n\n")}
});
`;

  return {
    [`src/state/${slice}/${slice}.operations.js`]: operations,
    [`src/state/${slice}/${slice}.operations.test.js`]: test
  };
}

function workerName(op, slice) {
  // Saga template names: getTodos / addTodos / updateTodos / updateToggleTodos / deleteTodos
  switch (op) {
    case "read":   return `get${pascal(slice)}s`;
    case "create": return `add${pascal(slice)}s`;
    case "update": return `update${pascal(slice)}s`;
    case "toggle": return `updateToggle${pascal(slice)}s`;
    case "delete": return `delete${pascal(slice)}s`;
    default:       return `${op}${pascal(slice)}s`;
  }
}

function apiCallerFor(op, slice) {
  // The API path is /<plural-slice>; method derives from op.
  const path = `/${slice}s`;
  switch (op) {
    case "read":
      return `export function get${pascal(slice)}Api() {\n  return fetchApi('${path}');\n}`;
    case "create":
      return `export function add${pascal(slice)}Api(payload) {\n  return fetchApi('${path}', { method: 'POST', body: payload });\n}`;
    case "update":
    case "toggle":
      return `export function update${pascal(slice)}Api(payload) {\n  return fetchApi('${path}', { method: 'PUT', body: payload });\n}`;
    case "delete":
      return `export function delete${pascal(slice)}Api(payload) {\n  return fetchApi('${path}', { method: 'DELETE', body: payload });\n}`;
    default:
      return "";
  }
}

function workerFor(op, slice, E) {
  const Slice = pascal(slice);
  switch (op) {
    case "read":
      return `export function* get${Slice}s() {
  try {
    const ${slice}Response = yield call(get${Slice}Api);
    const ${slice}Data = yield ${slice}Response.json();
    const mapped${Slice}Data = mapTodoData(${slice}Data);
    yield put(read${E}Success(mapped${Slice}Data));
  } catch (error) {
    yield put(read${E}Error(error.toString()));
  }
}`;
    case "create":
      return `export function* add${Slice}s(action) {
  try {
    const payload = { ...action.payload, id: window.crypto.randomUUID() };
    yield call(add${Slice}Api, payload);
    yield put(create${E}Success(payload));
  } catch (error) {
    yield put(create${E}Error(error.toString()));
  }
}`;
    case "update":
      return `export function* update${Slice}s(action) {
  try {
    yield call(update${Slice}Api, action.payload);
    yield put(update${E}Success(action.payload));
  } catch (error) {
    yield put(update${E}Error(error.toString()));
  }
}`;
    case "toggle":
      return `export function* updateToggle${Slice}s(action) {
  try {
    yield call(update${Slice}Api, toggleCheckedState(action.payload));
    yield put(toggle${E}Success());
  } catch (error) {
    yield delay(500);
    const mapped${Slice}Data = yield select((state) => state.${slice}.previousState${Slice}Items);
    yield put(toggle${E}Error(mapped${Slice}Data, error.toString()));
  }
}`;
    case "delete":
      return `export function* delete${Slice}s(action) {
  try {
    yield call(delete${Slice}Api, action.payload);
    yield put(delete${E}Success());
  } catch (error) {
    yield delay(500);
    const mapped${Slice}Data = yield select((state) => state.${slice}.previousState${Slice}Items);
    yield put(delete${E}Error(mapped${Slice}Data, error.toString()));
  }
}`;
    default:
      return "";
  }
}

function pascal(s) {
  return s[0].toUpperCase() + s.slice(1);
}
