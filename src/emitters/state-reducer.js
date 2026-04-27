// state-reducer skill — switch/case reducer + tests.
//
// Skill principles:
//   • "Pure functions" — given (state, action) → next state
//   • "Immutable updates" — never mutate, always spread
//   • "Handle unknown actions" — default branch returns current state
//   • "Single concern per case" — each case does one transition
//
// The reducer body is a switch over OPERATION_PATTERNS[op].reducerCase()
// templates, parameterized by the entity's slot variables. Tests cover the
// initial-state path, unknown-action path, and per-operation branches.

import { actionType } from "./_naming.js";
import { OPERATION_PATTERNS } from "./_operation-patterns.js";

export function emit(entity) {
  const slice = entity.slice;                // "todo"
  const Slice = entity.name;                 // "Todo"
  const noun  = entity.slice;                // iteration var "todo"
  const items = entity.itemsField || `${slice}Items`;
  const current = entity.currentField || `current${Slice}Item`;
  const initialSym = `intial${Slice}State`;
  const ops = entity.operations;

  const TYPE_LIST = ops.map((op) => actionType(op, entity.name)).sort();
  const importTypes = `import ${initialSym} from "./${slice}.initial";\nimport { ${TYPE_LIST.join(", ")} } from "./${slice}.type";\n\n`;

  // Decide whether the reducer body needs a mutable `let {items} = []` decl —
  // it's needed if any operation rebuilds the list (update/toggle/delete).
  const needsList = ops.some((op) => ["update", "toggle", "delete"].includes(op));

  const cases = ops
    .map((op) => {
      const patt = OPERATION_PATTERNS[op];
      if (!patt) throw new Error(`No pattern for operation "${op}"`);
      const TYPE = actionType(op, entity.name);
      return patt.reducerCase({
        TYPE,
        INITIAL: initialSym,
        ITEMS: items,
        CURRENT: current,
        NOUN: noun
      });
    })
    .join("\n");

  const reducer = `${importTypes}const ${slice} = (state = ${initialSym}, action) => {
${needsList ? `  let ${items} = [];\n\n` : ""}  switch (action.type) {
${cases}
    default:
      return state;
  }
};

export default ${slice};
`;

  // Tests — happy paths for each operation, plus initial / unknown branches.
  // Note: blank lines within `it()` bodies are padded with 4 or 6 spaces of
  // trailing whitespace to match the convention used by the elegant template.
  // (\u00a0-style invisible padding indicates Prettier with trailing-comma in
  // tests at indentation level.) We intentionally preserve those spaces.
  const SP4 = "    ";  // top-level it() body blank line
  const SP6 = "      "; // nested describe > it() body blank line

  const test = `import ${slice} from './${slice}.reducer';
import initial${Slice}State from './${slice}.initial';
import { ${TYPE_LIST.join(", ")} } from './${slice}.type';

describe('${Slice} Reducer', () => {
  it('returns the initial state when action type is not recognized', () => {
    const initialState = initial${Slice}State;
    const action = { type: 'UNKNOWN_ACTION' };
${SP4}
    const result = ${slice}(initialState, action);
    expect(result).toBe(initialState);
  });

  it('returns initial state when no state is provided', () => {
    const action = { type: ${actionType(ops[0], entity.name)}, payload: { id: '1', text: 'Test' } };
    const result = ${slice}(undefined, action);
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
  });
${ops.map((op) => testBlockFor(op, entity, slice, items, current)).join("")}});
`;

  return {
    [`src/state/${slice}/${slice}.reducer.js`]: reducer,
    [`src/state/${slice}/${slice}.reducer.test.js`]: test
  };
}

function testBlockFor(op, entity, slice, items, current) {
  const TYPE = actionType(op, entity.name);
  switch (op) {
    case "create":
      return `
  describe('${TYPE} action', () => {
    it('adds a new ${slice} item to the list', () => {
      const initialState = initial${entity.name}State;
      
      const action = {
        type: ${TYPE},
        payload: { id: '1', text: 'New ${entity.name}' },
      };
      
      const result = ${slice}(initialState, action);
      expect(result.${items}.length).toBe(1);
      expect(result.${items}[0].id).toBe('1');
      expect(result.${items}[0].text).toBe('New ${entity.name}');
      expect(result.${items}[0].completed).toBe(false);
    });

    it('preserves existing ${slice} items when adding a new one', () => {
      const initialState = {
        ...initial${entity.name}State,
        ${items}: [
          { id: '1', text: 'Existing ${entity.name}', completed: true },
        ],
      };
      
      const action = {
        type: ${TYPE},
        payload: { id: '2', text: 'New ${entity.name}' },
      };
      
      const result = ${slice}(initialState, action);
      expect(result.${items}.length).toBe(2);
      expect(result.${items}[0].id).toBe('1');
      expect(result.${items}[1].text).toBe('New ${entity.name}');
    });
  });
`;
    case "edit":
      return `
  describe('${TYPE} action', () => {
    it('updates the ${current} with new values', () => {
      const initialState = initial${entity.name}State;
      
      const action = {
        type: ${TYPE},
        payload: { id: '1', text: 'Editing ${entity.name}' },
      };
      
      const result = ${slice}(initialState, action);
      expect(result.${current}.id).toBe('1');
      expect(result.${current}.text).toBe('Editing ${entity.name}');
    });

    it('preserves other state properties when editing', () => {
      const initialState = initial${entity.name}State;
      
      const action = {
        type: ${TYPE},
        payload: { id: '1', text: 'Editing ${entity.name}' },
      };
      
      const result = ${slice}(initialState, action);
      expect(result.isLoading).toBe(false);
      expect(result.${items}.length).toBe(0);
    });
  });
`;
    case "update":
      return `
  describe('${TYPE} action', () => {
    it('updates the text of an existing ${slice} item', () => {
      const initialState = {
        ...initial${entity.name}State,
        ${items}: [
          { id: '1', text: 'Old Text', completed: false },
        ],
      };
      
      const action = {
        type: ${TYPE},
        payload: { id: '1', text: 'New Text' },
      };
      
      const result = ${slice}(initialState, action);
      expect(result.${items}[0].text).toBe('New Text');
    });

    it('resets ${current} after update', () => {
      const initialState = {
        ...initial${entity.name}State,
        ${items}: [{ id: '1', text: 'Test', completed: false }],
        ${current}: { id: '1', text: 'Editing' },
      };
      
      const action = {
        type: ${TYPE},
        payload: { id: '1', text: 'Updated' },
      };
      
      const result = ${slice}(initialState, action);
      expect(result.${current}.text).toBe('');
    });

    it('preserves completed status when updating text', () => {
      const initialState = {
        ...initial${entity.name}State,
        ${items}: [
          { id: '1', text: 'Old Text', completed: true },
        ],
      };
      
      const action = {
        type: ${TYPE},
        payload: { id: '1', text: 'New Text' },
      };
      
      const result = ${slice}(initialState, action);
      expect(result.${items}[0].completed).toBe(true);
    });

    it('preserves other ${slice} items when updating one', () => {
      const initialState = {
        ...initial${entity.name}State,
        ${items}: [
          { id: '1', text: '${entity.name} 1', completed: false },
          { id: '2', text: '${entity.name} 2', completed: true },
        ],
      };
      
      const action = {
        type: ${TYPE},
        payload: { id: '1', text: 'Updated ${entity.name} 1' },
      };
      
      const result = ${slice}(initialState, action);
      expect(result.${items}[0].text).toBe('Updated ${entity.name} 1');
      expect(result.${items}[1].text).toBe('${entity.name} 2');
      expect(result.${items}[1].completed).toBe(true);
    });
  });
`;
    case "toggle":
      return `
  describe('${TYPE} action', () => {
    it('toggles the completed status of a ${slice} item', () => {
      const initialState = {
        ...initial${entity.name}State,
        ${items}: [
          { id: '1', text: 'Test ${entity.name}', completed: false },
        ],
      };
      
      const action = {
        type: ${TYPE},
        payload: { id: '1' },
      };
      
      const result = ${slice}(initialState, action);
      expect(result.${items}[0].completed).toBe(true);
    });

    it('toggles from true to false', () => {
      const initialState = {
        ...initial${entity.name}State,
        ${items}: [
          { id: '1', text: 'Test ${entity.name}', completed: true },
        ],
      };
      
      const action = {
        type: ${TYPE},
        payload: { id: '1' },
      };
      
      const result = ${slice}(initialState, action);
      expect(result.${items}[0].completed).toBe(false);
    });

    it('only toggles the matching ${slice} item', () => {
      const initialState = {
        ...initial${entity.name}State,
        ${items}: [
          { id: '1', text: '${entity.name} 1', completed: false },
          { id: '2', text: '${entity.name} 2', completed: true },
        ],
      };
      
      const action = {
        type: ${TYPE},
        payload: { id: '1' },
      };
      
      const result = ${slice}(initialState, action);
      expect(result.${items}[0].completed).toBe(true);
      expect(result.${items}[1].completed).toBe(true);
    });
  });
`;
    case "delete":
      return `
  describe('${TYPE} action', () => {
    it('removes a ${slice} item from the list', () => {
      const initialState = {
        ...initial${entity.name}State,
        ${items}: [
          { id: '1', text: '${entity.name} to delete', completed: false },
          { id: '2', text: 'Keep this', completed: true },
        ],
      };
      
      const action = {
        type: ${TYPE},
        payload: { id: '1' },
      };
      
      const result = ${slice}(initialState, action);
      expect(result.${items}.length).toBe(1);
      expect(result.${items}[0].id).toBe('2');
    });

    it('resets ${current} after delete', () => {
      const initialState = {
        ...initial${entity.name}State,
        ${items}: [{ id: '1', text: 'Test' }],
        ${current}: { id: '1', text: 'Editing' },
      };
      
      const action = {
        type: ${TYPE},
        payload: { id: '1' },
      };
      
      const result = ${slice}(initialState, action);
      expect(result.${current}.text).toBe('');
    });

    it('handles deleting non-existent item gracefully', () => {
      const initialState = {
        ...initial${entity.name}State,
        ${items}: [
          { id: '1', text: 'Keep this', completed: false },
        ],
      };
      
      const action = {
        type: ${TYPE},
        payload: { id: '99' },
      };
      
      const result = ${slice}(initialState, action);
      expect(result.${items}.length).toBe(1);
    });
  });
`;
    default:
      return `
  describe('${TYPE} action', () => {
    it('processes ${TYPE}', () => {
      const result = ${slice}(initial${entity.name}State, { type: ${TYPE}, payload: {} });
      expect(result).toBeDefined();
    });
  });
`;
  }
}
