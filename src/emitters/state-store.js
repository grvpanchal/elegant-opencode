// state-store skill — root reducer + store wiring.
//
// Skill principles:
//   • "Single source of truth" — one createStore for the whole app
//   • "State is read-only" — store handed to components via Provider
//   • "Pure reducer updates" — combineReducers composes domain slices
//
// Emits three files:
//   src/state/rootReducer.js        combineReducers({ entity, filters, config })
//   src/state/index.js              createStore(reducer, devtools)
//   src/state/rootReducer.test.js   covers init + combination of slices

export function emit(entity) {
  const slice = entity.slice;
  const Slice = entity.name;

  const rootReducer = `/* istanbul ignore file */
import { combineReducers } from "redux";
import ${slice} from "./${slice}/${slice}.reducer";
import filters from "./filters/filters.reducer";
import config from "./config/config.reducer";

export default combineReducers({
  ${slice},
  filters,
  config,
});
`;

  const index = `import { createStore } from "redux";

import reducer from "./rootReducer";

const store = createStore(
  reducer,
  window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
);

export default store;
`;

  const test = `import rootReducer from './rootReducer';
import initial${Slice}State from './${slice}/${slice}.initial';
import initialFiltersState from './filters/filters.initial';
import initialConfigState from './config/config.initial';

describe('Root Reducer', () => {
  it('returns combined state with all slices on undefined input', () => {
    const action = { type: '@@INIT' };
    const result = rootReducer(undefined, action);
    
    expect(result).toBeDefined();
    expect(result.${slice}).toBeDefined();
    expect(result.filters).toBeDefined();
    expect(result.config).toBeDefined();
  });

  it('combines ${slice} slice correctly', () => {
    const initialState = { ${slice}: initial${Slice}State };
    const action = { type: 'UNKNOWN' };
    
    const result = rootReducer(initialState, action);
    expect(result.${slice}).toBe(initial${Slice}State);
  });

  it('combines filters slice correctly', () => {
    const initialState = { filters: initialFiltersState };
    const action = { type: 'UNKNOWN' };
    
    const result = rootReducer(initialState, action);
    expect(result.filters).toBe(initialFiltersState);
  });

  it('combines config slice correctly', () => {
    const initialState = { config: initialConfigState };
    const action = { type: 'UNKNOWN' };
    
    const result = rootReducer(initialState, action);
    expect(result.config).toBe(initialConfigState);
  });

  it('maintains separate state for each slice', () => {
    const initialState = {
      ${slice}: initial${Slice}State,
      filters: initialFiltersState,
      config: initialConfigState,
    };
    
    const action = { type: '@@INIT' };
    const result = rootReducer(initialState, action);
    
    expect(result.${slice}).not.toBe(result.filters);
    expect(result.config).not.toBe(result.${slice});
  });
});
`;

  return {
    "src/state/index.js": index,
    "src/state/rootReducer.js": rootReducer,
    "src/state/rootReducer.test.js": test
  };
}
