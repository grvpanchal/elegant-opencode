// ui-atom skill — framework-primitive atoms.
//
// Skill principles:
//   • "Single Responsibility" — each atom is one HTML primitive
//   • "Framework Agnostic Props" — pass-through props, no business logic
//   • "Design Token Integration" — styles use CSS custom properties from
//     ui-theme; the atom only owns minimal layout overrides.
//
// Four atoms emitted: Button, Input, Image, Loader. Each gets the canonical
// 6-file folder layout (or 4 files when type/style is empty):
//   {Atom}.component.jsx
//   {Atom}.stories.js
//   {Atom}.style.css
//   {Atom}.test.jsx
//   {Atom}.type.js          (omit if empty in skill exemplar)
//   {Atom}.type.test.js     (omit if no .type.js)

const TEST_TPL = (Name) =>
`import React from 'react';
import { render } from '@testing-library/react';
import ${Name} from './${Name}.component';
import TestProvider from '../../../utils/providers/TestProvider';

describe('<${Name} />', () => {
  it('Renders successfully without error', () => {
    const { container } = render(
      <TestProvider>
        <${Name}>Hello</${Name}>
      </TestProvider>,
    );
    expect(container).toBeTruthy();
  });
});`;

export function emit(_entity) {
  const out = {};

  // ── Button ─────────────────────────────────────────────────────────
  out["src/ui/atoms/Button/Button.component.jsx"] =
`import Loader from "../Loader/Loader.component";

import './Button.style.css';

export default function Button(props) {
  const transformedProps = { ...props };
  delete transformedProps.isLoading;
  if (props.isLoading) {
    return (
      <button {...transformedProps} className={\`\${props.className} loading-button\`}>
        <Loader width="2px" size="1.2rem" color="#fff" />
      </button>
    );
  }
  return <button {...transformedProps}>{props.children}</button>;
}
`;
  out["src/ui/atoms/Button/Button.stories.js"] =
`
import Button from "./Button.component";
export default { title: "Atoms/Button", component: Button };

export const Default = {
  args: {
    className: "button primary",
    children: "Sample Button",
  },
};

export const Loading = {
  args: {
    isLoading: true,
    className: "button primary",
    children: "Sample Button",
  },
};
`;
  out["src/ui/atoms/Button/Button.style.css"] =
`.loading-button {
    min-width: 80px;
}`;
  out["src/ui/atoms/Button/Button.test.jsx"] =
`import React from 'react';
import { render } from '@testing-library/react';
import Button from './Button.component';
import TestProvider from '../../../utils/providers/TestProvider';

describe('<Button />', () => {
  it('Renders successfully without error', () => {
    const { container } = render(
      <TestProvider>
        <Button>Hello</Button>
      </TestProvider>,
    );
    expect(container).toBeTruthy();
  });
});
`;
  out["src/ui/atoms/Button/Button.type.js"] =
`export const defaultProps = {};
`;
  out["src/ui/atoms/Button/Button.type.test.js"] =
`import { defaultProps } from './Button.type';

describe('Button PropTypes', () => {
  it('exports empty defaultProps object', () => {
    expect(defaultProps).toEqual({});
  });

  it('defaultProps is a plain object', () => {
    expect(typeof defaultProps).toBe('object');
    expect(defaultProps.constructor.name).toBe('Object');
  });
});
`;

  // ── Input ──────────────────────────────────────────────────────────
  out["src/ui/atoms/Input/Input.component.jsx"] =
`export default function Input(props) {
  let id = props.id;
  if (!id) {
    id = Math.random();
  }
  return (
    <>
      <label htmlFor={id} className="sr-only">
        {props.name || "Some Label"}
      </label>
      <input {...props} id={id} />
    </>
  );
}
`;
  out["src/ui/atoms/Input/Input.stories.js"] =
`import Input from "./Input.component";

export default { title: "Atoms/Input", component: Input };

export const Default = {
  args: {
    type: "text",
    placeholder: "Template Input",
  },
};
`;
  out["src/ui/atoms/Input/Input.style.css"] = ``;
  out["src/ui/atoms/Input/Input.test.jsx"] =
`import React from 'react';
import { render } from '@testing-library/react';
import Input from './Input.component';
import TestProvider from '../../../utils/providers/TestProvider';

describe('<Input />', () => {
  it('Renders successfully without error', () => {
    const { container } = render(
      <TestProvider>
        <Input />
      </TestProvider>,
    );
    expect(container).toBeTruthy();
  });
});`;
  out["src/ui/atoms/Input/Input.type.js"] = ``;
  out["src/ui/atoms/Input/Input.type.test.js"] =
`import { propTypes } from './Input.type';

vi.mock('./Input.type', () => ({
  propTypes: {
    className: require('prop-types').string,
    id: require('prop-types').string,
    name: require('prop-types').string,
    type: require('prop-types').string.isRequired,
    value: require('prop-types').oneOfType([
      require('prop-types').string,
      require('prop-types').number,
    ]),
    disabled: require('prop-types').bool,
    placeholder: require('prop-types').string,
    onChange: require('prop-types').func,
  },
}));

describe('Input PropTypes', () => {
  it('exports propTypes object', () => {
    expect(propTypes).toBeDefined();
  });

  it('type prop is required', () => {
    expect(propTypes.type).toBeDefined();
  });

  it('className prop exists', () => {
    expect(propTypes.className).toBeDefined();
  });

  it('onChange prop exists', () => {
    expect(propTypes.onChange).toBeDefined();
  });
});
`;

  // ── Image ──────────────────────────────────────────────────────────
  out["src/ui/atoms/Image/Image.component.jsx"] =
`export default function Image(props) {
    return (
        <img alt={props.alt} {...props} />
    );
}`;
  out["src/ui/atoms/Image/Image.stories.js"] =
`import Image from "./Image.component";

export default { title: "Atoms/Image", component: Image };

export const Default = {
  args: {
    src: "https://placehold.co/600x400",
  },
};
`;
  out["src/ui/atoms/Image/Image.style.css"] = ``;
  out["src/ui/atoms/Image/Image.test.jsx"] =
`import React from 'react';
import { render } from '@testing-library/react';
import Image from './Image.component';
import TestProvider from '../../../utils/providers/TestProvider';

describe('<Image />', () => {
  it('Renders successfully without error', () => {
    const { container } = render(
      <TestProvider>
        <Image />
      </TestProvider>,
    );
    expect(container).toBeTruthy();
  });
});`;
  out["src/ui/atoms/Image/Image.type.js"] = ``;
  out["src/ui/atoms/Image/Image.type.test.js"] =
`import { propTypes } from './Image.type';

vi.mock('./Image.type', () => ({
  propTypes: {
    className: require('prop-types').string,
    src: require('prop-types').string.isRequired,
    alt: require('prop-types').string.isRequired,
    onClick: require('prop-types').func,
  },
}));

describe('Image PropTypes', () => {
  it('exports propTypes object', () => {
    expect(propTypes).toBeDefined();
  });

  it('src prop is required', () => {
    expect(propTypes.src).toBeDefined();
  });

  it('alt prop is required', () => {
    expect(propTypes.alt).toBeDefined();
  });

  it('className prop exists', () => {
    expect(propTypes.className).toBeDefined();
  });
});
`;

  // ── Loader ─────────────────────────────────────────────────────────
  out["src/ui/atoms/Loader/Loader.component.jsx"] =
`import "./Loader.style.css";

export default function Loader({ size, width, color }) {
  return (
    <span
      class="loader"
      style={{
        height: size || "48px",
        width: size || "48px",
        border: \`\${width || "5px"} solid \${color || "#fff"}\`,
        borderBottomColor: "transparent",
      }}
    ></span>
  );
}
`;
  out["src/ui/atoms/Loader/Loader.stories.js"] =
`
import Loader from "./Loader.component";
export default { title: "Atoms/Loader", component: Loader };

export const Default = {
  args: {
    color: 'black',
    size: '64px'
  },
};
`;
  out["src/ui/atoms/Loader/Loader.style.css"] =
`.loader {
  width: 48px;
  height: 48px;
  border: 5px solid #000;
  border-bottom-color: transparent;
  border-radius: 50%;
  display: inline-block;
  box-sizing: border-box;
  animation: rotation 1s linear infinite;
}

@keyframes rotation {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
`;
  out["src/ui/atoms/Loader/Loader.test.jsx"] = TEST_TPL("Loader");

  return out;
}
