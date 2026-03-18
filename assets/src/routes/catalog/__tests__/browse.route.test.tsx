import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { BrowseRoute } from "../browse";

test("renders the catalog browse heading", () => {
  const html = renderToStaticMarkup(
    <MemoryRouter>
      <BrowseRoute />
    </MemoryRouter>
  );

  expect(html).toContain("Browse products");
});
