// fetch-card state-selectors skill — entity-shape-aware selectors.
//
// Selects each lifecycle field. Variable in production (LLM-driven) so the
// agent can derive entity-specific selectors (e.g. selectTemperature for a
// weather slice). Here we emit the universal four — every fetch-card slice
// has them — so the canonical sim-LLM output is always manifest-conformant.

export function emit(entity) {
  const slice = entity.slice;
  const Slice = entity.name;

  const selectors =
`export const select${Slice} = (state) => state.${slice};
export const select${Slice}Data = (state) => state.${slice}.data;
export const select${Slice}Loading = (state) => state.${slice}.loading;
export const select${Slice}Error = (state) => state.${slice}.error;
export const select${Slice}Query = (state) => state.${slice}.query;
`;

  const test =
`import { select${Slice}, select${Slice}Data, select${Slice}Loading, select${Slice}Error, select${Slice}Query } from './${slice}.selectors';

const state = { ${slice}: { data: { ok: true }, loading: false, error: null, query: 'q' } };

describe('${Slice} selectors', () => {
  it('select${Slice} returns the slice', () => {
    expect(select${Slice}(state)).toEqual(state.${slice});
  });
  it('select${Slice}Data returns data', () => {
    expect(select${Slice}Data(state)).toEqual({ ok: true });
  });
  it('select${Slice}Loading returns loading flag', () => {
    expect(select${Slice}Loading(state)).toBe(false);
  });
  it('select${Slice}Error returns error', () => {
    expect(select${Slice}Error(state)).toBeNull();
  });
  it('select${Slice}Query returns last query', () => {
    expect(select${Slice}Query(state)).toBe('q');
  });
});
`;

  return {
    [`src/state/${slice}/${slice}.selectors.js`]: selectors,
    [`src/state/${slice}/${slice}.selectors.test.js`]: test
  };
}
