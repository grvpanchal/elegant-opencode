// fetch-card server-container skill — wires useSelector / useDispatch.
//
// Skill principle: "Containers are dumb pipes" — they don't render UI. They
// project store state into props, dispatch action creators on events, and
// pass both into the organism.

export function emit(entity) {
  const Slice = entity.name;
  const slice = entity.slice;
  const View = `${Slice}View`;
  const ViewContainer = `${View}Container`;
  const appName = entity.appName || `${Slice} App`;

  const out = {};

  // === ConfigContainer ======================================================
  out["src/containers/ConfigContainer.js"] =
`import { useEffect } from "react";
import { useSelector } from "react-redux";

export default function ConfigContainer() {
  const configData = useSelector((state) => state.config);
  useEffect(() => {
    const bodyClass = document.body.classList;
    configData.theme === 'dark'
      ? bodyClass.add("dark")
      : bodyClass.remove("dark");
  }, [configData.theme]);
  return null;
}
`;

  out["src/containers/ConfigContainer.test.jsx"] =
`import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { createStore } from "redux";
import rootReducer from "../state/rootReducer";
import ConfigContainer from "./ConfigContainer";

describe("<ConfigContainer />", () => {
  it("renders nothing", () => {
    const store = createStore(rootReducer);
    const { container } = render(<Provider store={store}><ConfigContainer /></Provider>);
    expect(container.firstChild).toBeNull();
  });
});
`;

  // === SiteHeaderContainer ==================================================
  out["src/containers/SiteHeaderContainer.jsx"] =
`import { useDispatch, useSelector } from "react-redux";
import SiteHeader from "../ui/organisms/SiteHeader/SiteHeader.component";
import { updateConfig } from "../state/config/config.actions";

export default function SiteHeaderContainer() {
  const configData = useSelector((state) => state.config);
  const dispatch = useDispatch();
  const events = {
    onThemeChangeClick: () => dispatch(
      updateConfig({ theme: configData.theme === "light" ? "dark" : "light" })
    ),
  };
  const headerData = { brandName: configData.name, theme: configData.theme };
  return <SiteHeader headerData={headerData} events={events} />;
}
`;

  out["src/containers/SiteHeaderContainer.test.jsx"] =
`import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { createStore } from "redux";
import rootReducer from "../state/rootReducer";
import SiteHeaderContainer from "./SiteHeaderContainer";

const preloadedState = {
  ${slice}: { data: null, loading: false, error: null, query: "" },
  config: { name: "${appName}", lang: "en", theme: "light" },
};

describe("<SiteHeaderContainer />", () => {
  it("renders the brand name from config", () => {
    const store = createStore(rootReducer, preloadedState);
    render(<Provider store={store}><SiteHeaderContainer /></Provider>);
    expect(screen.getByText("${appName}")).toBeInTheDocument();
  });
});
`;

  // === ViewContainer (e.g. WeatherViewContainer) ============================
  out[`src/containers/${ViewContainer}.jsx`] =
`import { useSelector, useDispatch } from "react-redux";
import ${View} from "../ui/organisms/${View}/${View}.component";
import { fetch${Slice} } from "../state/${slice}/${slice}.actions";
import {
  select${Slice}Data,
  select${Slice}Loading,
  select${Slice}Error,
  select${Slice}Query,
} from "../state/${slice}/${slice}.selectors";

export default function ${ViewContainer}() {
  const data = useSelector(select${Slice}Data);
  const loading = useSelector(select${Slice}Loading);
  const error = useSelector(select${Slice}Error);
  const query = useSelector(select${Slice}Query);
  const dispatch = useDispatch();

  const viewData = { data, loading, error, query };
  const events = {
    onSubmit: (q) => dispatch(fetch${Slice}(q)),
  };

  return <${View} viewData={viewData} events={events} />;
}
`;

  out[`src/containers/${ViewContainer}.test.jsx`] =
`import { render, screen, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import { createStore, applyMiddleware } from "redux";
import rootReducer from "../state/rootReducer";
import ajaxMiddleware from "../state/middleware/ajax.middleware";
import ${ViewContainer} from "./${ViewContainer}";

describe("<${ViewContainer} />", () => {
  it("renders the empty-state hint with no data", () => {
    const store = createStore(rootReducer, applyMiddleware(ajaxMiddleware));
    render(<Provider store={store}><${ViewContainer} /></Provider>);
    expect(screen.getByText(/Submit a query/i)).toBeInTheDocument();
  });
});
`;

  return out;
}
