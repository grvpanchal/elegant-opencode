// fetch-card ui-atom skill — entity-specific data card (e.g. WeatherCard).
//
// Skill principles (ui-atom):
//   • "Single Responsibility" — render ONE entity payload
//   • "Framework Agnostic Props" — driven entirely by `data` prop
//   • "Design Token Integration" — chota grid + style.css

export function emit(entity) {
  const Slice = entity.name;
  const Card = `${Slice}Card`;
  const fields = entity.responseFields || ["value"];

  const out = {};

  out[`src/ui/atoms/${Card}/${Card}.component.jsx`] =
`import PropTypes from "prop-types";
import "./${Card}.style.css";

const ${Card} = ({ data }) => {
  if (!data) return null;
  return (
    <article className="${Slice.toLowerCase()}-card card">
      <header>
        <h3>{data.query}</h3>
      </header>
      <dl>
${fields.map((f) => `        <div className="${Slice.toLowerCase()}-card__row"><dt>${f}</dt><dd>{String(data.${f})}</dd></div>`).join("\n")}
      </dl>
      <footer>
        <small>fetched: {data.fetchedAt}</small>
      </footer>
    </article>
  );
};

${Card}.propTypes = {
  data: PropTypes.shape({
    query: PropTypes.string,
${fields.map((f) => `    ${f}: PropTypes.any`).join(",\n")}
  })
};

export default ${Card};
`;

  out[`src/ui/atoms/${Card}/${Card}.style.css`] =
`.${Slice.toLowerCase()}-card { padding: 1rem; }
.${Slice.toLowerCase()}-card__row { display: flex; justify-content: space-between; padding: 0.25rem 0; }
.${Slice.toLowerCase()}-card__row dt { font-weight: 600; text-transform: capitalize; }
.${Slice.toLowerCase()}-card__row dd { margin: 0; }
`;

  out[`src/ui/atoms/${Card}/${Card}.stories.js`] =
`import ${Card} from "./${Card}.component";

export default {
  title: "atoms/${Card}",
  component: ${Card},
};

export const Default = {
  args: {
    data: {
      query: "Sample",
      fetchedAt: new Date().toISOString(),
${fields.map((f) => `      ${f}: 42`).join(",\n")}
    },
  },
};

export const Empty = { args: { data: null } };
`;

  out[`src/ui/atoms/${Card}/${Card}.test.jsx`] =
`import { render, screen } from "@testing-library/react";
import ${Card} from "./${Card}.component";

describe("${Card}", () => {
  it("renders the query as heading", () => {
    render(<${Card} data={{ query: "Q", fetchedAt: "now"${fields.map((f) => `, ${f}: 1`).join("")} }} />);
    expect(screen.getByRole("heading", { name: /Q/ })).toBeInTheDocument();
  });
  it("renders nothing when data is null", () => {
    const { container } = render(<${Card} data={null} />);
    expect(container.firstChild).toBeNull();
  });
});
`;

  out[`src/ui/atoms/${Card}/${Card}.type.js`] =
`import PropTypes from "prop-types";

export const propTypes = {
  data: PropTypes.shape({
    query: PropTypes.string,
${fields.map((f) => `    ${f}: PropTypes.any`).join(",\n")}
  })
};
`;

  return out;
}
