// Naming helpers shared across all emitters. The conventions are dictated by
// the elegant skills themselves:
//   • Components / services / classes — PascalCase  (ui-atom, ui-molecule,
//     ui-organism skills: "Naming")
//   • Slices / fields / vars        — camelCase    (state-store skill)
//   • Action type CONSTANTS         — UPPER_SNAKE  (state-actions skill)
//
// These are pure string utilities. No emitter logic lives here.

export const pascal = (s) => s[0].toUpperCase() + s.slice(1);
export const camel  = (s) => s[0].toLowerCase() + s.slice(1);
export const upper  = (s) => s.replace(/[A-Z]/g, "_$&").replace(/^_/, "").toUpperCase();

// Action type for an entity operation: "create" + "Todo" → "CREATE_TODO"
export const actionType = (verb, entityName) =>
  `${verb.toUpperCase()}_${entityName.toUpperCase()}`;

// Action creator: "create" + "Todo" → "createTodo"
export const actionCreator = (verb, entityName) =>
  `${camel(verb)}${pascal(entityName)}`;
