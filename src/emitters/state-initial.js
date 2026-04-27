// state-reducer skill — initial state emitter.
//
// Skill principle: "Initialize with meaningful default values" + "split
// reducers by domain" + the elegant convention of separating the initial
// state into its own `*.initial.js` so reducer tests can import it.
//
// The shape encodes the standard async/error fields used by every elegant
// CRUD slice:
//   isLoading | isActionLoading | isContentLoading | error | items | current
//
// Note the legacy spelling "intialTodoState" (missing 'i') is preserved
// because that's the symbol exported by the chota-react-redux template;
// downstream files reference it. We treat it as part of the skill's
// established API surface.

export function emit(entity) {
  const slice = entity.slice;     // "todo"
  const Slice = entity.name;      // "Todo"
  const symbol = `intial${Slice}State`;
  const items = entity.itemsField || `${slice}Items`;
  const current = entity.currentField || `current${Slice}Item`;

  const initial = `const ${symbol} = {
  isLoading: false,
  isActionLoading: false,
  isContentLoading: false,
  error: '',
  ${items}: [],
  ${current}: {
    text: '',
    id: ''
  }
};

export default ${symbol};
`;

  return {
    [`src/state/${slice}/${slice}.initial.js`]: initial
  };
}
