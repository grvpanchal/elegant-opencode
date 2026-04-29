// state-actions skill — type-constant emitter (saga-shaped).
//
// Saga template convention: each async operation has THREE phases —
//   <OP>_<ENTITY>          (REQUEST: dispatched by container/UI, watched by saga)
//   <OP>_<ENTITY>_SUCCESS  (PUT by saga on resolution)
//   <OP>_<ENTITY>_ERROR    (PUT by saga on rejection)
// Sync operations (e.g. EDIT) emit only the bare REQUEST type.
//
// `entity.syncOps` lists the sync-only operation verbs. All others get the
// full 3-phase set.

import { actionType } from "./_naming.js";

export function emit(entity) {
  const slice = entity.slice;
  const ops = entity.operations;
  const syncOps = new Set(entity.syncOps || []);

  // Compose the full type list. Sync ops contribute one type; async ops three.
  const typesPerOp = (op) => {
    const base = actionType(op, entity.name);
    if (syncOps.has(op)) return [base];
    return [base, `${base}_SUCCESS`, `${base}_ERROR`];
  };
  const allTypes = ops.flatMap(typesPerOp);

  const types = allTypes.map((t) => `export const ${t} = "${t}"`).join("\n");

  const importList = allTypes.map((t) => `  ${t},`).join("\n");
  const testCases = allTypes
    .map((t) => `  it('exports ${t}', () => { expect(${t}).toBe('${t}'); });`)
    .join("\n");

  const test =
`import {
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
