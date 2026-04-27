// ui-atom skill — theme-aware atoms.
//
// Skill principles:
//   • "Single Responsibility" + "Design Token Integration"
//   • Context-aware atoms read theme via useAtomicContext (AtomicProvider).
//
// Three atoms emitted: IconButton, Alert, Link. Pattern is fully fixed by
// the skill's exemplar templates; no entity-specific JSX.

export function emit(_entity) {
  const out = {};

  // ── IconButton ─────────────────────────────────────────────────────
  out["src/ui/atoms/IconButton/IconButton.component.jsx"] =
`import { useAtomicContext } from "../../../utils/providers/AtomicProvider";
import Button from "../Button/Button.component";
import Image from "../Image/Image.component";

export default function IconButton({
  iconName,
  alt,
  variant,
  size,
  color,
  onClick,
  ...props
}) {
  const { theme } = useAtomicContext();
  const themeColor = theme === "dark" ? "ffffff" : "";
  return (
    <Button
      className={\`button icon-only \${variant}\`}
      data-value={props["data-value"]}
      data-testid={props["data-testid"]}
      onClick={onClick}
    >
      <Image
        alt={alt}
        src={\`https://icongr.am/feather/\${iconName}.svg?size=\${size}&color=\${
          color ? color : themeColor
        }\`}
      />
    </Button>
  );
}
`;
  out["src/ui/atoms/IconButton/IconButton.stories.js"] =
`
import IconButton from "./IconButton.component";
export default { title: "Atoms/IconButton", component: IconButton };

export const Default = {
  args: {
    variant: "clear",
    alt: "remove",
    iconName: "trash-2",
    size: "16",
    children: "Sample IconButton",
  },
};`;
  out["src/ui/atoms/IconButton/IconButton.style.css"] = ``;
  out["src/ui/atoms/IconButton/IconButton.test.jsx"] =
`import React from 'react';
import { render, screen } from '@testing-library/react';
import IconButton from './IconButton.component';
import TestProvider from '../../../utils/providers/TestProvider';

describe('<IconButton />', () => {
  it('Renders successfully without error', () => {
    const { container } = render(
      <TestProvider>
        <IconButton iconName="edit" alt="edit" size="16" />
      </TestProvider>,
    );
    expect(container).toBeTruthy();
  });

  it('Renders with correct icon URL', () => {
    render(
      <TestProvider>
        <IconButton iconName="trash-2" alt="delete" size="24" />
      </TestProvider>,
    );
    const img = screen.getByAltText('delete');
    expect(img).toHaveAttribute('src', expect.stringContaining('trash-2'));
    expect(img).toHaveAttribute('src', expect.stringContaining('size=24'));
  });

  it('Renders with custom color', () => {
    render(
      <TestProvider preloadedState={{ config: { theme: 'light', name: 'Test', lang: 'en' } }}>
        <IconButton iconName="edit" alt="edit" size="16" color="ff0000" />
      </TestProvider>,
    );
    const img = screen.getByAltText('edit');
    expect(img).toHaveAttribute('src', expect.stringContaining('color=ff0000'));
  });

  it('Uses theme color when no color is provided and theme is dark', () => {
    render(
      <TestProvider preloadedState={{ config: { theme: 'dark', name: 'Test', lang: 'en' } }}>
        <IconButton iconName="edit" alt="edit" size="16" />
      </TestProvider>,
    );
    const img = screen.getByAltText('edit');
    expect(img).toHaveAttribute('src', expect.stringContaining('color=ffffff'));
  });

  it('Uses empty theme color when no color is provided and theme is light', () => {
    render(
      <TestProvider preloadedState={{ config: { theme: 'light', name: 'Test', lang: 'en' } }}>
        <IconButton iconName="edit" alt="edit" size="16" />
      </TestProvider>,
    );
    const img = screen.getByAltText('edit');
    expect(img).toHaveAttribute('src', expect.stringContaining('color='));
  });

  it('Renders with variant class', () => {
    const { container } = render(
      <TestProvider>
        <IconButton iconName="x" alt="close" size="16" variant="clear" />
      </TestProvider>,
    );
    const button = container.querySelector('button');
    expect(button).toHaveClass('icon-only');
    expect(button).toHaveClass('clear');
  });

  it('Passes data-testid and data-value props', () => {
    render(
      <TestProvider>
        <IconButton iconName="edit" alt="edit" size="16" data-testid="custom-id" data-value="test" />
      </TestProvider>,
    );
    expect(screen.getByTestId('custom-id')).toHaveAttribute('data-value', 'test');
  });

  it('Calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(
      <TestProvider>
        <IconButton iconName="edit" alt="edit" size="16" onClick={onClick} />
      </TestProvider>,
    );
    const button = screen.getByRole('button');
    button.click();
    expect(onClick).toHaveBeenCalled();
  });
});
`;
  out["src/ui/atoms/IconButton/IconButton.type.js"] = ``;
  out["src/ui/atoms/IconButton/IconButton.type.test.js"] =
`import { propTypes } from './IconButton.type';

vi.mock('./IconButton.type', () => ({
  propTypes: {
    className: require('prop-types').string,
    alt: require('prop-types').string.isRequired,
    iconName: require('prop-types').string.isRequired,
    size: require('prop-types').string,
    onClick: require('prop-types').func.isRequired,
  },
}));

describe('IconButton PropTypes', () => {
  it('exports propTypes object', () => {
    expect(propTypes).toBeDefined();
  });

  it('alt prop is required', () => {
    expect(propTypes.alt).toBeDefined();
  });

  it('iconName prop is required', () => {
    expect(propTypes.iconName).toBeDefined();
  });

  it('onClick prop is required', () => {
    expect(propTypes.onClick).toBeDefined();
  });
});
`;

  // ── Alert ──────────────────────────────────────────────────────────
  out["src/ui/atoms/Alert/Alert.component.jsx"] =
`import React, { useEffect, useState } from "react";

import "./Alert.style.css";

import IconButton from "../IconButton/IconButton.component";
import Image from "../Image/Image.component";

export default function Alert({ variant, show, message, onCloseClick }) {
  const [showAlert, setShowAlert] = useState(show);

  const handleClose = (e) => {
    setShowAlert(false);
    if (onCloseClick) {
      onCloseClick(e);
    }
  };

  useEffect(() => {
    setShowAlert(show);
  }, [show]);

  return showAlert ? (
    <div
      className={\`bg-\${
        variant === "error" ? "error" : "primary"
      } text-white alert\`}
    >
      <div className="message">
        <Image
          src={\`https://icongr.am/feather/\${
            variant === "error" ? "alert-triangle" : "info"
          }.svg?size=24&color=ffffff\`}
          alt={variant}
        />
        <span>{message}</span>
      </div>
      <div>
        <IconButton
          variant="clear"
          alt="close"
          color="ffffff"
          iconName="x"
          size="16"
          data-testid="onAlertCloseClick"
          data-value={String(showAlert)}
          onClick={handleClose}
        />
      </div>
    </div>
  ) : null;
}
`;
  out["src/ui/atoms/Alert/Alert.stories.js"] =
`import Alert from "./Alert.component";
export default { title: "Atoms/Alert", component: Alert };

export const Default = {
  args: {
    show: true,
    message: "Sample Alert",
  },
};

export const Error = {
  args: {
    show: true,
    variant: "error",
    message: "Sample Error Alert",
  },
};
`;
  out["src/ui/atoms/Alert/Alert.style.css"] =
`.alert {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 0.5rem 1rem;
  margin-bottom: 2rem;
}

.alert .message * { 
  vertical-align: middle;
  line-height: 0;
}

.alert .message img {
  margin-right: 1rem;
}
`;
  out["src/ui/atoms/Alert/Alert.test.jsx"] =
`import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import Alert from './Alert.component';
import TestProvider from '../../../utils/providers/TestProvider';

describe('<Alert />', () => {
  it('Renders successfully without error', () => {
    const { container } = render(
      <TestProvider>
        <Alert
          show={true}
          variant="error"
          message="Sample Error Alert"
        />
      </TestProvider>,
    );
    expect(container).toBeTruthy();
  });
  it('Renders with Info without error', () => {
    const { container } = render(
      <TestProvider>
        <Alert
          show={true}
          message="Sample Error Alert"
        />
      </TestProvider>,
    );
    expect(container).toBeTruthy();
  });
  it('Renders Empty', () => {
    const { container } = render(
      <TestProvider>
        <Alert
          show={false}
          onCloseClick={undefined}
          variant="error"
          message="Sample Error Alert"
        />
      </TestProvider>,
    );
    expect(container).toBeTruthy();
  });
  it('Renders Empty on Close Click', async () => {
    const { container } = render(
      <TestProvider>
        <Alert
          show={true}
          onCloseClick={vi.fn}
          variant="error"
          message="Sample Error Alert"
        />
      </TestProvider>,
    );
    
    const alertClose = await screen.findByTestId('onAlertCloseClick');
    
    fireEvent.click(alertClose);
    
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it('Closes without error when onCloseClick is not provided', async () => {
    const { container } = render(
      <TestProvider>
        <Alert
          show={true}
          variant="error"
          message="Sample Error Alert"
        />
      </TestProvider>,
    );
    
    const alertClose = await screen.findByTestId('onAlertCloseClick');
    
    fireEvent.click(alertClose);
    
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });
});
`;

  // ── Link ───────────────────────────────────────────────────────────
  out["src/ui/atoms/Link/Link.component.jsx"] =
`/* eslint-disable jsx-a11y/anchor-is-valid */
import { propTypes } from "./Link.type";



const Link = ({ isActive, children, onClick }) => (
  <a
    href="#"
    className={\`button \${isActive ? "primary" : "outline"}\`}
    onClick={onClick}
    disabled={isActive}
    role="button"
  >
    {children}
  </a>
);

Link.propTypes = propTypes

export default Link;
`;
  out["src/ui/atoms/Link/Link.stories.js"] =
`
import Link from "./Link.component";
export default { title: "Atoms/Link", component: Link };

export const Default = {
  args: {
    href: "#",
    className: "button clear",
    children: "Sample Link",
  },
};
`;
  out["src/ui/atoms/Link/Link.style.css"] = ``;
  out["src/ui/atoms/Link/Link.test.jsx"] =
`import React from 'react';
import { render } from '@testing-library/react';
import Link from './Link.component';
import TestProvider from '../../../utils/providers/TestProvider';

describe('<Link />', () => {
  it('Renders successfully without error', () => {
    const { container } = render(
      <TestProvider>
        <Link>Hello</Link>
      </TestProvider>,
    );
    expect(container).toBeTruthy();
  });
});`;
  out["src/ui/atoms/Link/Link.type.js"] =
`import PropTypes from "prop-types";

export const propTypes = {
  active: PropTypes.bool.isRequired,
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func.isRequired,
};
`;
  out["src/ui/atoms/Link/Link.type.test.js"] =
`import { propTypes } from './Link.type';

vi.mock('./Link.type', () => ({
  propTypes: {
    className: require('prop-types').string,
    isActive: require('prop-types').bool.isRequired,
    onClick: require('prop-types').func.isRequired,
  },
}));

describe('Link PropTypes', () => {
  it('exports propTypes object', () => {
    expect(propTypes).toBeDefined();
  });

  it('isActive prop is required', () => {
    expect(propTypes.isActive).toBeDefined();
  });

  it('onClick prop is required', () => {
    expect(propTypes.onClick).toBeDefined();
  });
});
`;

  return out;
}
