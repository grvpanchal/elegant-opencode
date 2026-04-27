// ui-skeleton skill — placeholder for content-loading states.
//
// Skill principles:
//   • "Match Final Layout" — same dimensions as the loaded content
//   • "Progressive Disclosure" — appear instantly, fade out when data arrives
//   • "Reduce Perceived Latency" — smooth animation suggests progress
//
// Universal pattern; no entity-specific bits. Note the typo "Skeletion.stories.js"
// is preserved because that's the filename in the chota-react-redux template.

export function emit(_entity) {
  return {
    "src/ui/skeletons/Skeleton/Skeletion.stories.js":
`import Skeleton from "./Skeleton.component";
export default { title: "Skeletons/Skeleton", component: Skeleton };

export const Default = {
  args: {
    variant: "text",
  },
};

export const Image = {
  args: {
    variant: "text",
    height: "400px",
    width: "600px",
  },
};

export const Avatar = {
    args: {
      variant: "circle",
      height: "64px",
      width: "64px",
    },
  };
`,

    "src/ui/skeletons/Skeleton/Skeleton.component.jsx":
`import "./Skeleton.style.css";

export default function Skeleton({ variant, height, width, style }) {
  return (
    <div
      className={\`skeleton skeleton-\${variant ? variant : "text"}\`}
      style={{
        ...style,
        height,
        width,
      }}
    ></div>
  );
}
`,

    "src/ui/skeletons/Skeleton/Skeleton.style.css":
`.skeleton {
  animation: skeleton-loading 1s linear infinite alternate;
}

@keyframes skeleton-loading {
  0% {
    background-color: hsl(200, 20%, 80%);
  }
  100% {
    background-color: hsl(200, 20%, 95%);
  }
}

.skeleton-text {
  width: 100%;
  height: 1rem;
  margin-bottom: 0.5rem;
  border-radius: 0.25rem;
}

.skeleton-circle {
  border-radius: 50%;
}
`,

    "src/ui/skeletons/Skeleton/Skeleton.test.jsx":
`import React from 'react';
import { render } from '@testing-library/react';
import Skeleton from './Skeleton.component';

describe('<Skeleton />', () => {
  it('Renders successfully without error with default props', () => {
    const { container, rerender } = render(<Skeleton />);
    expect(container).toBeTruthy();
    const skeleton = container.querySelector('.skeleton');
    expect(skeleton).toHaveClass('skeleton-text');
  });

  it('Renders with custom variant prop', () => {
    const { container } = render(<Skeleton variant="circle" />);
    const skeleton = container.querySelector('.skeleton');
    expect(skeleton).toHaveClass('skeleton-circle');
  });

  it('Applies custom height style when provided', () => {
    const { container } = render(<Skeleton height="50px" />);
    const skeleton = container.querySelector('.skeleton');
    expect(skeleton.style.height).toBe('50px');
  });

  it('Applies custom width style when provided', () => {
    const { container } = render(<Skeleton width="200px" />);
    const skeleton = container.querySelector('.skeleton');
    expect(skeleton.style.width).toBe('200px');
  });

  it('Applies custom style prop', () => {
    const { container } = render(<Skeleton style={{ borderRadius: '8px' }} />);
    const skeleton = container.querySelector('.skeleton');
    expect(skeleton.style.borderRadius).toBe('8px');
  });

  it('Combines custom height and width styles', () => {
    const { container } = render(<Skeleton height="100px" width="300px" />);
    const skeleton = container.querySelector('.skeleton');
    expect(skeleton.style.height).toBe('100px');
    expect(skeleton.style.width).toBe('300px');
  });

  it('Renders with default text variant when no variant prop', () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.querySelector('.skeleton');
    expect(skeleton.classList.contains('skeleton-text')).toBe(true);
  });
});
`
  };
}
