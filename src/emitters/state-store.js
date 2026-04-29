// state-store skill — root reducer + store + saga middleware (saga-shaped).
//
// Emits three files (saga template shape):
//   src/state/rootReducer.js        combineReducers({ entity, filters, config })
//   src/state/index.js              createStore + applyMiddleware(sagaMiddleware) +
//                                   composeWithDevTools + sagaMiddleware.run(rootSaga)
//   src/state/rootReducer.test.js   covers init + combination of slices
//
// rootSagas.js is emitted by the state-root-sagas microtask.

export function emit(entity) {
  const slice = entity.slice;
  const Slice = entity.name;

  const rootReducer =
`/* istanbul ignore file */
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

  const index =
`import { composeWithDevTools } from '@redux-devtools/extension'
import { createStore, applyMiddleware } from 'redux'
import createSagaMiddleware from "redux-saga";

import reducer from "./rootReducer";
import sagas from "./rootSagas";

// create the saga middleware
const sagaMiddleware = createSagaMiddleware();
// mount it on the Store
const enhancer = applyMiddleware(sagaMiddleware)
const enhancers = [enhancer];
const composedEnhancers = composeWithDevTools(...enhancers)

const store = createStore(reducer, composedEnhancers);

// then run the saga
sagaMiddleware.run(sagas);

export default store;
`;

  const test =
`import rootReducer from './rootReducer';
import intial${Slice}State from './${slice}/${slice}.initial';
import initialFiltersState from './filters/filters.initial';
import initialConfigState from './config/config.initial';

describe('Root Reducer', () => {
  it('returns combined state with all slices on undefined input', () => {
    const result = rootReducer(undefined, { type: '@@INIT' });
    expect(result).toBeDefined();
    expect(result.${slice}).toBeDefined();
    expect(result.filters).toBeDefined();
    expect(result.config).toBeDefined();
  });

  it('combines ${slice} slice correctly', () => {
    const result = rootReducer({ ${slice}: intial${Slice}State }, { type: 'UNKNOWN' });
    expect(result.${slice}).toBe(intial${Slice}State);
  });

  it('combines filters slice correctly', () => {
    const result = rootReducer({ filters: initialFiltersState }, { type: 'UNKNOWN' });
    expect(result.filters).toBe(initialFiltersState);
  });

  it('combines config slice correctly', () => {
    const result = rootReducer({ config: initialConfigState }, { type: 'UNKNOWN' });
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
