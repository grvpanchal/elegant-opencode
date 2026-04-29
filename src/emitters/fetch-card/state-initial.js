// fetch-card state-reducer skill — initial state emitter.
//
// Ajax slices have a uniform shape: { data, loading, error, query }. The
// data slot is null until the first successful response; loading is the
// in-flight flag; error captures the last failure; query is the user's last
// input so a refresh can re-fire without re-prompting.

export function emit(entity) {
  const slice = entity.slice;

  const initial =
    `export const initial${capitalize(slice)}State = {\n` +
    `  data: null,\n` +
    `  loading: false,\n` +
    `  error: null,\n` +
    `  query: ""\n` +
    `};\n`;

  return {
    [`src/state/${slice}/${slice}.initial.js`]: initial
  };
}

function capitalize(s) {
  return s[0].toUpperCase() + s.slice(1);
}
