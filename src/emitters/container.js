// server-container skill — emit container components.
//
// Skill principles encoded:
//   • "Smart vs Dumb Separation" — containers do connection (useSelector /
//     useDispatch); they receive nothing through props.
//   • "Data Orchestration" — they assemble selectors + actions and pass
//     `data` + `events` to their organism.
//   • "Reusability Through Separation" — organisms remain pure presentational
//     and reusable; only the container is application-aware.
//
// Four containers emitted for the chota-react-redux output:
//   • ConfigContainer        — reads config slice; applies side effects (theme)
//   • SiteHeaderContainer    — connects SiteHeader organism
//   • {Entity}FiltersContainer — connects {Entity}Filters organism
//   • {Entity}ListContainer    — connects {Entity}List organism
//
// Variable in production: an LLM-backed agent reads the server-container
// SKILL.md + an exemplar to produce the JSX. In sim-llm we use this
// deterministic emitter to project the skill onto entity inputs.

import { actionCreator } from "./_naming.js";

export function emit(entity) {
  const Slice = entity.name;       // "Todo"
  const slice = entity.slice;      // "todo"
  const dataProp = `${slice}Data`;
  const itemsField = entity.itemsField || `${slice}Items`;
  const currentField = entity.currentField || `current${Slice}Item`;
  const FiltersOrg = `${Slice}Filters`;
  const ListOrg = `${Slice}List`;
  const FiltersContainer = `${Slice}FiltersContainer`;
  const ListContainer = `${Slice}ListContainer`;
  const appName = entity.appName || `${Slice} App`;

  const ops = entity.operations;          // ["create","edit","update","toggle","delete"]
  const creators = ops.map((o) => actionCreator(o, entity.name)); // ["createTodo",...]

  const out = {};

  // === ConfigContainer ======================================================
  out["src/containers/ConfigContainer.js"] =
`import { useEffect } from "react";
import { useSelector } from "react-redux";
export default function ConfigContainer() {
  const configData = useSelector((state) => state.config);
  useEffect(() => {
    const bodyClass = document.body.classList;
    configData.theme === 'dark'
      ? bodyClass.add("dark")
      : bodyClass.remove("dark");
  }, [configData.theme]);
  return null;
}
`;

  // Shared default state literal used in container test suites
  const defaultState = `  const defaultState = {
    ${slice}: {
      isLoading: false,
      isActionLoading: false,
      isContentLoading: false,
      error: '',
      ${itemsField}: [],
      ${currentField}: { text: '', id: '' },
    },
    filters: [
      { id: 'SHOW_ALL', label: 'All', selected: true },
      { id: 'SHOW_COMPLETED', label: 'Completed', selected: false },
      { id: 'SHOW_ACTIVE', label: 'Active', selected: false },
    ],
    config: { name: '${appName}', lang: 'en', theme: 'light' },
  };`;

  out["src/containers/ConfigContainer.test.jsx"] =
`import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import rootReducer from '../state/rootReducer';
import ConfigContainer from './ConfigContainer';

const createTestStore = (preloadedState = {}) => {
  return createStore(rootReducer, preloadedState);
};

describe('<ConfigContainer />', () => {
${defaultState}

  beforeEach(() => {
    document.body.classList.remove('dark');
  });

  it('Renders successfully and returns null', () => {
    const store = createTestStore(defaultState);
    const { container } = render(
      <Provider store={store}>
        <ConfigContainer />
      </Provider>,
    );
    expect(container.innerHTML).toBe('');
  });

  it('Adds dark class to body when theme is dark', () => {
    const darkState = {
      ...defaultState,
      config: { ...defaultState.config, theme: 'dark' },
    };
    const store = createTestStore(darkState);
    render(
      <Provider store={store}>
        <ConfigContainer />
      </Provider>,
    );
    expect(document.body.classList.contains('dark')).toBe(true);
  });

  it('Removes dark class from body when theme is light', () => {
    const store = createTestStore(defaultState);
    render(
      <Provider store={store}>
        <ConfigContainer />
      </Provider>,
    );
    expect(document.body.classList.contains('dark')).toBe(false);
  });
});
`;

  // === SiteHeaderContainer ==================================================
  out["src/containers/SiteHeaderContainer.jsx"] =
`import { useDispatch, useSelector } from "react-redux";
import SiteHeader from "../ui/organisms/SiteHeader/SiteHeader.component";
import { updateConfig } from "../state/config/config.actions";
export default function SiteHeaderContainer() {
  const configData = useSelector((state) => state.config);
  const dispatch = useDispatch();
  const events = {
    onThemeChangeClick: () => dispatch(
      updateConfig({ theme: configData.theme === "light" ? "dark" : "light" })
    ),
  };

  const headerData = { brandName: configData.name, theme: configData.theme };
  return (
    <SiteHeader
      headerData={headerData}
      events={events}
    />
  );
}
`;

  out["src/containers/SiteHeaderContainer.test.jsx"] =
`import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import rootReducer from '../state/rootReducer';
import SiteHeaderContainer from './SiteHeaderContainer';

const createTestStore = (preloadedState = {}) => {
  return createStore(rootReducer, preloadedState);
};

describe('<SiteHeaderContainer />', () => {
${defaultState}

  it('Renders successfully', () => {
    const store = createTestStore(defaultState);
    render(
      <Provider store={store}>
        <SiteHeaderContainer />
      </Provider>,
    );
    expect(screen.getByText('${appName}')).toBeInTheDocument();
  });

  it('Displays moon icon for light theme', () => {
    const store = createTestStore(defaultState);
    render(
      <Provider store={store}>
        <SiteHeaderContainer />
      </Provider>,
    );
    expect(screen.getByText('🌙')).toBeInTheDocument();
  });

  it('Displays sun icon for dark theme', () => {
    const darkState = {
      ...defaultState,
      config: { ...defaultState.config, theme: 'dark' },
    };
    const store = createTestStore(darkState);
    render(
      <Provider store={store}>
        <SiteHeaderContainer />
      </Provider>,
    );
    expect(screen.getByText('☀️')).toBeInTheDocument();
  });

  it('Toggles theme when theme toggle is clicked', () => {
    const store = createTestStore(defaultState);
    render(
      <Provider store={store}>
        <SiteHeaderContainer />
      </Provider>,
    );
    const themeToggle = screen.getByRole('button', { name: /🌙/ });
    fireEvent.click(themeToggle);
    const state = store.getState();
    expect(state.config.theme).toBe('dark');
  });

  it('Toggles theme from dark to light', () => {
    const darkState = {
      ...defaultState,
      config: { ...defaultState.config, theme: 'dark' },
    };
    const store = createTestStore(darkState);
    render(
      <Provider store={store}>
        <SiteHeaderContainer />
      </Provider>,
    );
    const themeToggle = screen.getByRole('button', { name: /☀️/ });
    fireEvent.click(themeToggle);
    const state = store.getState();
    expect(state.config.theme).toBe('light');
  });
});
`;

  // === {Entity}FiltersContainer =============================================
  out[`src/containers/${FiltersContainer}.jsx`] =
`import { setVisibilityFilter } from "../state/filters/filters.action";
import ${FiltersOrg} from "../ui/organisms/${FiltersOrg}/${FiltersOrg}.component";
import { useDispatch, useSelector } from "react-redux";

export default function ${FiltersContainer}() {
  const filtersData = useSelector((state) => state.filters);
  const dispatch = useDispatch();

  const events = {
    on${Slice}FilterUpdate: (id) => dispatch(setVisibilityFilter(id)),
  };

  return <${FiltersOrg} filtersData={filtersData} events={events} />;
}
`;

  out[`src/containers/${FiltersContainer}.test.jsx`] =
`import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import rootReducer from '../state/rootReducer';
import ${FiltersContainer} from './${FiltersContainer}';

const createTestStore = (preloadedState = {}) => {
  return createStore(rootReducer, preloadedState);
};

describe('<${FiltersContainer} />', () => {
${defaultState}

  it('Renders successfully', () => {
    const store = createTestStore(defaultState);
    render(
      <Provider store={store}>
        <${FiltersContainer} />
      </Provider>,
    );
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('Renders with loading content state', () => {
    const loadingState = {
      ...defaultState,
      filters: { isContentLoading: true },
    };
    const store = createTestStore(loadingState);
    render(
      <Provider store={store}>
        <${FiltersContainer} />
      </Provider>,
    );
    const skeletons = document.querySelectorAll('.skeleton');
    expect(skeletons.length).toBe(3);
  });

  it('Dispatches setVisibilityFilter action when a filter is clicked', () => {
    const store = createTestStore(defaultState);
    render(
      <Provider store={store}>
        <${FiltersContainer} />
      </Provider>,
    );
    fireEvent.click(screen.getByText('Completed'));
    const state = store.getState();
    const completedFilter = state.filters.find(f => f.id === 'SHOW_COMPLETED');
    expect(completedFilter.selected).toBe(true);
    const allFilter = state.filters.find(f => f.id === 'SHOW_ALL');
    expect(allFilter.selected).toBe(false);
  });
});
`;

  // === {Entity}ListContainer ================================================
  // Build the list of action imports in order of operations
  // Action creators are imported in alphabetical order (linter convention)
  const importLines = [...creators].sort().map((c) => `  ${c},`).join("\n");

  // Map verbs to event handler shape
  // events object structure:
  // onTodoCreate: (payload) => dispatch(createTodo(payload)),
  // onTodoEdit: (payload) => dispatch(editTodo(payload)),
  // onTodoUpdate: (text) => dispatch(updateTodo({ id: todoData.currentTodoItem.id, text })),
  // onTodoToggleUpdate: (id) => dispatch(toggleTodo(id)),
  // onTodoDelete: (payload) => dispatch(deleteTodo(payload)),
  const eventLines = ops.map((op) => {
    const handler = op === "toggle" ? `on${Slice}ToggleUpdate` : `on${Slice}${op[0].toUpperCase()}${op.slice(1)}`;
    const creator = actionCreator(op, entity.name);
    if (op === "update") {
      return `    ${handler}: (text) =>\n      dispatch(${creator}({ id: ${dataProp}.${currentField}.id, text })),`;
    } else if (op === "toggle") {
      return `    ${handler}: (id) => dispatch(${creator}(id)),`;
    } else {
      return `    ${handler}: (payload) => dispatch(${creator}(payload)),`;
    }
  }).join("\n");

  out[`src/containers/${ListContainer}.jsx`] =
`import ${ListOrg} from "../ui/organisms/${ListOrg}/${ListOrg}.component";
import { useDispatch, useSelector } from "react-redux";
import {
${importLines}
} from "../state/${slice}/${slice}.actions";
import { getSelectedFilter } from "../state/filters/filters.selectors";
import { getVisible${Slice}s } from "../state/${slice}/${slice}.selectors";

export default function ${ListContainer}() {
  const dispatch = useDispatch();
  const selectedFilter = useSelector(getSelectedFilter);
  const ${dataProp} = useSelector((state) =>
    getVisible${Slice}s(state.${slice}, selectedFilter.id)
  );

  const events = {
${eventLines}
  };

  return <${ListOrg} ${dataProp}={${dataProp}} events={events} />;
}
`;

  out[`src/containers/${ListContainer}.test.jsx`] =
`import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import rootReducer from '../state/rootReducer';
import ${ListContainer} from './${ListContainer}';

const createTestStore = (preloadedState = {}) => {
  return createStore(rootReducer, preloadedState);
};

describe('<${ListContainer} />', () => {
  const defaultState = {
    ${slice}: {
      isLoading: false,
      isActionLoading: false,
      isContentLoading: false,
      error: '',
      ${itemsField}: [
        { id: 1, text: 'Test ${slice}', completed: false },
      ],
      ${currentField}: { text: '', id: '' },
    },
    filters: [
      { id: 'SHOW_ALL', label: 'All', selected: true },
      { id: 'SHOW_COMPLETED', label: 'Completed', selected: false },
      { id: 'SHOW_ACTIVE', label: 'Active', selected: false },
    ],
    config: { name: '${appName}', lang: 'en', theme: 'light' },
  };

  it('Renders successfully', () => {
    const store = createTestStore(defaultState);
    render(
      <Provider store={store}>
        <${ListContainer} />
      </Provider>,
    );
    expect(screen.getByText('Test ${slice}')).toBeInTheDocument();
  });

  it('Renders with empty ${slice}s', () => {
    const emptyState = {
      ...defaultState,
      ${slice}: { ...defaultState.${slice}, ${itemsField}: [] },
    };
    const store = createTestStore(emptyState);
    render(
      <Provider store={store}>
        <${ListContainer} />
      </Provider>,
    );
    expect(screen.getByText('Nothing to display here. Carry on.')).toBeInTheDocument();
  });

  it('Renders with loading content state', () => {
    const loadingState = {
      ...defaultState,
      ${slice}: { ...defaultState.${slice}, isContentLoading: true },
    };
    const store = createTestStore(loadingState);
    render(
      <Provider store={store}>
        <${ListContainer} />
      </Provider>,
    );
    const skeletons = document.querySelectorAll('.skeleton');
    expect(skeletons.length).toBe(3);
  });

  it('Renders with error state', () => {
    const errorState = {
      ...defaultState,
      ${slice}: { ...defaultState.${slice}, error: 'Failed to load' },
    };
    const store = createTestStore(errorState);
    render(
      <Provider store={store}>
        <${ListContainer} />
      </Provider>,
    );
    expect(screen.getByText('Failed to load')).toBeInTheDocument();
  });

  it('Renders with action loading state', () => {
    const loadingState = {
      ...defaultState,
      ${slice}: { ...defaultState.${slice}, isActionLoading: true },
    };
    const store = createTestStore(loadingState);
    render(
      <Provider store={store}>
        <${ListContainer} />
      </Provider>,
    );
    expect(screen.getByText('Test ${slice}')).toBeInTheDocument();
  });

  it('Renders with edit state', () => {
    const editState = {
      ...defaultState,
      ${slice}: {
        ...defaultState.${slice},
        ${currentField}: { text: 'Editing ${slice}', id: 1 },
      },
    };
    const store = createTestStore(editState);
    render(
      <Provider store={store}>
        <${ListContainer} />
      </Provider>,
    );
    const input = screen.getByRole('textbox');
    expect(input.value).toBe('Editing ${slice}');
  });

  it('Filters ${slice}s by completed status', () => {
    const stateWithCompleted = {
      ...defaultState,
      ${slice}: {
        ...defaultState.${slice},
        ${itemsField}: [
          { id: 1, text: 'Active ${slice}', completed: false },
          { id: 2, text: 'Done ${slice}', completed: true },
        ],
      },
      filters: [
        { id: 'SHOW_ALL', label: 'All', selected: false },
        { id: 'SHOW_COMPLETED', label: 'Completed', selected: true },
        { id: 'SHOW_ACTIVE', label: 'Active', selected: false },
      ],
    };
    const store = createTestStore(stateWithCompleted);
    render(
      <Provider store={store}>
        <${ListContainer} />
      </Provider>,
    );
    expect(screen.getByText('Done ${slice}')).toBeInTheDocument();
    expect(screen.queryByText('Active ${slice}')).not.toBeInTheDocument();
  });

  it('Filters ${slice}s by active status', () => {
    const stateWithActive = {
      ...defaultState,
      ${slice}: {
        ...defaultState.${slice},
        ${itemsField}: [
          { id: 1, text: 'Active ${slice}', completed: false },
          { id: 2, text: 'Done ${slice}', completed: true },
        ],
      },
      filters: [
        { id: 'SHOW_ALL', label: 'All', selected: false },
        { id: 'SHOW_COMPLETED', label: 'Completed', selected: false },
        { id: 'SHOW_ACTIVE', label: 'Active', selected: true },
      ],
    };
    const store = createTestStore(stateWithActive);
    render(
      <Provider store={store}>
        <${ListContainer} />
      </Provider>,
    );
    expect(screen.getByText('Active ${slice}')).toBeInTheDocument();
    expect(screen.queryByText('Done ${slice}')).not.toBeInTheDocument();
  });

  it('Handles ${slice} create event', () => {
    const store = createTestStore(defaultState);
    render(
      <Provider store={store}>
        <${ListContainer} />
      </Provider>,
    );
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'New ${slice}' } });
    fireEvent.submit(input.closest('form'));
    expect(screen.getByText('New ${slice}')).toBeInTheDocument();
  });

  it('Handles ${slice} toggle event', () => {
    const store = createTestStore(defaultState);
    render(
      <Provider store={store}>
        <${ListContainer} />
      </Provider>,
    );
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    const state = store.getState();
    expect(state.${slice}.${itemsField}[0].completed).toBe(true);
  });

  it('Handles ${slice} edit event', () => {
    const store = createTestStore(defaultState);
    render(
      <Provider store={store}>
        <${ListContainer} />
      </Provider>,
    );
    const editButtons = screen.getAllByRole('button');
    editButtons[1].click();
    const state = store.getState();
    expect(state.${slice}.${currentField}.id).toBe(1);
    expect(state.${slice}.${currentField}.text).toBe('Test ${slice}');
  });

  it('Handles ${slice} update event', () => {
    const editState = {
      ...defaultState,
      ${slice}: {
        ...defaultState.${slice},
        ${currentField}: { text: 'Editing', id: 1 },
      },
    };
    const store = createTestStore(editState);
    render(
      <Provider store={store}>
        <${ListContainer} />
      </Provider>,
    );
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Updated text' } });
    fireEvent.submit(input.closest('form'));
    const state = store.getState();
    expect(state.${slice}.${itemsField}[0].text).toBe('Updated text');
    expect(state.${slice}.${currentField}.text).toBe('');
  });

  it('Handles ${slice} delete event', () => {
    const store = createTestStore(defaultState);
    render(
      <Provider store={store}>
        <${ListContainer} />
      </Provider>,
    );
    const deleteButtons = screen.getAllByRole('button');
    deleteButtons[2].click();
    const state = store.getState();
    expect(state.${slice}.${itemsField}).toHaveLength(0);
  });
});
`;

  return out;
}
