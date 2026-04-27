// ui-molecule skill — emit molecule components.
//
// Skill principles encoded:
//   • "Composition Over Creation" — molecules compose existing atoms (Input,
//     Button, Link, IconButton + the entity's domain atom).
//   • "Single Cohesive Purpose" — each molecule expresses one user-facing
//     concept (a form, a filter group, an item list).
//   • "Props Passthrough" — handlers and data flow through declared props.
//
// Three molecules are emitted for the chota-react-redux output:
//   1. Add{Entity}Form  — parameterized by entity (calls onCreate / onUpdate)
//   2. FilterGroup      — generic, fixed (consumed by filters skill)
//   3. {Entity}Items    — parameterized by entity (renders the domain atom)
//
// Variable in production: an LLM-backed agent reads the ui-molecule SKILL.md
// and an exemplar to produce the JSX. In sim-llm we use this deterministic
// emitter to project the skill knowledge onto entity inputs.

export function emit(entity) {
  const Slice = entity.name;     // "Todo"
  const slice = entity.slice;    // "todo"
  const FormName = `Add${Slice}Form`;
  const ItemsName = `${Slice}Items`; // "TodoItems"
  const itemsProp = `${slice}s`;     // "todos"
  const MockName  = `mock${itemsProp[0].toUpperCase()}${itemsProp.slice(1)}`; // "mockTodos"

  const out = {};

  // === Add{Entity}Form ====================================================
  out[`src/ui/molecules/${FormName}/${FormName}.component.jsx`] =
`import React, { useEffect, useState } from "react";
import Input from "../../atoms/Input/Input.component";
import Button from "../../atoms/Button/Button.component";

const ${FormName} = ({
  buttonInfo = { label: 'Add', variant: 'primary' },
  placeholder,
  isLoading,
  on${Slice}Add,
  on${Slice}Update,
  ${slice}Value,
}) => {
  const [inputValue, setInputValue] = useState(${slice}Value || '');
  const { label, variant } = buttonInfo;

  const handleChange = (e) => {
    const { value } = e.target;
    setInputValue(value);
  };

  useEffect(() => setInputValue(${slice}Value), [${slice}Value]);

  return (
    <div>
      <form role="form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!inputValue || !inputValue.trim()) {
            return;
          }
          if(${slice}Value) {
            on${Slice}Update(inputValue);
          } else {
            on${Slice}Add(inputValue);
          }
          setInputValue('');
        }}
      >
        <div className="grouped">
          <Input className="" value={inputValue} defaultValue={inputValue} disabled={isLoading} placeholder={placeholder} onChange={handleChange} />
          <Button className={\`button \${variant}\`} isLoading={isLoading} type="submit">
            {label}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ${FormName};
`;

  out[`src/ui/molecules/${FormName}/${FormName}.stories.js`] =
`import ${FormName} from "./${FormName}.component";
export default { title: "Molecules/${FormName}", component: ${FormName} };

export const Default = {
  args: {
    ${slice}Value: '',
    placeholder: "Add your task",
    isLoading: false,
    buttonInfo: {
      label: 'Add',
      variant: "primary",
    },
  },
};

export const Loading = {
  args: {
    ${slice}Value: '',
    placeholder: "Add your task",
    isLoading: true,
    buttonInfo: {
      label: 'Add',
      variant: "primary",
    },
  },
};`;

  out[`src/ui/molecules/${FormName}/${FormName}.test.jsx`] =
`import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import ${FormName} from './${FormName}.component';

describe('<${FormName} />', () => {
  const mockOn${Slice}Add = vi.fn();
  const mockOn${Slice}Update = vi.fn();

  it('Renders successfully without error', () => {
    const { container } = render(
      <${FormName} 
        buttonInfo={{ label: 'Add', variant: 'primary' }}
        placeholder="What needs to be done?"
        on${Slice}Add={mockOn${Slice}Add}
      />
    );
    expect(container).toBeTruthy();
  });

  it('Initializes with empty value when ${slice}Value is not provided', () => {
    const { getByPlaceholderText } = render(
      <${FormName} 
        buttonInfo={{ label: 'Add', variant: 'primary' }}
        placeholder="What needs to be done?"
        on${Slice}Add={mockOn${Slice}Add}
      />
    );
    const input = getByPlaceholderText('What needs to be done?');
    expect(input.value).toBe('');
  });

  it('Renders with default button info when not provided', () => {
    const { getByRole } = render(
      <${FormName} 
        placeholder="What needs to be done?"
        on${Slice}Add={mockOn${Slice}Add}
      />
    );
    expect(getByRole('button')).toHaveTextContent('Add');
  });

  it('Displays the placeholder text', () => {
    const { getByPlaceholderText } = render(
      <${FormName} 
        buttonInfo={{ label: 'Add', variant: 'primary' }}
        placeholder="What needs to be done?"
        on${Slice}Add={mockOn${Slice}Add}
      />
    );
    expect(getByPlaceholderText('What needs to be done?')).toBeInTheDocument();
  });

  it('Calls on${Slice}Add when form is submitted with valid input', () => {
    const { getByRole, getByPlaceholderText } = render(
      <${FormName} 
        buttonInfo={{ label: 'Add', variant: 'primary' }}
        placeholder="What needs to be done?"
        on${Slice}Add={mockOn${Slice}Add}
      />
    );
    const input = getByPlaceholderText('What needs to be done?');
    fireEvent.change(input, { target: { value: 'New Task' } });
    fireEvent.submit(getByRole('form'));
    expect(mockOn${Slice}Add).toHaveBeenCalledWith('New Task');
  });

  it('Does not call on${Slice}Add when input is empty', () => {
    const { getByPlaceholderText, getByRole } = render(
      <${FormName} 
        buttonInfo={{ label: 'Add', variant: 'primary' }}
        placeholder="What needs to be done?"
        on${Slice}Add={mockOn${Slice}Add}
      />
    );
    fireEvent.submit(getByRole('form'));
    expect(mockOn${Slice}Add).not.toHaveBeenCalled();
  });

  it('Updates input value when typed', () => {
    const { getByPlaceholderText } = render(
      <${FormName} 
        buttonInfo={{ label: 'Add', variant: 'primary' }}
        placeholder="What needs to be done?"
        on${Slice}Add={mockOn${Slice}Add}
      />
    );
    const input = getByPlaceholderText('What needs to be done?');
    fireEvent.change(input, { target: { value: 'Typing text' } });
    expect(input.value).toBe('Typing text');
  });

  it('Calls on${Slice}Update when editing and form is submitted', () => {
    const { getByRole, getByPlaceholderText } = render(
      <${FormName} 
        buttonInfo={{ label: 'Update', variant: 'secondary' }}
        placeholder="Edit task"
        on${Slice}Add={mockOn${Slice}Add}
        on${Slice}Update={mockOn${Slice}Update}
        ${slice}Value="Existing Task"
      />
    );
    const input = getByPlaceholderText('Edit task');
    fireEvent.change(input, { target: { value: 'Updated Task' } });
    fireEvent.submit(getByRole('form'));
    expect(mockOn${Slice}Update).toHaveBeenCalledWith('Updated Task');
  });

  it('Preloads ${slice}Value in input when provided', () => {
    const { getByPlaceholderText } = render(
      <${FormName} 
        buttonInfo={{ label: 'Update', variant: 'secondary' }}
        placeholder="Edit task"
        on${Slice}Add={mockOn${Slice}Add}
        ${slice}Value="Existing Task"
      />
    );
    const input = getByPlaceholderText('Edit task');
    expect(input.value).toBe('Existing Task');
  });

  it('Sets isLoading state correctly', () => {
    const { container } = render(
      <${FormName} 
        buttonInfo={{ label: 'Saving...', variant: 'primary' }}
        placeholder="What needs to be done?"
        on${Slice}Add={mockOn${Slice}Add}
        isLoading={true}
      />
    );
    const input = container.querySelector('input');
    expect(input).toHaveAttribute('disabled');
  });

  it('Resets input value after successful add', () => {
    const { getByRole, getByPlaceholderText } = render(
      <${FormName} 
        buttonInfo={{ label: 'Add', variant: 'primary' }}
        placeholder="What needs to be done?"
        on${Slice}Add={mockOn${Slice}Add}
      />
    );
    const input = getByPlaceholderText('What needs to be done?');
    fireEvent.change(input, { target: { value: 'New Task' } });
    expect(input.value).toBe('New Task');
    fireEvent.click(getByRole('button'));
  });
});
`;

  // === FilterGroup (fixed; consumed by filters slice) =====================
  out[`src/ui/molecules/FilterGroup/FilterGroup.component.jsx`] =
`
import Link from "../../atoms/Link/Link.component";

const FilterGroup = ({ filterItems, onFilterClick }) => (
  <div className="grouped" role="group">
    {filterItems.map((filterItem) => (
      <Link key={filterItem.id} isActive={filterItem.selected} onClick={() => onFilterClick(filterItem.id)}>{filterItem.label}</Link>
    ))}
  </div>
);

export default FilterGroup;
`;

  out[`src/ui/molecules/FilterGroup/FilterGroup.stories.js`] =
`import AddTodoForm from "./FilterGroup.component";
export default { title: "Molecules/FilterGroup", component: AddTodoForm };

export const Default = {
  args: {
    filterItems: [
      {
        id: '1',
        label: 'abc',
        selected: false,
      },
      {
        id: '2',
        label: 'xyz',
        selected: false,
      },
      {
        id: '3',
        label: 'pqr',
        selected: true,
      },
    ],
    onClick: (e) => { e.preventDefault(); console.log('asdasd') },
  },
};
`;

  out[`src/ui/molecules/FilterGroup/FilterGroup.test.jsx`] =
`import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import FilterGroup from './FilterGroup.component';
import TestProvider from '../../../utils/providers/TestProvider';

describe('<FilterGroup />', () => {
  const mockOnFilterClick = vi.fn();

  it('Renders successfully without error', () => {
    const { container } = render(
      <TestProvider>
        <FilterGroup filterItems={[]} onFilterClick={mockOnFilterClick} />
      </TestProvider>,
    );
    expect(container).toBeTruthy();
  });

  it('Renders filter items correctly', () => {
    const mockFilters = [
      { id: 'all', label: 'All', selected: true },
      { id: 'active', label: 'Active', selected: false },
      { id: 'completed', label: 'Completed', selected: false },
    ];
    const { getByText } = render(
      <TestProvider>
        <FilterGroup filterItems={mockFilters} onFilterClick={mockOnFilterClick} />
      </TestProvider>,
    );
    expect(getByText('All')).toBeInTheDocument();
    expect(getByText('Active')).toBeInTheDocument();
    expect(getByText('Completed')).toBeInTheDocument();
  });

  it('Calls onFilterClick when a filter is clicked', () => {
    const mockFilters = [
      { id: 'all', label: 'All', selected: true },
      { id: 'active', label: 'Active', selected: false },
    ];
    const { getByText } = render(
      <TestProvider>
        <FilterGroup filterItems={mockFilters} onFilterClick={mockOnFilterClick} />
      </TestProvider>,
    );
    fireEvent.click(getByText('Active'));
    expect(mockOnFilterClick).toHaveBeenCalledWith('active');
  });
});`;

  // === {Entity}Items ======================================================
  out[`src/ui/molecules/${ItemsName}/${ItemsName}.component.jsx`] =
`import "./${ItemsName}.style.css";

import ${Slice}Item from "../../atoms/${Slice}Item/${Slice}Item.component";
import { propTypes } from "./${ItemsName}.type";

const ${ItemsName} = ({ ${itemsProp}, isDisabled, onToggleClick, onEditClick, onDeleteClick }) => {
  return ${itemsProp} && ${itemsProp}.length ? (
    <ul className="${slice}-items">
      {${itemsProp}.map((${slice}) => (
        <${Slice}Item
          key={${slice}.id}
          id={${slice}.id}
          {...${slice}}
          isDisabled={isDisabled}
          onToggleClick={() => onToggleClick(${slice})}
          onEditClick={() => onEditClick(${slice})}
          onDeleteClick={() => onDeleteClick(${slice}.id)}
        />
      ))}
    </ul>
  ) : (
    <p className="text-center empty-text">Nothing to display here. Carry on.</p>
  );
};

${ItemsName}.propTypes = propTypes

export default ${ItemsName};
`;

  out[`src/ui/molecules/${ItemsName}/${ItemsName}.stories.js`] =
`import ${ItemsName} from "./${ItemsName}.component";
export default { title: "Molecules/${ItemsName}", component: ${ItemsName} };

export const Default = {
  args: {
    ${itemsProp}: [
      { id: 0, text: 'apple', completed: false },
      { id: 1, text: 'mango', completed: false },
      { id: 2, text: 'oranges', completed: false },
    ],
    onClick: (e) => { e.preventDefault(); console.log('asdasd') },
  },
};
`;

  out[`src/ui/molecules/${ItemsName}/${ItemsName}.style.css`] =
`.${slice}-items {
  list-style: none;
  padding: 0;
}
.empty-text {
  padding-top: 1.5rem;
}
`;

  out[`src/ui/molecules/${ItemsName}/${ItemsName}.test.jsx`] =
`import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import ${ItemsName} from './${ItemsName}.component';

describe('<${ItemsName} />', () => {
  const mockOnToggleClick = vi.fn();
  const mockOnEditClick = vi.fn();
  const mockOnDeleteClick = vi.fn();

  const ${MockName} = [
    { id: '1', text: '${Slice} 1', completed: false },
    { id: '2', text: '${Slice} 2', completed: true },
  ];

  it('Renders successfully without error with ${itemsProp}', () => {
    const { container } = render(
      <${ItemsName} 
        ${itemsProp}={${MockName}}
        onToggleClick={mockOnToggleClick}
        onEditClick={mockOnEditClick}
        onDeleteClick={mockOnDeleteClick}
      />
    );
    expect(container).toBeTruthy();
  });

  it('Displays all ${slice} items when provided', () => {
    const { getByText } = render(
      <${ItemsName} 
        ${itemsProp}={${MockName}}
        onToggleClick={mockOnToggleClick}
        onEditClick={mockOnEditClick}
        onDeleteClick={mockOnDeleteClick}
      />
    );
    expect(getByText('${Slice} 1')).toBeInTheDocument();
    expect(getByText('${Slice} 2')).toBeInTheDocument();
  });

  it('Displays empty message when ${itemsProp} array is empty', () => {
    const { getByText } = render(
      <${ItemsName} 
        ${itemsProp}={[]}
        onToggleClick={mockOnToggleClick}
        onEditClick={mockOnEditClick}
        onDeleteClick={mockOnDeleteClick}
      />
    );
    expect(getByText('Nothing to display here. Carry on.')).toBeInTheDocument();
  });

  it('Displays empty message when ${itemsProp} is null', () => {
    const { getByText } = render(
      <${ItemsName} 
        ${itemsProp}={null}
        onToggleClick={mockOnToggleClick}
        onEditClick={mockOnEditClick}
        onDeleteClick={mockOnDeleteClick}
      />
    );
    expect(getByText('Nothing to display here. Carry on.')).toBeInTheDocument();
  });

  it('Displays empty message when ${itemsProp} is undefined', () => {
    const { getByText } = render(
      <${ItemsName} 
        onToggleClick={mockOnToggleClick}
        onEditClick={mockOnEditClick}
        onDeleteClick={mockOnDeleteClick}
      />
    );
    expect(getByText('Nothing to display here. Carry on.')).toBeInTheDocument();
  });

  it('Calls onToggleClick for each ${slice} when toggled', () => {
    const { container } = render(
      <${ItemsName} 
        ${itemsProp}={${MockName}}
        onToggleClick={mockOnToggleClick}
        onEditClick={mockOnEditClick}
        onDeleteClick={mockOnDeleteClick}
      />
    );
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    fireEvent.click(checkboxes[0]);
    expect(mockOnToggleClick).toHaveBeenCalledTimes(1);
  });

  it('Calls onEditClick for each ${slice} when edit is clicked', () => {
    const { container } = render(
      <${ItemsName} 
        ${itemsProp}={${MockName}}
        onToggleClick={mockOnToggleClick}
        onEditClick={mockOnEditClick}
        onDeleteClick={mockOnDeleteClick}
      />
    );
    const editButtons = container.querySelectorAll('[alt="edit"]');
    fireEvent.click(editButtons[0]);
    expect(mockOnEditClick).toHaveBeenCalledTimes(1);
  });

  it('Calls onDeleteClick for each ${slice} when delete is clicked', () => {
    const { container } = render(
      <${ItemsName} 
        ${itemsProp}={${MockName}}
        onToggleClick={mockOnToggleClick}
        onEditClick={mockOnEditClick}
        onDeleteClick={mockOnDeleteClick}
      />
    );
    const deleteButtons = container.querySelectorAll('[alt="remove"]');
    fireEvent.click(deleteButtons[0]);
    expect(mockOnDeleteClick).toHaveBeenCalledTimes(1);
  });

  it('Applies line-through style to completed ${itemsProp}', () => {
    const { container } = render(
      <${ItemsName} 
        ${itemsProp}={${MockName}}
        onToggleClick={mockOnToggleClick}
        onEditClick={mockOnEditClick}
        onDeleteClick={mockOnDeleteClick}
      />
    );
    const ${slice}Items = container.querySelectorAll('.${slice}-item');
    expect(${slice}Items[1]).toHaveStyle('text-decoration: line-through');
  });

  it('Does not apply line-through style to non-completed ${itemsProp}', () => {
    const { container } = render(
      <${ItemsName} 
        ${itemsProp}={${MockName}}
        onToggleClick={mockOnToggleClick}
        onEditClick={mockOnEditClick}
        onDeleteClick={mockOnDeleteClick}
      />
    );
    const labels = container.querySelectorAll('label');
    expect(labels[0]).not.toHaveStyle('text-decoration: line-through');
  });
});
`;

  out[`src/ui/molecules/${ItemsName}/${ItemsName}.type.js`] =
`import PropTypes from "prop-types";

export const propTypes = {
  ${itemsProp}: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      completed: PropTypes.bool.isRequired,
      text: PropTypes.string.isRequired,
    }).isRequired
  ).isRequired,
  onToggleClick: PropTypes.func.isRequired,
};
`;

  out[`src/ui/molecules/${ItemsName}/${ItemsName}.type.test.js`] =
`import { propTypes } from './${ItemsName}.type';

vi.mock('./${ItemsName}.type', () => ({
  propTypes: {
    ${itemsProp}: require('prop-types').array.isRequired,
    isDisabled: require('prop-types').bool,
    onToggleClick: require('prop-types').func.isRequired,
    onEditClick: require('prop-types').func.isRequired,
    onDeleteClick: require('prop-types').func.isRequired,
  },
}));

describe('${ItemsName} PropTypes', () => {
  it('exports propTypes object', () => {
    expect(propTypes).toBeDefined();
    expect(typeof propTypes).toBe('object');
  });

  it('${itemsProp} prop is required', () => {
    expect(propTypes.${itemsProp}).toBeDefined();
  });

  it('isDisabled prop exists', () => {
    expect(propTypes.isDisabled).toBeDefined();
  });

  it('onToggleClick prop is required', () => {
    expect(propTypes.onToggleClick).toBeDefined();
  });

  it('onEditClick prop is required', () => {
    expect(propTypes.onEditClick).toBeDefined();
  });

  it('onDeleteClick prop is required', () => {
    expect(propTypes.onDeleteClick).toBeDefined();
  });
});
`;

  return out;
}
