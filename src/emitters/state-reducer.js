// state-reducer skill — saga-shaped switch/case reducer + tests.
//
// For each entity operation:
//   - sync ops emit one case (the request).
//   - async ops emit three cases (REQUEST / SUCCESS / ERROR).
//   - toggle and delete share fall-through cases for SUCCESS and ERROR
//     (the saga template fuses them: "case TOGGLE_X_SUCCESS: case DELETE_X_SUCCESS:")
//     so we emit the merged pair when both ops are present.
//
// Skill principles preserved:
//   • Pure functions    — (state, action) → next state, no side effects
//   • Immutable updates — never mutate, always spread
//   • Default branch    — returns the current state untouched
//   • toggleCheckedState helper imported from the same slice's helper.js

import { actionType, pascal } from "./_naming.js";
import {
  SAGA_OPS,
  reducerToggleDeleteSuccessMerged,
  reducerToggleDeleteErrorMerged
} from "./_operation-patterns.js";

const CASE_ORDER = ["read", "create", "edit", "update", "toggle", "delete"];

function inCaseOrder(ops) {
  return [...ops].sort((a, b) => CASE_ORDER.indexOf(a) - CASE_ORDER.indexOf(b));
}

export function emit(entity) {
  const slice = entity.slice;
  const E = entity.name;
  const items = entity.itemsField || `${slice}Items`;
  const current = entity.currentField || `current${E}Item`;
  const initialSym = `intial${E}State`;
  const ops = inCaseOrder(entity.operations);
  const syncOps = new Set(entity.syncOps || ["edit"]);

  const slot = {
    ITEMS: items,
    CURRENT: current,
    INITIAL: initialSym,
    NOUN: slice,
    ITEMS_PASCAL: pascal(items)
  };

  const allTypes = ops.flatMap((op) => {
    const base = actionType(op, E);
    if (syncOps.has(op)) return [base];
    return [base, `${base}_SUCCESS`, `${base}_ERROR`];
  }).sort();

  const importLines = [
    'import { toggleCheckedState } from "./' + slice + '.helper";',
    `import ${initialSym} from "./${slice}.initial";`,
    `import {`,
    ...allTypes.map((t) => `  ${t},`),
    `} from "./${slice}.type";`
  ].join("\n");

  const hasToggle = ops.includes("toggle");
  const hasDelete = ops.includes("delete");

  const cases = [];

  for (const op of ops) {
    const patt = SAGA_OPS[op];
    if (!patt) throw new Error(`No saga pattern for op "${op}"`);
    const T = { BASE: actionType(op, E), E };

    cases.push(patt.reducerRequest({ T, slot }));

    if (patt.sync) continue;

    // For toggle/delete we delay SUCCESS/ERROR to a merged block at the end
    // (saga template fuses them via fall-through cases).
    const isMerged = (op === "toggle" || op === "delete") && hasToggle && hasDelete;
    if (!isMerged) {
      const succ = patt.reducerSuccess?.({ T, slot });
      if (succ) cases.push(succ);
      const err = patt.reducerError?.({ T, slot });
      if (err) cases.push(err);
    }
  }

  if (hasToggle && hasDelete) {
    const T = { E, ITEMS: slot.ITEMS, ITEMS_PASCAL: slot.ITEMS_PASCAL };
    cases.push(reducerToggleDeleteSuccessMerged(T));
    cases.push(reducerToggleDeleteErrorMerged(T));
  }

  // Whether the reducer body needs a mutable `let items = []` decl.
  const needsList = ops.some((op) => ["update", "toggle", "delete"].includes(op));

  const reducer =
`${importLines}

const ${slice} = (state = ${initialSym}, action) => {
  ${needsList ? `let ${items} = [];\n\n  ` : ""}switch (action.type) {
${cases.join("\n")}
    default:
      return state;
  }
};

export default ${slice};
`;

  // Tests — minimal but cover initial + every request type.
  const test =
`import ${slice} from './${slice}.reducer';
import ${initialSym} from './${slice}.initial';
import {
${ops.map((op) => `  ${actionType(op, E)},`).join("\n")}
} from './${slice}.type';

describe('${slice} reducer', () => {
  it('returns initial state for unknown action', () => {
    expect(${slice}(undefined, { type: 'NOPE' })).toEqual(${initialSym});
  });

${ops
    .map((op) => {
      const T = actionType(op, E);
      const payload = op === "create" ? "{ text: 't', completed: false }" :
                      op === "delete" ? "{ id: 1 }" :
                      "{ id: 1, text: 't' }";
      return `  it('handles ${T}', () => {
    const next = ${slice}(${initialSym}, { type: ${T}, payload: ${payload} });
    expect(next).toBeDefined();
  });`;
    })
    .join("\n\n")}
});
`;

  return {
    [`src/state/${slice}/${slice}.reducer.js`]: reducer,
    [`src/state/${slice}/${slice}.reducer.test.js`]: test
  };
}
