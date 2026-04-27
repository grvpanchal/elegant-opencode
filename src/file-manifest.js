// Per-microtask file manifest.
//
// For every microtask that emits files, we know — from the bound SKILL.md —
// which relPaths MUST be present, which symbols MUST appear in their content,
// and what naming conventions apply. The manifest is the single source of
// truth used to:
//
//   • validate the deterministic emitter output (used in unit tests)
//   • validate variable-agent outputs in production (the LLM agents are
//     tightly bound to the same set of relPaths and structural invariants
//     so small models cannot drift)
//   • generate the prompt for each agent (the relPaths it must produce are
//     listed verbatim in agents/*.md)
//
// Each manifest entry returns: { paths: string[], invariants: Invariant[] }.
//   paths      — exact relPath set the microtask must produce.
//   invariants — list of { path, mustContain: string[], mustNotContain?: string[] }.
//
// If you change a SKILL.md, update the manifest here. The agents/*.md prompts
// pull from this file at build time so they stay in sync.

import { TERMINOLOGY } from "./terminology.js";

// Helpers --------------------------------------------------------------------

function names(entity) {
  const Slice = entity.name;                      // "Todo"
  const slice = entity.slice;                     // "todo"
  const Item = `${Slice}Item`;                    // "TodoItem"
  const FormName = `Add${Slice}Form`;             // "AddTodoForm"
  const ItemsName = `${Slice}Items`;              // "TodoItems"
  const FiltersName = `${Slice}Filters`;
  const ListName = `${Slice}List`;
  const ContainerFilters = `${FiltersName}Container`;
  const ContainerList = `${ListName}Container`;
  return {
    Slice, slice, Item, FormName, ItemsName,
    FiltersName, ListName, ContainerFilters, ContainerList
  };
}

// Manifest builders ----------------------------------------------------------

const BUILDERS = {
  "entity-schema": () => ({ paths: [], invariants: [] }),

  "ui-theme": () => ({
    paths: [
      "src/theme/ColorPalette.js",
      "src/theme/colors.js",
      "src/theme/typography.js",
      "src/theme/dimensions.js",
      "src/theme/index.js"
    ],
    invariants: []
  }),

  "app-shell": () => ({
    paths: [
      "package.json",
      "vite.config.js",
      "index.html",
      "src/main.jsx",
      "src/App.jsx",
      "src/setupTests.js",
      ".gitignore",
      ".storybook/main.js",
      ".storybook/preview.js"
    ],
    invariants: [
      { path: "src/App.jsx", mustContain: ["export default"] },
      { path: "src/main.jsx", mustContain: ["createRoot"] }
    ]
  }),

  "state-types": (entity) => {
    const { slice } = names(entity);
    return {
      paths: [`src/state/${slice}/${slice}.type.js`],
      invariants: entity.operations.map((op) => ({
        path: `src/state/${slice}/${slice}.type.js`,
        mustContain: [`${op.toUpperCase()}_${slice.toUpperCase()}`]
      }))
    };
  },

  "state-initial": (entity) => {
    const { slice } = names(entity);
    return {
      paths: [`src/state/${slice}/${slice}.initial.js`],
      invariants: [
        { path: `src/state/${slice}/${slice}.initial.js`, mustContain: ["export const"] }
      ]
    };
  },

  "state-actions": (entity) => {
    const { slice } = names(entity);
    return {
      paths: [
        `src/state/${slice}/${slice}.actions.js`,
        `src/state/${slice}/${slice}.actions.test.js`
      ],
      invariants: [
        {
          path: `src/state/${slice}/${slice}.actions.js`,
          mustContain: entity.operations.map((op) => `${op}${entity.name}`)
        }
      ]
    };
  },

  "state-reducer": (entity) => {
    const { slice } = names(entity);
    return {
      paths: [
        `src/state/${slice}/${slice}.reducer.js`,
        `src/state/${slice}/${slice}.reducer.test.js`
      ],
      invariants: [
        { path: `src/state/${slice}/${slice}.reducer.js`, mustContain: ["switch", "default"] }
      ]
    };
  },

  "state-selectors": (entity) => {
    const { slice } = names(entity);
    return {
      paths: [
        `src/state/${slice}/${slice}.selectors.js`,
        `src/state/${slice}/${slice}.selectors.test.js`
      ],
      invariants: [
        { path: `src/state/${slice}/${slice}.selectors.js`, mustContain: ["export"] }
      ]
    };
  },

  "filters-slice": () => ({
    paths: [
      "src/state/filters/filters.type.js",
      "src/state/filters/filters.initial.js",
      "src/state/filters/filters.actions.js",
      "src/state/filters/filters.actions.test.js",
      "src/state/filters/filters.reducer.js",
      "src/state/filters/filters.reducer.test.js",
      "src/state/filters/filters.selectors.js",
      "src/state/filters/filters.selectors.test.js"
    ],
    invariants: []
  }),

  "config-slice": () => ({
    paths: [
      "src/state/config/config.type.js",
      "src/state/config/config.initial.js",
      "src/state/config/config.actions.js",
      "src/state/config/config.actions.test.js",
      "src/state/config/config.reducer.js",
      "src/state/config/config.reducer.test.js",
      "src/state/config/config.selectors.js",
      "src/state/config/config.selectors.test.js"
    ],
    invariants: []
  }),

  "state-store": () => ({
    paths: ["src/state/store.js"],
    invariants: [
      { path: "src/state/store.js", mustContain: ["createStore", "combineReducers"] }
    ]
  }),

  "atomic-provider": () => ({
    paths: [
      "src/utils/providers/AtomicProvider.jsx",
      "src/utils/providers/TestProvider.jsx"
    ],
    invariants: [
      { path: "src/utils/providers/AtomicProvider.jsx", mustContain: ["createContext", "Provider"] }
    ]
  }),

  "ui-base-atoms": () => ({
    paths: [
      "src/ui/atoms/Button/Button.component.jsx",
      "src/ui/atoms/Button/Button.stories.js",
      "src/ui/atoms/Button/Button.style.css",
      "src/ui/atoms/Button/Button.test.jsx",
      "src/ui/atoms/Button/Button.type.js",
      "src/ui/atoms/Button/Button.type.test.js",
      "src/ui/atoms/Input/Input.component.jsx",
      "src/ui/atoms/Input/Input.stories.js",
      "src/ui/atoms/Input/Input.style.css",
      "src/ui/atoms/Input/Input.test.jsx",
      "src/ui/atoms/Input/Input.type.js",
      "src/ui/atoms/Input/Input.type.test.js",
      "src/ui/atoms/Image/Image.component.jsx",
      "src/ui/atoms/Image/Image.stories.js",
      "src/ui/atoms/Image/Image.style.css",
      "src/ui/atoms/Image/Image.test.jsx",
      "src/ui/atoms/Image/Image.type.js",
      "src/ui/atoms/Image/Image.type.test.js",
      "src/ui/atoms/Loader/Loader.component.jsx",
      "src/ui/atoms/Loader/Loader.stories.js",
      "src/ui/atoms/Loader/Loader.style.css",
      "src/ui/atoms/Loader/Loader.test.jsx"
    ],
    invariants: []
  }),

  "ui-context-atoms": () => ({
    paths: [
      "src/ui/atoms/IconButton/IconButton.component.jsx",
      "src/ui/atoms/IconButton/IconButton.stories.js",
      "src/ui/atoms/IconButton/IconButton.style.css",
      "src/ui/atoms/IconButton/IconButton.test.jsx",
      "src/ui/atoms/IconButton/IconButton.type.js",
      "src/ui/atoms/IconButton/IconButton.type.test.js",
      "src/ui/atoms/Alert/Alert.component.jsx",
      "src/ui/atoms/Alert/Alert.stories.js",
      "src/ui/atoms/Alert/Alert.style.css",
      "src/ui/atoms/Alert/Alert.test.jsx",
      "src/ui/atoms/Alert/Alert.type.js",
      "src/ui/atoms/Alert/Alert.type.test.js",
      "src/ui/atoms/Link/Link.component.jsx",
      "src/ui/atoms/Link/Link.stories.js",
      "src/ui/atoms/Link/Link.style.css",
      "src/ui/atoms/Link/Link.test.jsx",
      "src/ui/atoms/Link/Link.type.js",
      "src/ui/atoms/Link/Link.type.test.js"
    ],
    invariants: []
  }),

  "ui-domain-atom": (entity) => {
    const { Item } = names(entity);
    const base = `src/ui/atoms/${Item}/${Item}`;
    return {
      paths: [
        `${base}.component.jsx`,
        `${base}.stories.js`,
        `${base}.style.css`,
        `${base}.test.jsx`,
        `${base}.type.js`,
        `${base}.type.test.js`
      ],
      invariants: [
        { path: `${base}.component.jsx`, mustContain: ["export default"] }
      ]
    };
  },

  "ui-skeleton": () => ({
    paths: [
      "src/ui/skeletons/SiteHeaderSkeleton/SiteHeaderSkeleton.component.jsx",
      "src/ui/skeletons/SiteHeaderSkeleton/SiteHeaderSkeleton.style.css",
      "src/ui/skeletons/SiteHeaderSkeleton/SiteHeaderSkeleton.stories.js",
      "src/ui/skeletons/FiltersSkeleton/FiltersSkeleton.component.jsx",
      "src/ui/skeletons/FiltersSkeleton/FiltersSkeleton.style.css",
      "src/ui/skeletons/FiltersSkeleton/FiltersSkeleton.stories.js",
      "src/ui/skeletons/ListSkeleton/ListSkeleton.component.jsx",
      "src/ui/skeletons/ListSkeleton/ListSkeleton.style.css",
      "src/ui/skeletons/ListSkeleton/ListSkeleton.stories.js"
    ],
    invariants: []
  }),

  "ui-layout": () => ({
    paths: [
      "src/ui/templates/Layout/Layout.component.jsx",
      "src/ui/templates/Layout/Layout.stories.js",
      "src/ui/templates/Layout/Layout.style.css",
      "src/ui/templates/Layout/Layout.test.jsx"
    ],
    invariants: [
      { path: "src/ui/templates/Layout/Layout.component.jsx", mustContain: ["export default", "children"] }
    ]
  }),

  "ui-molecule": (entity) => {
    const { FormName, ItemsName } = names(entity);
    const fb = `src/ui/molecules/${FormName}/${FormName}`;
    const ib = `src/ui/molecules/${ItemsName}/${ItemsName}`;
    const fg = `src/ui/molecules/FilterGroup/FilterGroup`;
    return {
      paths: [
        `${fb}.component.jsx`,
        `${fb}.stories.js`,
        `${fb}.test.jsx`,
        `${fg}.component.jsx`,
        `${fg}.stories.js`,
        `${fg}.test.jsx`,
        `${ib}.component.jsx`,
        `${ib}.stories.js`,
        `${ib}.style.css`,
        `${ib}.test.jsx`,
        `${ib}.type.js`,
        `${ib}.type.test.js`
      ],
      invariants: [
        { path: `${fb}.component.jsx`, mustContain: ["export default"] },
        { path: `${ib}.component.jsx`, mustContain: ["export default"] }
      ]
    };
  },

  "ui-organism": (entity) => {
    const { FiltersName, ListName } = names(entity);
    const sh = "src/ui/organisms/SiteHeader/SiteHeader";
    const fb = `src/ui/organisms/${FiltersName}/${FiltersName}`;
    const lb = `src/ui/organisms/${ListName}/${ListName}`;
    return {
      paths: [
        `${sh}.component.jsx`,
        `${sh}.stories.js`,
        `${sh}.style.css`,
        `${sh}.test.jsx`,
        `${fb}.component.jsx`,
        `${fb}.stories.js`,
        `${fb}.test.jsx`,
        `${lb}.component.jsx`,
        `${lb}.stories.js`,
        `${lb}.test.jsx`
      ],
      invariants: [
        { path: `${sh}.component.jsx`, mustContain: ["export default"] },
        { path: `${fb}.component.jsx`, mustContain: ["export default"] },
        { path: `${lb}.component.jsx`, mustContain: ["export default"] }
      ]
    };
  },

  container: (entity) => {
    const { ContainerFilters, ContainerList } = names(entity);
    return {
      paths: [
        "src/containers/ConfigContainer.js",
        "src/containers/ConfigContainer.test.jsx",
        "src/containers/SiteHeaderContainer.jsx",
        "src/containers/SiteHeaderContainer.test.jsx",
        `src/containers/${ContainerFilters}.jsx`,
        `src/containers/${ContainerFilters}.test.jsx`,
        `src/containers/${ContainerList}.jsx`,
        `src/containers/${ContainerList}.test.jsx`
      ],
      invariants: [
        { path: "src/containers/SiteHeaderContainer.jsx", mustContain: ["useSelector", "useDispatch"] },
        { path: `src/containers/${ContainerList}.jsx`, mustContain: ["useSelector", "useDispatch"] }
      ]
    };
  },

  page: () => ({
    paths: [
      "src/pages/HomePage/HomePage.component.jsx",
      "src/pages/HomePage/HomePage.style.css",
      "src/pages/HomePage/HomePage.test.jsx"
    ],
    invariants: [
      { path: "src/pages/HomePage/HomePage.component.jsx", mustContain: ["export default", "Layout"] }
    ]
  })
};

export function manifestFor(microtask, entity) {
  const builder = BUILDERS[microtask];
  if (!builder) {
    if (TERMINOLOGY[microtask]) return { paths: [], invariants: [] };
    throw new Error(`No file manifest for microtask "${microtask}"`);
  }
  return builder(entity || {});
}

// Validate a `{ files: {...} }` payload against the microtask's manifest.
// Returns `{ ok, errors }`. Errors is a list of human-readable strings.
export function validateFiles(microtask, entity, payload) {
  const errors = [];
  if (!payload || typeof payload !== "object") {
    return { ok: false, errors: ["payload is not an object"] };
  }
  if (!payload.files || typeof payload.files !== "object") {
    return { ok: false, errors: ["payload.files is missing or not an object"] };
  }
  const m = manifestFor(microtask, entity);
  const got = new Set(Object.keys(payload.files));
  const want = new Set(m.paths);

  for (const p of want) {
    if (!got.has(p)) errors.push(`missing required file: ${p}`);
  }
  for (const p of got) {
    if (!want.has(p)) errors.push(`unexpected file: ${p}`);
    else {
      const v = payload.files[p];
      if (typeof v !== "string" || v.length === 0) {
        errors.push(`file "${p}" must be a non-empty string`);
      }
    }
  }
  for (const inv of m.invariants) {
    const v = payload.files[inv.path];
    if (typeof v !== "string") continue; // already reported above
    for (const needle of inv.mustContain || []) {
      if (!v.includes(needle)) {
        errors.push(`file "${inv.path}" must contain "${needle}"`);
      }
    }
    for (const needle of inv.mustNotContain || []) {
      if (v.includes(needle)) {
        errors.push(`file "${inv.path}" must NOT contain "${needle}"`);
      }
    }
  }
  return { ok: errors.length === 0, errors };
}
