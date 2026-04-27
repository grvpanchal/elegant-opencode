// ui-atom skill — entity-specific item atom (e.g. TodoItem).
//
// Skill principles:
//   • "Single Responsibility" — render ONE entity item
//   • "Framework Agnostic Props" — fully driven by props
//   • "Design Token Integration" — uses chota classes + theme.css tokens
//
// Variable in production: an LLM agent receives this skill + an exemplar of
// the same atom from a known good template and emits the four core files.
// In sim-llm we use this deterministic emitter to produce the canonical
// output for the elegant chota-react-redux template (TodoItem).

export function emit(entity) {
  const Slice = entity.name;        // "Todo"
  const Item  = `${Slice}Item`;     // "TodoItem"
  const itemLower = entity.slice;   // "todo"

  const out = {};

  out[`src/ui/atoms/${Item}/${Item}.component.jsx`] =
`

import "./${Item}.style.css";

import Input from "../Input/Input.component";
import IconButton from "../IconButton/IconButton.component";
import { propTypes } from "./${Item}.type";

const ${Item} = ({
  onToggleClick,
  completed,
  text,
  id,
  onEditClick,
  onDeleteClick,
}) => (
  <li
    style={{
      textDecoration: completed ? "line-through" : "none",
    }}
    className="${itemLower}-item"
  >
    <label htmlFor={\`checkbox\${id}\`}>
      <Input
        id={\`checkbox\${id}\`}
        onClick={onToggleClick}
        name="checkbox"
        type="checkbox"
        onChange={(e) => e.target.value}
        checked={completed}
      />
      {text}
      <span className="icon-buttons">
        <IconButton
          variant="clear"
          alt="edit"
          iconName="edit"
          size="16"
          onClick={onEditClick}
        />
        <IconButton
          variant="clear"
          alt="remove"
          iconName="trash-2"
          size="16"
          onClick={onDeleteClick}
        />
      </span>
    </label>
  </li>
);

${Item}.propTypes = propTypes;

export default ${Item};
`;

  out[`src/ui/atoms/${Item}/${Item}.stories.js`] =
`
import ${Item} from "./${Item}.component";
export default { title: "Atoms/${Item}", component: ${Item} };

export const Default = {
  args: {
    text: 'Sample ${Slice}',
  },
};
`;

  out[`src/ui/atoms/${Item}/${Item}.style.css`] =
`.${itemLower}-item {
  vertical-align: middle;
  clear: both;
  list-style-type: none;
}

.${itemLower}-item input {
  margin-right: 1.5rem;
  vertical-align: middle;
  height: 36px;
}

.${itemLower}-item .icon-buttons {
  float: right;
}
`;

  out[`src/ui/atoms/${Item}/${Item}.test.jsx`] =
`import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import ${Item} from './${Item}.component';

describe('<${Item} />', () => {
  const mockOnToggleClick = vi.fn();
  const mockOnEditClick = vi.fn();
  const mockOnDeleteClick = vi.fn();

  const defaultProps = {
    onToggleClick: mockOnToggleClick,
    completed: false,
    text: 'Test ${Slice}',
    id: '1',
    onEditClick: mockOnEditClick,
    onDeleteClick: mockOnDeleteClick,
  };

  it('Renders successfully without error', () => {
    const { container } = render(<${Item} {...defaultProps} />);
    expect(container).toBeTruthy();
  });

  it('Displays the ${itemLower} text correctly', () => {
    const { getByText } = render(<${Item} {...defaultProps} />);
    expect(getByText('Test ${Slice}')).toBeInTheDocument();
  });

  it('Applies line-through style when completed is true', () => {
    const { container } = render(<${Item} {...defaultProps} completed={true} />);
    const li = container.querySelector('.${itemLower}-item');
    expect(li).toHaveStyle('text-decoration: line-through');
  });

  it('Does not apply line-through style when completed is false', () => {
    const { container } = render(<${Item} {...defaultProps} completed={false} />);
    const li = container.querySelector('.${itemLower}-item');
    expect(li).not.toHaveStyle('text-decoration: line-through');
  });

  it('Calls onToggleClick when checkbox is clicked', () => {
    const { getByRole } = render(<${Item} {...defaultProps} />);
    fireEvent.click(getByRole('checkbox'));
    expect(mockOnToggleClick).toHaveBeenCalledTimes(1);
  });

  it('Renders edit icon button with correct alt text', () => {
    const { container } = render(<${Item} {...defaultProps} />);
    const editButton = container.querySelector('[alt="edit"]');
    expect(editButton).toBeInTheDocument();
  });

  it('Renders delete icon button with correct alt text', () => {
    const { container } = render(<${Item} {...defaultProps} />);
    const deleteButton = container.querySelector('[alt="remove"]');
    expect(deleteButton).toBeInTheDocument();
  });

  it('Calls onEditClick when edit button is clicked', () => {
    const { container } = render(<${Item} {...defaultProps} />);
    const editButton = container.querySelector('[alt="edit"]');
    fireEvent.click(editButton);
    expect(mockOnEditClick).toHaveBeenCalledTimes(1);
  });

  it('Calls onDeleteClick when delete button is clicked', () => {
    const { container } = render(<${Item} {...defaultProps} />);
    const deleteButton = container.querySelector('[alt="remove"]');
    fireEvent.click(deleteButton);
    expect(mockOnDeleteClick).toHaveBeenCalledTimes(1);
  });

  it('Passes correct id to checkbox input', () => {
    const { getByRole } = render(<${Item} {...defaultProps} />);
    const checkbox = getByRole('checkbox');
    expect(checkbox.id).toBe('checkbox1');
  });
});
`;

  out[`src/ui/atoms/${Item}/${Item}.type.js`] =
`import PropTypes from "prop-types";

export const propTypes = {
  onToggleClick: PropTypes.func.isRequired,
  completed: PropTypes.bool.isRequired,
  text: PropTypes.string.isRequired,
  theme: PropTypes.string,
};
`;

  out[`src/ui/atoms/${Item}/${Item}.type.test.js`] =
`import { propTypes } from './${Item}.type';

vi.mock('./${Item}.type', () => ({
  propTypes: {
    onToggleClick: require('prop-types').func.isRequired,
    completed: require('prop-types').bool.isRequired,
    text: require('prop-types').string.isRequired,
    id: require('prop-types').string.isRequired,
    onEditClick: require('prop-types').func.isRequired,
    onDeleteClick: require('prop-types').func.isRequired,
  },
}));

describe('${Item} PropTypes', () => {
  it('exports propTypes object', () => {
    expect(propTypes).toBeDefined();
    expect(typeof propTypes).toBe('object');
  });

  it('onToggleClick prop is required', () => {
    expect(propTypes.onToggleClick).toBeDefined();
  });

  it('completed prop is required', () => {
    expect(propTypes.completed).toBeDefined();
  });

  it('text prop is required', () => {
    expect(propTypes.text).toBeDefined();
  });

  it('id prop is required', () => {
    expect(propTypes.id).toBeDefined();
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
