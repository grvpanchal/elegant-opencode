// ui-organism skill — emit organism components.
//
// Skill principles encoded:
//   • "Feature Encapsulation" — each organism owns one feature view
//   • "State Connection Point" — organisms are presentational; data + events
//     come down through `data` / `events` prop pairs (containers connect them)
//   • "Responsive Orchestration" — composed of multiple molecules / atoms,
//     handles layout-level concerns (loading skeletons, error alerts)
//
// Three organisms emitted:
//   • SiteHeader      — generic shell organism (theme toggle + brand)
//   • {Entity}Filters — wraps FilterGroup with skeleton loading state
//   • {Entity}List    — wraps Add{Entity}Form + {Entity}Items + Alert + skeleton
//
// Variable in production: an LLM-backed agent reads ui-organism SKILL.md +
// an exemplar to produce the JSX. In sim-llm we use this deterministic
// emitter to project the skill onto entity inputs.

export function emit(entity) {
  const Slice = entity.name;        // "Todo"
  const slice = entity.slice;       // "todo"
  const FormName = `Add${Slice}Form`;
  const ItemsName = `${Slice}Items`;
  const itemsProp = `${slice}s`;        // "todos"
  const itemsField = entity.itemsField || `${slice}Items`;       // "todoItems"
  const currentField = entity.currentField || `current${Slice}Item`; // "currentTodoItem"
  const dataProp = `${slice}Data`;
  const FiltersName = `${Slice}Filters`;
  const ListName = `${Slice}List`;

  const out = {};

  // === SiteHeader ============================================================
  out["src/ui/organisms/SiteHeader/SiteHeader.component.jsx"] =
`import './SiteHeader.style.css';

export default function SiteHeader({ headerData, events }) {
  const { brandName, theme } = headerData;
  const { onThemeChangeClick } = events;
  return (
    <header className="header">
      <div className="header-block">
        <div>
          <h1>{brandName}</h1>
        </div>
        <div>
          <h1 role="button" onClick={() => onThemeChangeClick()} className="text-right pointer">{theme === "dark" ? "☀️" : "🌙"}</h1>
        </div>
      </div>
    </header>
  );
}
`;

  out["src/ui/organisms/SiteHeader/SiteHeader.stories.js"] =
`
import SiteHeader from "./SiteHeader.component";
export default { title: "Organisms/SiteHeader", component: SiteHeader };

const events ={
  onThemeChangeClick: () => {},
}

export const Default = {
  args: {
    headerData: {
      brandName: '${entity.appName || `${Slice} App`}',
      theme: 'light'
    },
    events,
  },
};
`;

  out["src/ui/organisms/SiteHeader/SiteHeader.style.css"] =
`.header {
  padding: 5rem 0 1rem 0;
}
.header-block {
  display: flex;
  justify-content: space-between;
}
.pointer {
  cursor: pointer;  
}`;

  out["src/ui/organisms/SiteHeader/SiteHeader.test.jsx"] =
`import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SiteHeader from './SiteHeader.component';
import TestProvider from '../../../utils/providers/TestProvider';

describe('<SiteHeader />', () => {
  const headerData = {
    brandName: 'My ${entity.appName || `${Slice} App`}',
    theme: 'light',
  };

  const events = {
    onThemeChangeClick: vi.fn(),
  };

  beforeEach(() => {
    events.onThemeChangeClick.mockClear();
  });

  it('Renders successfully without error', () => {
    const { container } = render(
      <TestProvider>
        <SiteHeader headerData={headerData} events={events} />
      </TestProvider>,
    );
    expect(container).toBeTruthy();
  });

  it('Displays the brand name', () => {
    render(
      <TestProvider>
        <SiteHeader headerData={headerData} events={events} />
      </TestProvider>,
    );
    expect(screen.getByText('My ${entity.appName || `${Slice} App`}')).toBeInTheDocument();
  });

  it('Calls onThemeChangeClick when theme toggle is clicked', () => {
    render(
      <TestProvider>
        <SiteHeader headerData={headerData} events={events} />
      </TestProvider>,
    );
    const themeToggle = screen.getByRole('button', { name: /🌙/ });
    fireEvent.click(themeToggle);
    expect(events.onThemeChangeClick).toHaveBeenCalled();
  });

  it('Displays moon icon for light theme', () => {
    render(
      <TestProvider>
        <SiteHeader headerData={headerData} events={events} />
      </TestProvider>,
    );
    expect(screen.getByText('🌙')).toBeInTheDocument();
  });

  it('Displays sun icon for dark theme', () => {
    const darkHeaderData = { ...headerData, theme: 'dark' };
    render(
      <TestProvider>
        <SiteHeader headerData={darkHeaderData} events={events} />
      </TestProvider>,
    );
    expect(screen.getByText('☀️')).toBeInTheDocument();
  });

  it('Renders with header class', () => {
    const { container } = render(
      <TestProvider>
        <SiteHeader headerData={headerData} events={events} />
      </TestProvider>,
    );
    expect(container.querySelector('.header')).toBeInTheDocument();
  });
});
`;

  // === {Entity}Filters ======================================================
  out[`src/ui/organisms/${FiltersName}/${FiltersName}.component.jsx`] =
`import FilterGroup from "../../molecules/FilterGroup/FilterGroup.component";
import Skeleton from "../../skeletons/Skeleton/Skeleton.component";

export default function ${FiltersName}({ filtersData, events }) {
  const {
    on${Slice}FilterUpdate,
  } = events;
  return (
    <>
      {filtersData.isContentLoading ? (
        <div style={{display:'flex', gap: '1rem'}}>
          <Skeleton height="24px" />
          <Skeleton height="24px" />
          <Skeleton height="24px" />
        </div>
      ) : (
        <>
          <FilterGroup
            filterItems={filtersData}
            onFilterClick={on${Slice}FilterUpdate}
          />
        </>
      )}
    </>
  );
}
`;

  out[`src/ui/organisms/${FiltersName}/${FiltersName}.stories.js`] =
`
import ${FiltersName} from "./${FiltersName}.component";
export default { title: "Organisms/${FiltersName}", component: ${FiltersName} };

const events ={
  on${Slice}FilterUpdate: () => {},
}

export const Default = {
  args: {
    filtersData: [
        { id: 0, label: 'apple', selected: false },
        { id: 1, label: 'mango', selected: false },
        { id: 2, label: 'oranges', selected: false },
      ],
    events,
  },
};

export const Empty = {
  args: {
    filtersData: [],
  events,
  },
};

export const Loading = {
  args: {
    filtersData: {
      isContentLoading: true
    },
    events,
  },
};



`;

  out[`src/ui/organisms/${FiltersName}/${FiltersName}.test.jsx`] =
`import React from 'react';
import { render, screen } from '@testing-library/react';
import ${FiltersName} from './${FiltersName}.component';
import TestProvider from '../../../utils/providers/TestProvider';

describe('<${FiltersName} />', () => {
  const filtersData = [
    { id: 'SHOW_ALL', label: 'All', selected: true },
    { id: 'SHOW_COMPLETED', label: 'Completed', selected: false },
    { id: 'SHOW_ACTIVE', label: 'Active', selected: false },
  ];

  const events = {
    on${Slice}FilterUpdate: vi.fn(),
  };

  it('Renders successfully without error', () => {
    const { container } = render(
      <TestProvider>
        <${FiltersName} filtersData={filtersData} events={events} />
      </TestProvider>,
    );
    expect(container).toBeTruthy();
  });

  it('Renders filter items', () => {
    render(
      <TestProvider>
        <${FiltersName} filtersData={filtersData} events={events} />
      </TestProvider>,
    );
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('Renders Skeleton when isContentLoading is true', () => {
    const loadingFiltersData = { isContentLoading: true };
    render(
      <TestProvider>
        <${FiltersName} filtersData={loadingFiltersData} events={events} />
      </TestProvider>,
    );
    const skeletons = document.querySelectorAll('.skeleton');
    expect(skeletons.length).toBe(3);
  });

  it('Renders FilterGroup when isContentLoading is false', () => {
    render(
      <TestProvider>
        <${FiltersName} filtersData={filtersData} events={events} />
      </TestProvider>,
    );
    const skeletons = document.querySelectorAll('.skeleton');
    expect(skeletons.length).toBe(0);
    expect(screen.getByRole('group')).toBeInTheDocument();
  });
});
`;

  // === {Entity}List =========================================================
  out[`src/ui/organisms/${ListName}/${ListName}.component.jsx`] =
`import Alert from "../../atoms/Alert/Alert.component";
import ${FormName} from "../../molecules/${FormName}/${FormName}.component";
import ${ItemsName} from "../../molecules/${ItemsName}/${ItemsName}.component";
import Skeleton from "../../skeletons/Skeleton/Skeleton.component";

export default function ${ListName}({ ${dataProp}, events }) {
  const {
    on${Slice}Create,
    on${Slice}Edit,
    on${Slice}Update,
    on${Slice}ToggleUpdate,
    on${Slice}Delete,
  } = events;
  return (
    <>
      {${dataProp}.error ? (
        <Alert
          variant={"error"}
          show={!!${dataProp}.error}
          message={${dataProp}.error}
        />
      ) : null}
      <${FormName}
        ${slice}Value={${dataProp}.${currentField}.text || ""}
        on${Slice}Add={on${Slice}Create}
        on${Slice}Update={on${Slice}Update}
        placeholder="Add your task"
        isLoading={${dataProp}.isActionLoading}
        buttonInfo={{
          label: ${dataProp}.${currentField}.text ? "Save" : "Add",
          variant: "primary",
        }} // TODO: Work on Labels Concept
      />
      {${dataProp}.isContentLoading ? (
        <>
          <br />
          <Skeleton height="24px" />
          <br />
          <Skeleton height="24px" />
          <br />
          <Skeleton height="24px" />
        </>
      ) : (
        <>
          <${ItemsName}
            ${itemsProp}={${dataProp}.${itemsField} || []}
            onToggleClick={on${Slice}ToggleUpdate}
            onDeleteClick={on${Slice}Delete}
            onEditClick={on${Slice}Edit}
            isDisabled={${dataProp}.isActionLoading}
          />
        </>
      )}
    </>
  );
}
`;

  out[`src/ui/organisms/${ListName}/${ListName}.stories.js`] =
`
import ${ListName} from "./${ListName}.component";
export default { title: "Organisms/${ListName}", component: ${ListName} };

const events ={
  on${Slice}Create: () => {},
  on${Slice}Edit: () => {},
  on${Slice}Update: () => {},
  on${Slice}ToggleUpdate: () => {},
  on${Slice}Delete: () => {},
}

export const Default = {
  args: {
    ${dataProp}: {
      ${itemsField}: [
        { id: 0, text: 'apple', completed: false },
        { id: 1, text: 'mango', completed: false },
        { id: 2, text: 'oranges', completed: false },
      ],
      ${currentField}: {
        id: '',
        text: '',
        completed: false
      }
    },
    events,
  },
};

export const Empty = {
  args: {
    ${dataProp}: {
      ${itemsField}: [],
      ${currentField}: {
        id: '',
        text: '',
        completed: false
      }
    },
    events,
  },
};

export const Loading = {
  args: {
    ${dataProp}: {
      isContentLoading: true,
      ${itemsField}: [],
      ${currentField}: {
        id: '',
        text: '',
        completed: false
      }
    },
    events,
  },
};

export const Error = {
  args: {
    ${dataProp}: {
      error: 'Unable to load contents',
      isContentLoading: false,
      ${itemsField}: [],
      ${currentField}: {
        id: '',
        text: '',
        completed: false
      }
    },
    events,
  },
};



`;

  out[`src/ui/organisms/${ListName}/${ListName}.test.jsx`] =
`import React from 'react';
import { render, screen } from '@testing-library/react';
import ${ListName} from './${ListName}.component';
import TestProvider from '../../../utils/providers/TestProvider';

describe('<${ListName} />', () => {
  const default${Slice}Data = {
    isLoading: false,
    isActionLoading: false,
    isContentLoading: false,
    error: '',
    ${itemsField}: [
      { id: 1, text: '${Slice} 1', completed: false },
    ],
    ${currentField}: { text: '', id: '' },
  };

  const defaultEvents = {
    on${Slice}Create: vi.fn(),
    on${Slice}Edit: vi.fn(),
    on${Slice}Update: vi.fn(),
    on${Slice}ToggleUpdate: vi.fn(),
    on${Slice}Delete: vi.fn(),
  };

  it('Renders successfully without error', () => {
    const { container } = render(
      <TestProvider>
        <${ListName} ${dataProp}={default${Slice}Data} events={defaultEvents} />
      </TestProvider>,
    );
    expect(container).toBeTruthy();
  });

  it('Renders ${slice} items', () => {
    render(
      <TestProvider>
        <${ListName} ${dataProp}={default${Slice}Data} events={defaultEvents} />
      </TestProvider>,
    );
    expect(screen.getByText('${Slice} 1')).toBeInTheDocument();
  });

  it('Renders Alert when there is an error', () => {
    const ${slice}DataWithError = { ...default${Slice}Data, error: 'Something went wrong' };
    render(
      <TestProvider>
        <${ListName} ${dataProp}={${slice}DataWithError} events={defaultEvents} />
      </TestProvider>,
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('Does not render Alert when there is no error', () => {
    render(
      <TestProvider>
        <${ListName} ${dataProp}={default${Slice}Data} events={defaultEvents} />
      </TestProvider>,
    );
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('Renders Skeleton when isContentLoading is true', () => {
    const loading${Slice}Data = { ...default${Slice}Data, isContentLoading: true };
    render(
      <TestProvider>
        <${ListName} ${dataProp}={loading${Slice}Data} events={defaultEvents} />
      </TestProvider>,
    );
    const skeletons = document.querySelectorAll('.skeleton');
    expect(skeletons.length).toBe(3);
  });

  it('Renders ${ItemsName} when isContentLoading is false', () => {
    render(
      <TestProvider>
        <${ListName} ${dataProp}={default${Slice}Data} events={defaultEvents} />
      </TestProvider>,
    );
    expect(screen.getByText('${Slice} 1')).toBeInTheDocument();
    const skeletons = document.querySelectorAll('.skeleton');
    expect(skeletons.length).toBe(0);
  });

  it('Shows "Add" button label when ${currentField}.text is empty', () => {
    render(
      <TestProvider>
        <${ListName} ${dataProp}={default${Slice}Data} events={defaultEvents} />
      </TestProvider>,
    );
    const submitButton = screen.getByRole('button', { name: 'Add' });
    expect(submitButton).toHaveTextContent('Add');
  });

  it('Shows "Save" button label when ${currentField}.text has value', () => {
    const ${slice}DataWithEdit = {
      ...default${Slice}Data,
      ${currentField}: { text: 'Editing this', id: 1 },
    };
    render(
      <TestProvider>
        <${ListName} ${dataProp}={${slice}DataWithEdit} events={defaultEvents} />
      </TestProvider>,
    );
    const submitButton = screen.getByRole('button', { name: 'Save' });
    expect(submitButton).toHaveTextContent('Save');
  });

  it('Passes isActionLoading as isDisabled to ${ItemsName}', () => {
    const loadingActionData = { ...default${Slice}Data, isActionLoading: true };
    render(
      <TestProvider>
        <${ListName} ${dataProp}={loadingActionData} events={defaultEvents} />
      </TestProvider>,
    );
    expect(screen.getByText('${Slice} 1')).toBeInTheDocument();
  });

  it('Renders empty ${itemsProp} message when ${itemsField} is empty', () => {
    const empty${Slice}Data = { ...default${Slice}Data, ${itemsField}: [] };
    render(
      <TestProvider>
        <${ListName} ${dataProp}={empty${Slice}Data} events={defaultEvents} />
      </TestProvider>,
    );
    expect(screen.getByText('Nothing to display here. Carry on.')).toBeInTheDocument();
  });

  it('Handles undefined ${itemsField} gracefully', () => {
    const undefined${Slice}Data = { ...default${Slice}Data, ${itemsField}: undefined };
    render(
      <TestProvider>
        <${ListName} ${dataProp}={undefined${Slice}Data} events={defaultEvents} />
      </TestProvider>,
    );
    expect(screen.getByText('Nothing to display here. Carry on.')).toBeInTheDocument();
  });
});
`;

  return out;
}
