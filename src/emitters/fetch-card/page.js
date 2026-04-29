// fetch-card server-page skill — page composes the container in the layout.
//
// Skill principles:
//   • "Template + Data = Page" — Layout (template) hosts containers (data)
//   • "Route Mapping" — a single root page mapped to "/"
//
// File shape mirrors the crud-list page emitter: a single src/pages/index.jsx
// that App.jsx can import via `import HomePage from "./pages"`.

export function emit(entity) {
  const Slice = entity.name;
  const ViewContainer = `${Slice}ViewContainer`;

  return {
    "src/pages/index.jsx":
`
import SiteHeaderContainer from "../containers/SiteHeaderContainer";
import Layout from "../ui/templates/Layout/Layout.component";
import ${ViewContainer} from "../containers/${ViewContainer}";

export default function HomePage() {
  return (
    <Layout>
      <SiteHeaderContainer />
      <${ViewContainer} />
    </Layout>
  );
}
`
  };
}
