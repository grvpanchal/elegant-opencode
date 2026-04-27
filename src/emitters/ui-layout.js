// ui-template skill — page Layout shell.
//
// Skill principles:
//   • "Structure Over Content" — Layout owns positioning, not data
//   • "Layout Orchestration" — wraps all section organisms in a container
//   • "Content Agnostic" — accepts any children

export function emit(_entity) {
  return {
    "src/ui/templates/Layout/Layout.component.jsx":
`

import "./Layout.style.css";

export default function Layout({ children }) {
  return (
    <div className="container layout">
      {children}
    </div>
  );
}
`,
    "src/ui/templates/Layout/Layout.style.css":
`.layout.container {
  max-width: 370px;
}
`
  };
}
