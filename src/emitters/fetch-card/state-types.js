// fetch-card state-actions skill — type-constant emitter.
//
// Skill principle (state-ajax + state-actions): an ajax fetch lifecycle is
// modeled as REQUEST → RECEIVE → FAIL. Three constants per slice, defined as
// UPPER_SNAKE strings. The reducer switches on these.

export function emit(entity) {
  const slice = entity.slice;
  const E = slice.toUpperCase();

  const types =
    `export const REQUEST_${E} = "REQUEST_${E}"\n` +
    `export const RECEIVE_${E} = "RECEIVE_${E}"\n` +
    `export const FAIL_${E} = "FAIL_${E}"`;

  const test =
    `import { REQUEST_${E}, RECEIVE_${E}, FAIL_${E} } from './${slice}.type';\n\n` +
    `describe('${entity.name} Action Types', () => {\n` +
    `  it('exports REQUEST_${E}', () => { expect(REQUEST_${E}).toBe('REQUEST_${E}'); });\n` +
    `  it('exports RECEIVE_${E}', () => { expect(RECEIVE_${E}).toBe('RECEIVE_${E}'); });\n` +
    `  it('exports FAIL_${E}', () => { expect(FAIL_${E}).toBe('FAIL_${E}'); });\n` +
    `});\n`;

  return {
    [`src/state/${slice}/${slice}.type.js`]: types,
    [`src/state/${slice}/${slice}.type.test.js`]: test
  };
}
