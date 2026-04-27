// state-actions skill — type-constant emitter.
//
// Skill principle: "Define type constants to prevent typos" + "Use
// descriptive type names ('todos/add')". The elegant convention used by the
// chota-react-redux template is UPPER_SNAKE_CASE constants, one per file
// (`{slice}.type.js`). This emitter encodes that pattern and projects it
// onto entity.operations.

import { actionType } from "./_naming.js";

export function emit(entity) {
  const slice = entity.slice;            // e.g. "todo"
  const E     = entity.name.toUpperCase();
  const ops   = entity.operations;       // e.g. ["create","edit","update","toggle","delete"]

  // Type constants are emitted in the entity's declared operation order.
  const lines = ops
    .map((op) => `export const ${actionType(op, entity.name)} = "${actionType(op, entity.name)}"`)
    .join("\n");

  // Reference template ends type file WITHOUT trailing newline (no \n).
  const types = lines;

  const testCases = ops
    .map((op) => {
      const C = actionType(op, entity.name);
      return `  it('exports ${C} constant', () => {\n    expect(${C}).toBe('${C}');\n  });`;
    })
    .join("\n\n");

  const importList = ops.map((op) => `  ${actionType(op, entity.name)},`).join("\n");

  const test = `import {
${importList}
} from './${slice}.type';

describe('${entity.name} Action Types', () => {
${testCases}
});
`;

  return {
    [`src/state/${slice}/${slice}.type.js`]: types,
    [`src/state/${slice}/${slice}.type.test.js`]: test
  };
}
