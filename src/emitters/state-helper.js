// state-saga skill — per-slice helper functions.
//
// Pure utilities used by both the reducer (for optimistic toggle) and the
// saga workers (for mapping API data into reducer-shape).

export function emit(entity) {
  const slice = entity.slice;

  const helper =
`export const mapTodoData = (todoData) => {
  return todoData;
}

export const toggleCheckedState = (payload) => {
  return { ...payload, completed: !payload.completed };
}
`;

  const test =
`import { mapTodoData, toggleCheckedState } from './${slice}.helper';

describe('${slice} helper', () => {
  it('mapTodoData passes through', () => {
    expect(mapTodoData([1, 2])).toEqual([1, 2]);
  });
  it('toggleCheckedState flips completed', () => {
    expect(toggleCheckedState({ completed: false })).toEqual({ completed: true });
    expect(toggleCheckedState({ completed: true })).toEqual({ completed: false });
  });
});
`;

  return {
    [`src/state/${slice}/${slice}.helper.js`]: helper,
    [`src/state/${slice}/${slice}.helper.test.js`]: test
  };
}
