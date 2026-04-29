// state-actions skill — saga-shaped action creator emitter.
//
// For each entity operation:
//   - sync ops (e.g. edit) emit one creator
//   - async ops emit three: request, success, error
//
// All creators import their type constants from ./<slice>.type and return
// plain serializable objects.

import { actionType } from "./_naming.js";
import { SAGA_OPS } from "./_operation-patterns.js";

// CRUD-canonical order in the actions.js source:
//   create → read → edit → update → toggle → delete.
const CREATOR_ORDER = ["create", "read", "edit", "update", "toggle", "delete"];

function inCreatorOrder(ops) {
  return [...ops].sort(
    (a, b) => CREATOR_ORDER.indexOf(a) - CREATOR_ORDER.indexOf(b)
  );
}

export function emit(entity) {
  const slice = entity.slice;
  const E = entity.name;
  const ops = inCreatorOrder(entity.operations);
  const syncOps = new Set(entity.syncOps || ["edit"]);

  // Build the full type list (sorted alphabetically for the import line).
  const typesPerOp = (op) => {
    const base = actionType(op, E);
    if (syncOps.has(op)) return [base];
    return [base, `${base}_SUCCESS`, `${base}_ERROR`];
  };
  const allTypes = ops.flatMap(typesPerOp).sort();

  // Build the full creator list (in CRUD-canonical order).
  const creatorBlocks = ops
    .map((op) => {
      const patt = SAGA_OPS[op];
      if (!patt) throw new Error(`No saga pattern for operation "${op}"`);
      const T = { BASE: actionType(op, E), E };
      const lines = [patt.creator({ T })];
      if (!patt.sync) {
        if (patt.successCreator) lines.push(patt.successCreator({ T }));
        if (patt.errorCreator) lines.push(patt.errorCreator({ T }));
      }
      return lines.join("\n");
    })
    .join("\n\n");

  const importTypes =
`import {
${allTypes.map((t) => `  ${t},`).join("\n")}
} from "./${slice}.type";`;

  const actions = `${importTypes}\n\n${creatorBlocks}\n`;

  // Tests: per-op happy-path coverage.
  const allCreators = ops.flatMap((op) => {
    const c = `${op}${E}`;
    if (syncOps.has(op)) return [c];
    return [c, `${c}Success`, `${c}Error`];
  });

  const testBlocks = ops
    .map((op) => buildTestBlock({ op, E, syncOps }))
    .filter(Boolean)
    .join("\n\n");

  const test =
`import {
${allCreators.map((c) => `  ${c},`).join("\n")}
} from "./${slice}.actions";
import {
${allTypes.map((t) => `  ${t},`).join("\n")}
} from "./${slice}.type";

describe('${slice} actions', () => {
${testBlocks}
});
`;

  return {
    [`src/state/${slice}/${slice}.actions.js`]: actions,
    [`src/state/${slice}/${slice}.actions.test.js`]: test
  };
}

function buildTestBlock({ op, E, syncOps }) {
  const TYPE = actionType(op, E);
  const c = `${op}${E}`;
  switch (op) {
    case "create":
      return `  it('should create a ${c} action', () => {
    const action = ${c}('Learn Redux');
    expect(action.type).toBe(${TYPE});
    expect(action.payload.text).toBe('Learn Redux');
    expect(action.payload.completed).toBe(false);
  });

  it('${c}Success returns SUCCESS type with payload', () => {
    const payload = { id: 'x', text: 't' };
    const action = ${c}Success(payload);
    expect(action.type).toBe(${TYPE}_SUCCESS);
    expect(action.payload).toEqual(payload);
  });

  it('${c}Error returns ERROR type with error', () => {
    const action = ${c}Error('boom');
    expect(action.type).toBe(${TYPE}_ERROR);
    expect(action.error).toBe('boom');
  });`;
    case "read":
      return `  it('${c} dispatches request type', () => {
    const action = ${c}();
    expect(action.type).toBe(${TYPE});
  });
  it('${c}Success returns payload', () => {
    expect(${c}Success([1,2]).payload).toEqual([1,2]);
  });
  it('${c}Error returns error', () => {
    expect(${c}Error('x').error).toBe('x');
  });`;
    case "edit":
      return `  it('${c} stages payload', () => {
    const payload = { id: 1, text: 'Edit' };
    const action = ${c}(payload);
    expect(action.type).toBe(${TYPE});
    expect(action.payload).toEqual(payload);
  });`;
    case "update":
      return `  it('${c} dispatches request', () => {
    const payload = { id: 1, text: 'Updated' };
    expect(${c}(payload).payload).toEqual(payload);
  });
  it('${c}Success carries payload', () => {
    expect(${c}Success({ id: 1 }).type).toBe(${TYPE}_SUCCESS);
  });
  it('${c}Error carries error', () => {
    expect(${c}Error('x').error).toBe('x');
  });`;
    case "toggle":
      return `  it('${c} dispatches request', () => {
    const action = ${c}({ id: 1 });
    expect(action.type).toBe(${TYPE});
  });
  it('${c}Success has no payload', () => {
    expect(${c}Success()).toEqual({ type: ${TYPE}_SUCCESS });
  });
  it('${c}Error carries previous list and error', () => {
    const prev = [{ id: 1 }];
    expect(${c}Error(prev, 'oops')).toEqual({ type: ${TYPE}_ERROR, payload: prev, error: 'oops' });
  });`;
    case "delete":
      return `  it('${c} packs id into payload', () => {
    expect(${c}(7)).toEqual({ type: ${TYPE}, payload: { id: 7 } });
  });
  it('${c}Success has no payload', () => {
    expect(${c}Success()).toEqual({ type: ${TYPE}_SUCCESS });
  });
  it('${c}Error carries previous list and error', () => {
    const prev = [{ id: 1 }];
    expect(${c}Error(prev, 'oops')).toEqual({ type: ${TYPE}_ERROR, payload: prev, error: 'oops' });
  });`;
    default:
      return null;
  }
}
