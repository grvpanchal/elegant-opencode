// fetch-card ui-organism skill — loading/error/data wrapping organism
// (e.g. WeatherView) plus the universal SiteHeader.
//
// Skill principles:
//   • "Handle every state" — the organism MUST render meaningful UI for
//     loading, error, empty, and ready states (the four-states rule).
//   • "Composition over creation" — composes molecules + atoms; never
//     fetches data itself.

export function emit(entity) {
  const Slice = entity.name;
  const View = `${Slice}View`;
  const Card = `${Slice}Card`;
  const QueryForm = `${Slice}QueryForm`;
  const appName = entity.appName || `${Slice} App`;

  const out = {};

  // === SiteHeader (universal organism, identical across archetypes) ========
  out["src/ui/organisms/SiteHeader/SiteHeader.component.jsx"] =
`import './SiteHeader.style.css';

export default function SiteHeader({ headerData, events }) {
  const { brandName, theme } = headerData;
  const { onThemeChangeClick } = events;
  return (
    <header className="header">
      <div className="header-block">
        <div><h1>{brandName}</h1></div>
        <div>
          <h1 role="button" onClick={() => onThemeChangeClick()} className="text-right pointer">
            {theme === "dark" ? "☀️" : "🌙"}
          </h1>
        </div>
      </div>
    </header>
  );
}
`;

  out["src/ui/organisms/SiteHeader/SiteHeader.stories.js"] =
`import SiteHeader from "./SiteHeader.component";
export default { title: "Organisms/SiteHeader", component: SiteHeader };
const events = { onThemeChangeClick: () => {} };
export const Default = {
  args: {
    headerData: { brandName: '${appName}', theme: 'light' },
    events,
  },
};
`;

  out["src/ui/organisms/SiteHeader/SiteHeader.style.css"] =
`.header { padding: 5rem 0 1rem 0; }
.header-block { display: flex; justify-content: space-between; }
.pointer { cursor: pointer; }
`;

  out["src/ui/organisms/SiteHeader/SiteHeader.test.jsx"] =
`import { render, screen, fireEvent } from "@testing-library/react";
import SiteHeader from "./SiteHeader.component";
import TestProvider from "../../../utils/providers/TestProvider";

describe("<SiteHeader />", () => {
  const headerData = { brandName: "My ${appName}", theme: "light" };
  const events = { onThemeChangeClick: vi.fn() };

  beforeEach(() => events.onThemeChangeClick.mockClear());

  it("renders without crashing", () => {
    render(<TestProvider><SiteHeader headerData={headerData} events={events} /></TestProvider>);
    expect(screen.getByText("My ${appName}")).toBeInTheDocument();
  });
  it("calls onThemeChangeClick", () => {
    render(<TestProvider><SiteHeader headerData={headerData} events={events} /></TestProvider>);
    fireEvent.click(screen.getByRole("button", { name: /🌙/ }));
    expect(events.onThemeChangeClick).toHaveBeenCalled();
  });
});
`;

  // === WeatherView / domain organism ========================================
  out[`src/ui/organisms/${View}/${View}.component.jsx`] =
`import PropTypes from "prop-types";
import Loader from "../../atoms/Loader/Loader.component";
import Alert from "../../atoms/Alert/Alert.component";
import ${QueryForm} from "../../molecules/${QueryForm}/${QueryForm}.component";
import ${Card} from "../../atoms/${Card}/${Card}.component";

const ${View} = ({ viewData, events }) => {
  const { data, loading, error, query } = viewData;
  return (
    <section className="${Slice.toLowerCase()}-view">
      <${QueryForm}
        initialValue={query || ""}
        isLoading={loading}
        onSubmit={events.onSubmit}
      />
      {loading && <Loader />}
      {error && !loading && <Alert variant="error">{error}</Alert>}
      {!loading && !error && data && <${Card} data={data} />}
      {!loading && !error && !data && (
        <p className="text-grey">Submit a query to fetch ${Slice.toLowerCase()} data.</p>
      )}
    </section>
  );
};

${View}.propTypes = {
  viewData: PropTypes.shape({
    data: PropTypes.object,
    loading: PropTypes.bool,
    error: PropTypes.string,
    query: PropTypes.string,
  }).isRequired,
  events: PropTypes.shape({
    onSubmit: PropTypes.func.isRequired,
  }).isRequired,
};

export default ${View};
`;

  out[`src/ui/organisms/${View}/${View}.stories.js`] =
`import ${View} from "./${View}.component";

export default { title: "organisms/${View}", component: ${View} };

const events = { onSubmit: () => {} };

export const Empty = { args: { viewData: { data: null, loading: false, error: null, query: "" }, events } };
export const Loading = { args: { viewData: { data: null, loading: true, error: null, query: "x" }, events } };
export const Error = { args: { viewData: { data: null, loading: false, error: "Boom", query: "x" }, events } };
export const Ready = {
  args: {
    viewData: {
      data: { query: "Sample", fetchedAt: "now" },
      loading: false,
      error: null,
      query: "Sample",
    },
    events,
  },
};
`;

  out[`src/ui/organisms/${View}/${View}.test.jsx`] =
`import { render, screen } from "@testing-library/react";
import ${View} from "./${View}.component";

const events = { onSubmit: () => {} };

describe("<${View} />", () => {
  it("renders empty state hint when no data and not loading", () => {
    render(<${View} viewData={{ data: null, loading: false, error: null, query: "" }} events={events} />);
    expect(screen.getByText(/Submit a query/i)).toBeInTheDocument();
  });
  it("renders loader when loading", () => {
    const { container } = render(<${View} viewData={{ data: null, loading: true, error: null, query: "x" }} events={events} />);
    expect(container.querySelector(".loader")).toBeTruthy();
  });
  it("renders error message when error is set", () => {
    render(<${View} viewData={{ data: null, loading: false, error: "Boom", query: "x" }} events={events} />);
    expect(screen.getByText(/Boom/)).toBeInTheDocument();
  });
});
`;

  return out;
}
