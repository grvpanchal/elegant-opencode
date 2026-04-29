// fetch-card state-store skill — root store with ajax middleware.
//
// Matches the crud-list state-store file shape (rootReducer.js + index.js +
// rootReducer.test.js) so containers and tests can import from the same
// canonical paths regardless of archetype. The fetch-card variant differs
// only in:
//   - rootReducer combines the entity slice + config (no filters)
//   - createStore wires applyMiddleware(ajaxMiddleware)

export function emit(entity) {
  const slice = entity.slice;
  const Slice = entity.name;

  const rootReducer =
`/* istanbul ignore file */
import { combineReducers } from "redux";
import ${slice} from "./${slice}/${slice}.reducer";
import config from "./config/config.reducer";

export default combineReducers({
  ${slice},
  config,
});
`;

  const index =
`import { createStore, applyMiddleware } from "redux";
import reducer from "./rootReducer";
import ajaxMiddleware from "./middleware/ajax.middleware";

const store = createStore(
  reducer,
  applyMiddleware(ajaxMiddleware)
);

export default store;
`;

  const test =
`import rootReducer from './rootReducer';
import { ${`initial${Slice}State`} } from './${slice}/${slice}.initial';
import initialConfigState from './config/config.initial';

describe('Root Reducer', () => {
  it('returns combined state with all slices on undefined input', () => {
    const action = { type: '@@INIT' };
    const result = rootReducer(undefined, action);
    expect(result).toBeDefined();
    expect(result.${slice}).toBeDefined();
    expect(result.config).toBeDefined();
  });

  it('combines ${slice} slice correctly', () => {
    const initialState = { ${slice}: ${`initial${Slice}State`} };
    const result = rootReducer(initialState, { type: 'UNKNOWN' });
    expect(result.${slice}).toBe(${`initial${Slice}State`});
  });

  it('combines config slice correctly', () => {
    const initialState = { config: initialConfigState };
    const result = rootReducer(initialState, { type: 'UNKNOWN' });
    expect(result.config).toBe(initialConfigState);
  });
});
`;

  return {
    "src/state/index.js": index,
    "src/state/rootReducer.js": rootReducer,
    "src/state/rootReducer.test.js": test
  };
}
