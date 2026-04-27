// state-crud skill — filters slice.
//
// The visibility-filter slice is the same in every list-with-filters app:
// SHOW_ALL / SHOW_COMPLETED / SHOW_ACTIVE plus a SET_VISIBILITY_FILTER action
// that flips the `selected` flag. The shape (array of {id,label,selected}) is
// dictated by the state-crud skill's "discrete options" pattern. Output is
// 100% fixed; no entity input is needed.

export function emit(_entity) {
  return {
    "src/state/filters/filters.type.js":
`export const SHOW_ALL = "SHOW_ALL";
export const SHOW_COMPLETED = "SHOW_COMPLETED";
export const SHOW_ACTIVE = "SHOW_ACTIVE";
export const SET_VISIBILITY_FILTER = "SET_VISIBILITY_FILTER";
`,

    "src/state/filters/filters.type.test.js":
`import {
  SHOW_ALL,
  SHOW_COMPLETED,
  SHOW_ACTIVE,
  SET_VISIBILITY_FILTER,
} from './filters.type';

describe('Filters Action Types', () => {
  it('exports SHOW_ALL constant', () => {
    expect(SHOW_ALL).toBe('SHOW_ALL');
  });

  it('exports SHOW_COMPLETED constant', () => {
    expect(SHOW_COMPLETED).toBe('SHOW_COMPLETED');
  });

  it('exports SHOW_ACTIVE constant', () => {
    expect(SHOW_ACTIVE).toBe('SHOW_ACTIVE');
  });

  it('exports SET_VISIBILITY_FILTER constant', () => {
    expect(SET_VISIBILITY_FILTER).toBe('SET_VISIBILITY_FILTER');
  });
});
`,

    "src/state/filters/filters.action.js":
`import { SET_VISIBILITY_FILTER } from "./filters.type";

export const setVisibilityFilter = (filter) => ({
  type: SET_VISIBILITY_FILTER,
  filter,
});
`,

    "src/state/filters/filters.action.test.js":
`import { setVisibilityFilter } from './filters.action';
import { SET_VISIBILITY_FILTER } from './filters.type';

describe('filters actions', () => {
  it('should create a setVisibilityFilter action', () => {
    const filter = 'SHOW_ALL';
    const action = setVisibilityFilter(filter);
    expect(action.type).toBe(SET_VISIBILITY_FILTER);
    expect(action.filter).toBe(filter);
  });

  it('should create a setVisibilityFilter action with SHOW_COMPLETED', () => {
    const filter = 'SHOW_COMPLETED';
    const action = setVisibilityFilter(filter);
    expect(action.type).toBe(SET_VISIBILITY_FILTER);
    expect(action.filter).toBe(filter);
  });

  it('should create a setVisibilityFilter action with SHOW_ACTIVE', () => {
    const filter = 'SHOW_ACTIVE';
    const action = setVisibilityFilter(filter);
    expect(action.type).toBe(SET_VISIBILITY_FILTER);
    expect(action.filter).toBe(filter);
  });
});
`,

    "src/state/filters/filters.initial.js":
`import { SHOW_ACTIVE, SHOW_ALL, SHOW_COMPLETED } from "./filters.type";

const initialFiltersState = [
  {
    id: SHOW_ALL,
    label: "All",
    selected: true,
  },
  {
    id: SHOW_COMPLETED,
    label: "Completed",
    selected: false,
  },
  {
    id: SHOW_ACTIVE,
    label: "Active",
    selected: false,
  },
];

export default initialFiltersState;
`,

    "src/state/filters/filters.reducer.js":
`import initialFiltersState from "./filters.initial";
import { SET_VISIBILITY_FILTER } from "./filters.type";

const filters = (state = initialFiltersState, action) => {
  switch (action.type) {
    case SET_VISIBILITY_FILTER:
      return state.map((filter) => {
        if(filter.id === action.filter) {
          return {
            ...filter,
            selected: true,
          }
        }
        return { ...filter, selected: false };
      });
    default:
      return state
  }
}

export default filters`,

    "src/state/filters/filters.reducer.test.js":
`import filters from './filters.reducer';
import initialFiltersState from './filters.initial';
import { SET_VISIBILITY_FILTER } from './filters.type';

describe('Filters Reducer', () => {
  it('returns the initial state when action type is not recognized', () => {
    const initialState = [
      { id: 'all', label: 'All', selected: true },
      { id: 'active', label: 'Active', selected: false },
      { id: 'completed', label: 'Completed', selected: false },
    ];
    const action = { type: 'UNKNOWN_ACTION' };
    
    const result = filters(initialState, action);
    expect(result).toBe(initialState);
  });

  it('returns initial state when no state is provided', () => {
    const action = { type: SET_VISIBILITY_FILTER, filter: 'all' };
    const result = filters(undefined, action);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  describe('SET_VISIBILITY_FILTER action', () => {
    it('sets the selected filter to true and others to false for "all"', () => {
      const initialState = [
        { id: 'all', label: 'All', selected: false },
        { id: 'active', label: 'Active', selected: false },
        { id: 'completed', label: 'Completed', selected: true },
      ];
      
      const action = {
        type: SET_VISIBILITY_FILTER,
        filter: 'all',
      };
      
      const result = filters(initialState, action);
      expect(result[0].selected).toBe(true);
      expect(result[1].selected).toBe(false);
      expect(result[2].selected).toBe(false);
    });

    it('sets the selected filter to true and others to false for "active"', () => {
      const initialState = [
        { id: 'all', label: 'All', selected: true },
        { id: 'active', label: 'Active', selected: false },
        { id: 'completed', label: 'Completed', selected: false },
      ];
      
      const action = {
        type: SET_VISIBILITY_FILTER,
        filter: 'active',
      };
      
      const result = filters(initialState, action);
      expect(result[0].selected).toBe(false);
      expect(result[1].selected).toBe(true);
      expect(result[2].selected).toBe(false);
    });

    it('sets the selected filter to true and others to false for "completed"', () => {
      const initialState = [
        { id: 'all', label: 'All', selected: false },
        { id: 'active', label: 'Active', selected: true },
        { id: 'completed', label: 'Completed', selected: false },
      ];
      
      const action = {
        type: SET_VISIBILITY_FILTER,
        filter: 'completed',
      };
      
      const result = filters(initialState, action);
      expect(result[0].selected).toBe(false);
      expect(result[1].selected).toBe(false);
      expect(result[2].selected).toBe(true);
    });

    it('preserves other filter properties when updating selected state', () => {
      const initialState = [
        { id: 'all', label: 'All Items', selected: false },
        { id: 'active', label: 'Active Only', selected: false },
      ];
      
      const action = {
        type: SET_VISIBILITY_FILTER,
        filter: 'all',
      };
      
      const result = filters(initialState, action);
      expect(result[0].id).toBe('all');
      expect(result[0].label).toBe('All Items');
      expect(result[0].selected).toBe(true);
    });
  });
});
`,

    "src/state/filters/filters.selectors.js":
`
export const getSelectedFilter = (state) => state.filters.find((filter) => filter.selected);`,

    "src/state/filters/filters.selectors.test.js":
`import { getSelectedFilter } from './filters.selectors';

describe('Filters Selectors', () => {
  describe('getSelectedFilter', () => {
    it('returns the filter that is selected', () => {
      const state = {
        filters: [
          { id: 'all', label: 'All', selected: false },
          { id: 'active', label: 'Active', selected: true },
          { id: 'completed', label: 'Completed', selected: false },
        ],
      };

      const result = getSelectedFilter(state);
      expect(result.id).toBe('active');
      expect(result.selected).toBe(true);
    });

    it('returns undefined when no filter is selected', () => {
      // In normal usage, one filter should always be selected
      // But we test this edge case for 100% coverage
      const state = {
        filters: [
          { id: 'all', label: 'All', selected: false },
          { id: 'active', label: 'Active', selected: false },
        ],
      };

      expect(getSelectedFilter(state)).toBeUndefined();
    });

    it('returns undefined when no filters are provided', () => {
      const state = { filters: [] };
      const result = getSelectedFilter(state);
      expect(result).toBeUndefined();
    });
  });
});
`
  };
}
