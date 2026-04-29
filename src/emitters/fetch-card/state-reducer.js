// fetch-card state-reducer skill — ajax-lifecycle reducer.
//
// Pattern: switch on REQUEST_X / RECEIVE_X / FAIL_X. Sets loading/data/error
// in lockstep. Default case returns previous state untouched, per the
// state-reducer skill's "purity" key principle.

export function emit(entity) {
  const slice = entity.slice;
  const Slice = entity.name;
  const E = slice.toUpperCase();
  const initialName = `initial${Slice}State`;

  const reducer =
`import { REQUEST_${E}, RECEIVE_${E}, FAIL_${E} } from './${slice}.type';
import { ${initialName} } from './${slice}.initial';

export default function ${slice}Reducer(state = ${initialName}, action) {
  switch (action.type) {
    case REQUEST_${E}:
      return { ...state, loading: true, error: null, query: action.payload.query };
    case RECEIVE_${E}:
      return { ...state, loading: false, error: null, data: action.payload.data };
    case FAIL_${E}:
      return { ...state, loading: false, error: action.payload.error };
    default:
      return state;
  }
}
`;

  const test =
`import ${slice}Reducer from './${slice}.reducer';
import { ${initialName} } from './${slice}.initial';
import { REQUEST_${E}, RECEIVE_${E}, FAIL_${E} } from './${slice}.type';

describe('${slice}Reducer', () => {
  it('returns initial state for unknown action', () => {
    expect(${slice}Reducer(undefined, { type: 'NOPE' })).toEqual(${initialName});
  });
  it('REQUEST_${E} sets loading and query', () => {
    const next = ${slice}Reducer(${initialName}, { type: REQUEST_${E}, payload: { query: 'q' } });
    expect(next.loading).toBe(true);
    expect(next.query).toBe('q');
  });
  it('RECEIVE_${E} clears loading and stores data', () => {
    const next = ${slice}Reducer({ ...${initialName}, loading: true }, { type: RECEIVE_${E}, payload: { data: { x: 1 } } });
    expect(next.loading).toBe(false);
    expect(next.data).toEqual({ x: 1 });
  });
  it('FAIL_${E} clears loading and stores error', () => {
    const next = ${slice}Reducer({ ...${initialName}, loading: true }, { type: FAIL_${E}, payload: { error: 'oops' } });
    expect(next.loading).toBe(false);
    expect(next.error).toBe('oops');
  });
});
`;

  return {
    [`src/state/${slice}/${slice}.reducer.js`]: reducer,
    [`src/state/${slice}/${slice}.reducer.test.js`]: test
  };
}
