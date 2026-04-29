// fetch-card state-actions skill — ajax-shaped action creators.
//
// Three creators per slice: requestX(query), receiveX(data), failX(error).
// requestX is also a thunk-creator: a side-effecting action returning an
// async function. The ajax middleware intercepts that function, runs it,
// and dispatches receive/fail as the promise settles.

export function emit(entity) {
  const slice = entity.slice;
  const Slice = entity.name;
  const E = slice.toUpperCase();

  const actions =
`import { REQUEST_${E}, RECEIVE_${E}, FAIL_${E} } from './${slice}.type';

export const request${Slice} = (query) => ({
  type: REQUEST_${E},
  payload: { query }
});

export const receive${Slice} = (data) => ({
  type: RECEIVE_${E},
  payload: { data }
});

export const fail${Slice} = (error) => ({
  type: FAIL_${E},
  payload: { error: error?.message || String(error) }
});

// Thunk: dispatch this from a container, the ajax middleware will run the
// fetch and fan out to receive${Slice}/fail${Slice}.
export const fetch${Slice} = (query) => async (dispatch) => {
  dispatch(request${Slice}(query));
  try {
    const data = await fetch${Slice}Data(query);
    dispatch(receive${Slice}(data));
  } catch (error) {
    dispatch(fail${Slice}(error));
  }
};

// Network call. In production swap the URL for a real API. For the demo
// build we return a deterministic mock so the page renders without keys.
async function fetch${Slice}Data(query) {
  await new Promise((r) => setTimeout(r, 350));
  if (!query) throw new Error("query is required");
  return {
    query,
    fetchedAt: new Date().toISOString(),
${(entity.responseFields || ["value"]).map((f) => `    ${f}: mock${capitalize(f)}(query)`).join(",\n")}
  };
}

${(entity.responseFields || ["value"]).map((f) => `function mock${capitalize(f)}(q) { return hashString(q + "::${f}"); }`).join("\n")}

function hashString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h % 100);
}
`;

  const test =
`import { request${Slice}, receive${Slice}, fail${Slice} } from './${slice}.actions';
import { REQUEST_${E}, RECEIVE_${E}, FAIL_${E} } from './${slice}.type';

describe('${Slice} actions', () => {
  it('request${Slice}(query) → REQUEST_${E} with payload', () => {
    expect(request${Slice}('q')).toEqual({ type: REQUEST_${E}, payload: { query: 'q' } });
  });
  it('receive${Slice}(data) → RECEIVE_${E} with payload', () => {
    const d = { foo: 1 };
    expect(receive${Slice}(d)).toEqual({ type: RECEIVE_${E}, payload: { data: d } });
  });
  it('fail${Slice}(error) → FAIL_${E} with message', () => {
    expect(fail${Slice}(new Error('oops'))).toEqual({ type: FAIL_${E}, payload: { error: 'oops' } });
  });
});
`;

  return {
    [`src/state/${slice}/${slice}.actions.js`]: actions,
    [`src/state/${slice}/${slice}.actions.test.js`]: test
  };
}

function capitalize(s) {
  return s[0].toUpperCase() + s.slice(1);
}
