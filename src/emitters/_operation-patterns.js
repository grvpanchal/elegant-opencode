// Encoded knowledge from the state-actions + state-reducer + state-saga
// (chota-react-saga template) skills.
//
// Each operation verb has saga-shaped action creators (request + success +
// error) and reducer cases for all three phases — except sync ops (e.g.
// "edit") which collapse to a single phase.
//
// All slot variables are passed in by the emitter (TYPE, INITIAL, ITEMS,
// CURRENT) so the same patterns work for any entity (Todo, Note, Task,
// Comment, …).

const TYPE = (op, E) => `${op.toUpperCase()}_${E.toUpperCase()}`;

// Saga action-creator and reducer-case patterns, per operation.
//
// Per-op entry shape:
//   sync             — true for edit only; sync ops emit just the request creator
//   creator          — fn(slot) → string (the request creator definition)
//   successCreator   — fn(slot) → string | null (omit for sync ops)
//   errorCreator     — fn(slot) → string | null (omit for sync ops)
//   reducerRequest   — fn(slot) → string (case body for the REQUEST type)
//   reducerSuccess   — fn(slot) → string | null (case body for SUCCESS)
//   reducerError     — fn(slot) → string | null (case body for ERROR)
//
// `slot` carries: { TYPE_BASE, ITEMS, CURRENT, INITIAL, NOUN, SLICE, ENTITY }.

export const SAGA_OPS = {
  create: {
    sync: false,
    creator: ({ T }) =>
      `export const create${T.E} = (text) => ({\n  type: ${T.BASE},\n  payload: {\n    text,\n    completed: false,\n  },\n});`,
    successCreator: ({ T }) =>
      `export const create${T.E}Success = (payload) => ({\n  type: ${T.BASE}_SUCCESS,\n  payload,\n});`,
    errorCreator: ({ T }) =>
      `export const create${T.E}Error = (error) => ({\n  type: ${T.BASE}_ERROR,\n  error,\n});`,
    reducerRequest: ({ T, slot }) => `    case ${T.BASE}:
      return {
        ...state,
        isLoading: true,
        isActionLoading: true,
        ${slot.CURRENT}: action.payload,
      };`,
    reducerSuccess: ({ T, slot }) => `    case ${T.BASE}_SUCCESS:
      return {
        ...state,
        isLoading: false,
        isActionLoading: false,
        ${slot.ITEMS}: [
          ...state.${slot.ITEMS},
          {
            id: action.payload.id,
            text: action.payload.text,
            completed: false,
          },
        ],
        ${slot.CURRENT}: ${slot.INITIAL}.${slot.CURRENT},
      };`,
    reducerError: ({ T, slot }) => `    case ${T.BASE}_ERROR:
      return {
        ...state,
        isLoading: false,
        isActionLoading: false,
        error: action.error,
        ${slot.CURRENT}: ${slot.INITIAL}.${slot.CURRENT},
      };`
  },

  read: {
    sync: false,
    creator: ({ T }) =>
      `export const read${T.E} = (payload) => ({\n  type: ${T.BASE},\n  payload,\n});`,
    successCreator: ({ T }) =>
      `export const read${T.E}Success = (payload) => ({\n  type: ${T.BASE}_SUCCESS,\n  payload,\n});`,
    errorCreator: ({ T }) =>
      `export const read${T.E}Error = (error) => ({\n  type: ${T.BASE}_ERROR,\n  error,\n});`,
    reducerRequest: ({ T }) => `    case ${T.BASE}:
      return {
        ...state,
        isLoading: true,
        isContentLoading: true,
      };`,
    reducerSuccess: ({ T, slot }) => `    case ${T.BASE}_SUCCESS:
      return {
        ...state,
        isLoading: false,
        isContentLoading: false,
        ${slot.ITEMS}: action.payload,
      };`,
    reducerError: ({ T }) => `    case ${T.BASE}_ERROR:
      return {
        ...state,
        isLoading: false,
        isContentLoading: false,
        error: action.error,
      };`
  },

  edit: {
    sync: true,
    creator: ({ T }) =>
      `export const edit${T.E} = (payload) => ({\n  type: ${T.BASE},\n  payload,\n});`,
    reducerRequest: ({ T, slot }) => `    case ${T.BASE}:
      return {
        ...state,
        ${slot.CURRENT}: action.payload,
      };`
  },

  update: {
    sync: false,
    creator: ({ T }) =>
      `export const update${T.E} = (payload) => ({\n  type: ${T.BASE},\n  payload,\n});`,
    successCreator: ({ T }) =>
      `export const update${T.E}Success = (payload) => ({\n  type: ${T.BASE}_SUCCESS,\n  payload,\n});`,
    errorCreator: ({ T }) =>
      `export const update${T.E}Error = (error) => ({\n  type: ${T.BASE}_ERROR,\n  error,\n});`,
    reducerRequest: ({ T, slot }) => `    case ${T.BASE}:
      ${slot.ITEMS} = state.${slot.ITEMS}.map((${slot.NOUN}) =>
        ${slot.NOUN}.id === action.payload.id
          ? { ...${slot.NOUN}, text: action.payload.text }
          : ${slot.NOUN}
      );
      return {
        ...state,
        isActionLoading: true,
        ${slot.ITEMS},
        ${slot.CURRENT}: action.payload,
      };`,
    reducerSuccess: ({ T, slot }) => `    case ${T.BASE}_SUCCESS:
      return {
        ...state,
        isActionLoading: false,
        ${slot.CURRENT}: ${slot.INITIAL}.${slot.CURRENT},
      };`,
    reducerError: ({ T, slot }) => `    case ${T.BASE}_ERROR:
      return {
        ...state,
        error: action.error,
        isActionLoading: false,
        ${slot.CURRENT}: ${slot.INITIAL}.${slot.CURRENT},
      };`
  },

  toggle: {
    sync: false,
    creator: ({ T }) =>
      `export const toggle${T.E} = (payload) => ({\n  type: ${T.BASE},\n  payload,\n});`,
    successCreator: ({ T }) =>
      `export const toggle${T.E}Success = () => ({\n  type: ${T.BASE}_SUCCESS,\n});`,
    errorCreator: ({ T }) =>
      `export const toggle${T.E}Error = (payload, error) => ({\n  type: ${T.BASE}_ERROR,\n  payload,\n  error,\n});`,
    reducerRequest: ({ T, slot }) => `    case ${T.BASE}:
      ${slot.ITEMS} = state.${slot.ITEMS}.map((${slot.NOUN}) =>
        ${slot.NOUN}.id === action.payload.id
          ? toggleCheckedState(${slot.NOUN})
          : ${slot.NOUN}
      );
      return {
        ...state,
        previousState${slot.ITEMS_PASCAL}: [...state.${slot.ITEMS}],
        ${slot.ITEMS},
      };`,
    reducerSuccess: () => null, // collapsed below with delete
    reducerError: () => null    // collapsed below with delete
  },

  delete: {
    sync: false,
    creator: ({ T }) =>
      `export const delete${T.E} = (id) => ({\n  type: ${T.BASE},\n  payload: { id },\n});`,
    successCreator: ({ T }) =>
      `export const delete${T.E}Success = () => ({\n  type: ${T.BASE}_SUCCESS,\n});`,
    errorCreator: ({ T }) =>
      `export const delete${T.E}Error = (payload, error) => ({\n  type: ${T.BASE}_ERROR,\n  payload,\n  error,\n});`,
    reducerRequest: ({ T, slot }) => `    case ${T.BASE}:
      ${slot.ITEMS} = state.${slot.ITEMS}.filter(
        (${slot.NOUN}) => ${slot.NOUN}.id !== action.payload.id
      );
      return {
        ...state,
        previousState${slot.ITEMS_PASCAL}: [...state.${slot.ITEMS}],
        ${slot.ITEMS},
        ${slot.CURRENT}: ${slot.INITIAL}.${slot.CURRENT},
      };`,
    reducerSuccess: () => null, // collapsed below with toggle
    reducerError: () => null    // collapsed below with toggle
  }
};

// toggle/delete share fall-through SUCCESS and ERROR cases in the reducer
// (the saga template fuses them: "case TOGGLE_X_SUCCESS: case DELETE_X_SUCCESS:").
// These helpers emit the merged case lines.
export function reducerToggleDeleteSuccessMerged(T) {
  return `    case TOGGLE_${T.E.toUpperCase()}_SUCCESS:
    case DELETE_${T.E.toUpperCase()}_SUCCESS:
      return {
        ...state,
        previousState${T.ITEMS_PASCAL}: undefined,
        isLoading: false,
      };`;
}

export function reducerToggleDeleteErrorMerged(T) {
  return `    case TOGGLE_${T.E.toUpperCase()}_ERROR:
    case DELETE_${T.E.toUpperCase()}_ERROR:
      return {
        ...state,
        previousState${T.ITEMS_PASCAL}: undefined,
        isLoading: false,
        error: action.error,
        ${T.ITEMS}: action.payload,
      };`;
}

// Back-compat: older callers imported OPERATION_PATTERNS from this module.
// We re-export the saga-shaped table under that name; the redux-only entries
// are no longer reachable.
export const OPERATION_PATTERNS = SAGA_OPS;

export { TYPE };
