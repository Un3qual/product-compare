import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { RootRoute } from "../root";

test("renders product compare shell title", () => {
  const html = renderToStaticMarkup(
    <MemoryRouter>
      <RootRoute />
    </MemoryRouter>
  );
  expect(html).toContain("Product Compare");
});
