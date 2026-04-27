// Encoded knowledge from the state-actions + state-reducer skills.
//
// Each operation verb has a canonical (action-creator-signature × reducer-
// body-template) pair, applied to the entity name. The entity-schema agent
// only needs to choose which verbs the entity supports; the deterministic
// emitters apply these templates to produce the actual code.
//
// All slot variables are passed in by the emitter (TYPE, INITIAL, ITEMS,
// CURRENT, ID_VAR) so the same patterns work for any entity (Todo, Note,
// Task, Comment, …) — the patterns only know "the items list" and "the
// currently-edited item", never the specific noun.

export const OPERATION_PATTERNS = {
  // create: append a new item to the list, auto-incrementing id.
  create: {
    creatorArg: "text",
    creatorBody: ({ TYPE, ID_VAR }) =>
      `({\n  type: ${TYPE},\n  payload: {\n    id: ${ID_VAR}++,\n    text,\n  },\n})`,
    reducerCase: ({ TYPE, ITEMS }) => `    case ${TYPE}:
      return {
        ...state,
        ${ITEMS}: [
          ...state.${ITEMS},
          {
            id: action.payload.id,
            text: action.payload.text,
            completed: false,
          },
        ],
      };`
  },

  // edit: stage an item into currentItem (no list mutation).
  edit: {
    creatorArg: "payload",
    creatorBody: ({ TYPE }) => `({\n  type: ${TYPE},\n  payload,\n})`,
    reducerCase: ({ TYPE, CURRENT }) => `    case ${TYPE}:
      return {
        ...state,
        ${CURRENT}: action.payload,
      };`
  },

  // update: write currentItem back into the list, then clear currentItem.
  update: {
    creatorArg: "payload",
    creatorBody: ({ TYPE }) => `({\n  type: ${TYPE},\n  payload,\n})`,
    reducerCase: ({ TYPE, INITIAL, ITEMS, CURRENT, NOUN }) => `    case ${TYPE}:
      ${ITEMS} = state.${ITEMS}.map((${NOUN}) =>
        ${NOUN}.id === action.payload.id
          ? { ...${NOUN}, text: action.payload.text }
          : ${NOUN}
      );
      return {
        ...state,
        ${ITEMS},
        ${CURRENT}: ${INITIAL}.${CURRENT},
      };`
  },

  // toggle: flip the completed flag for one item by id.
  toggle: {
    creatorArg: "payload",
    creatorBody: ({ TYPE }) => `({\n  type: ${TYPE},\n  payload,\n})`,
    reducerCase: ({ TYPE, ITEMS, NOUN }) => `    case ${TYPE}:
      ${ITEMS} = state.${ITEMS}.map((${NOUN}) => {
        return ${NOUN}.id === action.payload.id
          ? { ...${NOUN}, completed: !${NOUN}.completed }
          : ${NOUN}
      });
      return {
        ...state,
        ${ITEMS},
      };`
  },

  // delete: remove an item by id, then clear currentItem.
  delete: {
    creatorArg: "id",
    creatorBody: ({ TYPE }) => `({\n  type: ${TYPE},\n  payload: { id },\n})`,
    reducerCase: ({ TYPE, INITIAL, ITEMS, CURRENT, NOUN }) => `    case ${TYPE}:
      ${ITEMS} = state.${ITEMS}.filter(
        (${NOUN}) => ${NOUN}.id !== action.payload.id
      );
      return {
        ...state,
        ${ITEMS},
        ${CURRENT}: ${INITIAL}.${CURRENT},
      };`
  }
};
