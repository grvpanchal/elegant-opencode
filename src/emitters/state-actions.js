// state-actions skill — action creator emitter.
//
// Skill principles:
//   • "Use action creators to encapsulate creation"
//   • "Plain serializable objects" (no thunks, no functions in payloads)
//   • "Action types as constants" — imported from .type.js
//
// The emitter applies OPERATION_PATTERNS to entity.operations and the entity
// name. Result: one creator per operation, all ESM-exported.

import { actionType, actionCreator } from "./_naming.js";
import { OPERATION_PATTERNS } from "./_operation-patterns.js";

// Action creators are written in a CRUD-canonical order:
//   create → edit → update → delete → toggle.
// This order falls out of the state-actions skill section "Group related
// creators" and gives stable, lint-friendly output regardless of how the
// caller orders entity.operations.
const CREATOR_ORDER = ["create", "edit", "update", "delete", "toggle"];
function inCreatorOrder(ops) {
  return [...ops].sort(
    (a, b) => (CREATOR_ORDER.indexOf(a) - CREATOR_ORDER.indexOf(b))
  );
}

export function emit(entity) {
  const slice = entity.slice;
  const ops = inCreatorOrder(entity.operations);
  const idVar = "next" + entity.name + "Id";

  const TYPE_LIST = ops.map((op) => actionType(op, entity.name)).sort();
  const importTypes = `import { ${TYPE_LIST.join(", ")} } from "./${slice}.type";\n\n`;

  const idDecl = ops.includes("create") ? `let ${idVar} = 0;\n` : "";

  const creators = ops
    .map((op) => {
      const patt = OPERATION_PATTERNS[op];
      if (!patt) throw new Error(`No pattern for operation "${op}"`);
      const TYPE = actionType(op, entity.name);
      const body = patt.creatorBody({ TYPE, ID_VAR: idVar });
      return `export const ${actionCreator(op, entity.name)} = (${patt.creatorArg}) =>${body.startsWith("(") ? " " + body : "\n  " + body};`;
    })
    .join("\n\n");

  const actions = importTypes + idDecl + creators + "\n";

  // Tests: one happy-path assertion per creator.
  const importCreators = ops.map((op) => actionCreator(op, entity.name)).join(", ");
  // Type imports in the test file follow the same CRUD-canonical order as the
  // creators (not alphabetical, unlike the actions.js source). This matches
  // the elegant template convention.
  const importTypesTest = ops.map((op) => actionType(op, entity.name)).join(", ");

  const testBlocks = ops
    .map((op) => {
      const TYPE = actionType(op, entity.name);
      const create = actionCreator(op, entity.name);
      const arg = OPERATION_PATTERNS[op].creatorArg;
      switch (op) {
        case "create":
          return `  it('should create a ${create} action', () => {
    const action = ${create}('Learn Redux');
    expect(action.type).toBe(${TYPE});
    expect(action.payload).toHaveProperty('id');
    expect(action.payload.text).toBe('Learn Redux');
  });

  it('should create incrementing ids for ${create} actions', () => {
    const action1 = ${create}('First');
    const action2 = ${create}('Second');
    expect(action2.payload.id).toBe(action1.payload.id + 1);
  });`;
        case "delete":
          return `  it('should create a ${create} action', () => {
    const action = ${create}(1);
    expect(action.type).toBe(${TYPE});
    expect(action.payload).toEqual({ id: 1 });
  });`;
        case "edit":
        case "update":
          return `  it('should create an ${create} action', () => {
    const payload = { id: 1, text: '${op === "update" ? "Updated" : "Edit"}' };
    const action = ${create}(payload);
    expect(action.type).toBe(${TYPE});
    expect(action.payload).toEqual(payload);
  });`;
        case "toggle":
          return `  it('should create a ${create} action', () => {
    const payload = { id: 1 };
    const action = ${create}(payload);
    expect(action.type).toBe(${TYPE});
    expect(action.payload).toEqual(payload);
  });`;
        default:
          return `  it('should create a ${create} action', () => {
    const action = ${create}({});
    expect(action.type).toBe(${TYPE});
  });`;
      }
    })
    .join("\n\n");

  const test = `import { ${importCreators} } from './${slice}.actions';
import { ${importTypesTest} } from './${slice}.type';

describe('${slice} actions', () => {
${testBlocks}
});
`;

  return {
    [`src/state/${slice}/${slice}.actions.js`]: actions,
    [`src/state/${slice}/${slice}.actions.test.js`]: test
  };
}
