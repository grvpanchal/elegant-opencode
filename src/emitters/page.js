// server-page skill — page composition.
//
// Skill principles:
//   • "Template + Data = Page" — page composes Layout (template) with
//     containers (data)
//   • "Data Fetching Boundary" — containers handle their own data
//   • "Route Mapping" — single root page mapped to "/"
//
// The HomePage composes the three feature containers (SiteHeader, {Entity}List,
// {Entity}Filters) inside the Layout, using the entity name as the prefix.

export function emit(entity) {
  const Slice = entity.name; // "Todo"
  return {
    "src/pages/index.jsx":
`
import SiteHeaderContainer from "../containers/SiteHeaderContainer";
import Layout from "../ui/templates/Layout/Layout.component";
import ${Slice}FiltersContainer from "../containers/${Slice}FiltersContainer";
import ${Slice}ListContainer from "../containers/${Slice}ListContainer";

export default function HomePage() {
  return (
    <Layout>
      <SiteHeaderContainer />
      <${Slice}ListContainer />
      <${Slice}FiltersContainer />
    </Layout>
  );
}
`
  };
}
