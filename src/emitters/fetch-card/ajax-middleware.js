// fetch-card state-middleware skill — ajax (thunk) middleware.
//
// Skill principle: "Action pipeline" — every action flows through middleware.
// This middleware special-cases function actions (thunks): it invokes them
// with `dispatch` and `getState` so action creators can fire async network
// work. All other actions fall through to the next middleware untouched.
//
// This is the universal redux-thunk shape, encoded as a skill so every
// fetch-card archetype gets the same wiring without hand-rolling it.

export function emit(_entity) {
  const middleware =
`// Thunk middleware. Lets action creators be functions for async work.
const ajaxMiddleware = (store) => (next) => (action) => {
  if (typeof action === "function") {
    return action(store.dispatch, store.getState);
  }
  return next(action);
};

export default ajaxMiddleware;
`;

  const test =
`import ajaxMiddleware from './ajax.middleware';

describe('ajaxMiddleware', () => {
  it('passes plain actions through to next', () => {
    const next = vi.fn();
    const action = { type: 'X' };
    ajaxMiddleware({ dispatch: vi.fn(), getState: vi.fn() })(next)(action);
    expect(next).toHaveBeenCalledWith(action);
  });
  it('invokes thunk actions with dispatch + getState', () => {
    const dispatch = vi.fn();
    const getState = vi.fn(() => ({}));
    const thunk = vi.fn();
    ajaxMiddleware({ dispatch, getState })(vi.fn())(thunk);
    expect(thunk).toHaveBeenCalledWith(dispatch, getState);
  });
});
`;

  return {
    "src/state/middleware/ajax.middleware.js": middleware,
    "src/state/middleware/ajax.middleware.test.js": test
  };
}
