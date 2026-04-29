// Per-microtask file manifest, archetype-keyed.
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
// Manifests differ by archetype where the file set differs. crud-list is the
// default; fetch-card overrides only the entries that change.

import { archetypeOf, getTerminology } from "./terminology.js";

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

function fetchNames(entity) {
  const Slice = entity.name;                      // "Weather"
  const slice = entity.slice;                     // "weather"
  const Card = `${Slice}Card`;                    // "WeatherCard"
  const QueryForm = `${Slice}QueryForm`;          // "WeatherQueryForm"
  const View = `${Slice}View`;                    // "WeatherView"
  const ViewContainer = `${View}Container`;       // "WeatherViewContainer"
  return { Slice, slice, Card, QueryForm, View, ViewContainer };
}

// Archetype-shared manifest builders (always identical across archetypes) ----

const SHARED_BUILDERS = {
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

  "state-initial": (entity) => {
    const { slice } = names(entity);
    return {
      paths: [`src/state/${slice}/${slice}.initial.js`],
      invariants: [
        { path: `src/state/${slice}/${slice}.initial.js`, mustContain: ["export const"] }
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

  "state-store": () => ({
    paths: ["src/state/store.js"],
    invariants: [
      { path: "src/state/store.js", mustContain: ["createStore", "combineReducers"] }
    ]
  }),

  "page": () => ({
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

// crud-list-specific manifests ----------------------------------------------

const CRUD_LIST_BUILDERS = {
  ...SHARED_BUILDERS,

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
  }
};

// fetch-card-specific manifests ---------------------------------------------
// state-actions encode REQUEST / RECEIVE / FAIL; state-store deps include
// ajax-middleware instead of filters-slice; UI is a single QueryForm + Card
// composition (no filter group, no list).

const FETCH_CARD_BUILDERS = {
  ...SHARED_BUILDERS,

  "state-types": (entity) => {
    const { slice } = fetchNames(entity);
    return {
      paths: [`src/state/${slice}/${slice}.type.js`],
      invariants: [
        { path: `src/state/${slice}/${slice}.type.js`, mustContain: [`REQUEST_${slice.toUpperCase()}`, `RECEIVE_${slice.toUpperCase()}`, `FAIL_${slice.toUpperCase()}`] }
      ]
    };
  },

  "state-actions": (entity) => {
    const { slice, Slice } = fetchNames(entity);
    return {
      paths: [
        `src/state/${slice}/${slice}.actions.js`,
        `src/state/${slice}/${slice}.actions.test.js`
      ],
      invariants: [
        { path: `src/state/${slice}/${slice}.actions.js`, mustContain: [`request${Slice}`, `receive${Slice}`, `fail${Slice}`] }
      ]
    };
  },

  "state-reducer": (entity) => {
    const { slice } = fetchNames(entity);
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

  "ajax-middleware": () => ({
    paths: [
      "src/state/middleware/ajax.middleware.js",
      "src/state/middleware/ajax.middleware.test.js"
    ],
    invariants: [
      { path: "src/state/middleware/ajax.middleware.js", mustContain: ["export default"] }
    ]
  }),

  "ui-domain-atom": (entity) => {
    const { Card } = fetchNames(entity);
    const base = `src/ui/atoms/${Card}/${Card}`;
    return {
      paths: [
        `${base}.component.jsx`,
        `${base}.stories.js`,
        `${base}.style.css`,
        `${base}.test.jsx`,
        `${base}.type.js`
      ],
      invariants: [
        { path: `${base}.component.jsx`, mustContain: ["export default"] }
      ]
    };
  },

  "ui-molecule": (entity) => {
    const { QueryForm } = fetchNames(entity);
    const qb = `src/ui/molecules/${QueryForm}/${QueryForm}`;
    return {
      paths: [
        `${qb}.component.jsx`,
        `${qb}.stories.js`,
        `${qb}.test.jsx`,
        `${qb}.style.css`
      ],
      invariants: [
        { path: `${qb}.component.jsx`, mustContain: ["export default", "onSubmit"] }
      ]
    };
  },

  "ui-organism": (entity) => {
    const { View } = fetchNames(entity);
    const sh = "src/ui/organisms/SiteHeader/SiteHeader";
    const vb = `src/ui/organisms/${View}/${View}`;
    return {
      paths: [
        `${sh}.component.jsx`,
        `${sh}.stories.js`,
        `${sh}.style.css`,
        `${sh}.test.jsx`,
        `${vb}.component.jsx`,
        `${vb}.stories.js`,
        `${vb}.test.jsx`
      ],
      invariants: [
        { path: `${sh}.component.jsx`, mustContain: ["export default"] },
        { path: `${vb}.component.jsx`, mustContain: ["export default"] }
      ]
    };
  },

  container: (entity) => {
    const { ViewContainer } = fetchNames(entity);
    return {
      paths: [
        "src/containers/ConfigContainer.js",
        "src/containers/ConfigContainer.test.jsx",
        "src/containers/SiteHeaderContainer.jsx",
        "src/containers/SiteHeaderContainer.test.jsx",
        `src/containers/${ViewContainer}.jsx`,
        `src/containers/${ViewContainer}.test.jsx`
      ],
      invariants: [
        { path: "src/containers/SiteHeaderContainer.jsx", mustContain: ["useSelector", "useDispatch"] },
        { path: `src/containers/${ViewContainer}.jsx`, mustContain: ["useSelector", "useDispatch"] }
      ]
    };
  }
};

const ARCHETYPE_BUILDERS = {
  "crud-list": CRUD_LIST_BUILDERS,
  "fetch-card": FETCH_CARD_BUILDERS
};

export function manifestFor(microtask, entity) {
  const kind = archetypeOf(entity);
  const builders = ARCHETYPE_BUILDERS[kind] || CRUD_LIST_BUILDERS;
  const builder = builders[microtask] || CRUD_LIST_BUILDERS[microtask];
  if (!builder) {
    if (getTerminology(kind, microtask)) return { paths: [], invariants: [] };
    throw new Error(`No file manifest for microtask "${microtask}" in archetype "${kind}"`);
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
