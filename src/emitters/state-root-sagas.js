// state-saga skill — rootSaga composer.
//
// Imports each slice's watch<Entity>() and yields them in `all([...])` so the
// saga middleware runs every watcher concurrently.

export function emit(entity) {
  const slice = entity.slice;
  const E = entity.name;

  const rootSagas =
`import { all } from "redux-saga/effects";
import { watch${E}s } from "./${slice}/${slice}.operations";

export default function* rootSaga() {
  yield all([
    watch${E}s(),
  ]);
}
`;

  const test =
`import rootSaga from './rootSagas';

describe('rootSaga', () => {
  it('is a generator function', () => {
    expect(typeof rootSaga).toBe('function');
    const gen = rootSaga();
    expect(typeof gen.next).toBe('function');
  });
});
`;

  return {
    "src/state/rootSagas.js": rootSagas,
    "src/state/rootSagas.test.js": test
  };
}
