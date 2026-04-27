// state-selectors skill — variable emitter (deterministic in sim-llm).
//
// Skill principles:
//   • "Computed properties" — selector returns derived view of state
//   • "Memoization" (here implicit; the chota template uses plain functions)
//   • "State shape abstraction" — callers use selector, not raw state path
//
// For the elegant template, the entity selector projects the items list
// through the filter constants imported from filters.type. Pattern is
// determined by the skill; the only entity-derived bits are slice/Slice/items.

export function emit(entity) {
  const slice = entity.slice;
  const Slice = entity.name;
  const items = entity.itemsField || `${slice}Items`;

  const selectors =
`import { SHOW_ACTIVE, SHOW_ALL, SHOW_COMPLETED } from "../filters/filters.type";

export const getVisible${Slice}s = (${slice}, filter) => {
  let visible${Slice}s = [];
  switch (filter) {
    case SHOW_ALL:
      visible${Slice}s = ${slice}.${items};
      break;
    case SHOW_COMPLETED:
      visible${Slice}s = ${slice}.${items}.filter((t) => t.completed);
      break;
    case SHOW_ACTIVE:
      visible${Slice}s = ${slice}.${items}.filter((t) => !t.completed);
      break;
    default:
      throw new Error("Unknown filter: " + filter);
  }

  return {
    ...${slice},
    ${items}: visible${Slice}s,
  }
};
`;

  const test =
`import {
  getVisible${Slice}s,
} from './${slice}.selectors';
import { SHOW_ACTIVE, SHOW_ALL, SHOW_COMPLETED } from '../filters/filters.type';

describe('${Slice} Selectors', () => {
  const mock${Slice}State = {
    ${items}: [
      { id: '1', text: '${Slice} 1', completed: false },
      { id: '2', text: '${Slice} 2', completed: true },
      { id: '3', text: '${Slice} 3', completed: false },
    ],
  };

  describe('getVisible${Slice}s with SHOW_ALL filter', () => {
    it('returns all ${slice} items when filter is SHOW_ALL', () => {
      const result = getVisible${Slice}s(mock${Slice}State, SHOW_ALL);
      expect(result.${items}.length).toBe(3);
      expect(result.${items}[0].id).toBe('1');
      expect(result.${items}[2].id).toBe('3');
    });

    it('preserves other ${slice} state properties', () => {
      const result = getVisible${Slice}s(mock${Slice}State, SHOW_ALL);
      expect(result.${items}.length).toBe(3);
    });
  });

  describe('getVisible${Slice}s with SHOW_COMPLETED filter', () => {
    it('returns only completed ${slice} items when filter is SHOW_COMPLETED', () => {
      const result = getVisible${Slice}s(mock${Slice}State, SHOW_COMPLETED);
      expect(result.${items}.length).toBe(1);
      expect(result.${items}[0].id).toBe('2');
      expect(result.${items}[0].completed).toBe(true);
    });

    it('returns empty array when no ${slice}s are completed', () => {
      const emptyCompletedState = { ${items}: [] };
      const result = getVisible${Slice}s(emptyCompletedState, SHOW_COMPLETED);
      expect(result.${items}.length).toBe(0);
    });
  });

  describe('getVisible${Slice}s with SHOW_ACTIVE filter', () => {
    it('returns only active (non-completed) ${slice} items when filter is SHOW_ACTIVE', () => {
      const result = getVisible${Slice}s(mock${Slice}State, SHOW_ACTIVE);
      expect(result.${items}.length).toBe(2);
      expect(result.${items}[0].id).toBe('1');
      expect(result.${items}[1].id).toBe('3');
    });

    it('returns empty array when no ${slice}s are active', () => {
      const allCompletedState = { ${items}: [{ id: '1', text: 'Done', completed: true }] };
      const result = getVisible${Slice}s(allCompletedState, SHOW_ACTIVE);
      expect(result.${items}.length).toBe(0);
    });
  });

  describe('getVisible${Slice}s with invalid filter', () => {
    it('throws an error for unknown filter type', () => {
      expect(() => getVisible${Slice}s(mock${Slice}State, 'INVALID_FILTER')).toThrow('Unknown filter: INVALID_FILTER');
    });
  });
});
`;

  return {
    [`src/state/${slice}/${slice}.selectors.js`]: selectors,
    [`src/state/${slice}/${slice}.selectors.test.js`]: test
  };
}
