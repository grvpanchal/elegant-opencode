// fetch-card ui-molecule skill — query form (input + submit).
//
// Skill principles:
//   • "Composition over creation" — wraps Input + Button atoms
//   • "Single cohesive purpose" — capture a query string and submit it
//   • "Props passthrough" — driven by formData + events from parent

export function emit(entity) {
  const Slice = entity.name;
  const QueryForm = `${Slice}QueryForm`;
  const queryField = entity.queryField || "query";
  const placeholder = entity.queryPlaceholder || `Enter a ${queryField}…`;
  const lower = Slice.toLowerCase();

  const out = {};

  out[`src/ui/molecules/${QueryForm}/${QueryForm}.component.jsx`] =
`import { useState } from "react";
import PropTypes from "prop-types";
import Input from "../../atoms/Input/Input.component";
import Button from "../../atoms/Button/Button.component";
import "./${QueryForm}.style.css";

const ${QueryForm} = ({ initialValue = "", onSubmit, isLoading = false }) => {
  const [value, setValue] = useState(initialValue);
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!value) return;
    onSubmit(value);
  };
  return (
    <form className="${lower}-query-form" onSubmit={handleSubmit}>
      <Input
        name="${queryField}"
        type="text"
        placeholder="${placeholder}"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <Button type="submit" disabled={isLoading || !value}>
        {isLoading ? "Loading…" : "Fetch"}
      </Button>
    </form>
  );
};

${QueryForm}.propTypes = {
  initialValue: PropTypes.string,
  onSubmit: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};

export default ${QueryForm};
`;

  out[`src/ui/molecules/${QueryForm}/${QueryForm}.style.css`] =
`.${lower}-query-form { display: flex; gap: 0.5rem; align-items: center; }
.${lower}-query-form input { flex: 1; }
`;

  out[`src/ui/molecules/${QueryForm}/${QueryForm}.stories.js`] =
`import ${QueryForm} from "./${QueryForm}.component";

export default {
  title: "molecules/${QueryForm}",
  component: ${QueryForm},
};

export const Default = { args: { onSubmit: () => {}, isLoading: false } };
export const Loading = { args: { onSubmit: () => {}, isLoading: true } };
`;

  out[`src/ui/molecules/${QueryForm}/${QueryForm}.test.jsx`] =
`import { render, screen, fireEvent } from "@testing-library/react";
import ${QueryForm} from "./${QueryForm}.component";

describe("${QueryForm}", () => {
  it("calls onSubmit with the typed value", () => {
    const onSubmit = vi.fn();
    render(<${QueryForm} onSubmit={onSubmit} />);
    fireEvent.change(screen.getByPlaceholderText("${placeholder}"), {
      target: { value: "abc" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Fetch/i }));
    expect(onSubmit).toHaveBeenCalledWith("abc");
  });
  it("disables submit while loading", () => {
    render(<${QueryForm} onSubmit={() => {}} isLoading initialValue="x" />);
    expect(screen.getByRole("button", { name: /Loading/i })).toBeDisabled();
  });
});
`;

  return out;
}
