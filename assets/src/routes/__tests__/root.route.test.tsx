import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { RootLayout, RootRoute } from "../root";

test("root layout renders a compare link in the primary navigation", () => {
  const html = renderToStaticMarkup(
    <MemoryRouter>
      <RootLayout />
    </MemoryRouter>
  );

  expect(html).toContain("Compare products");
  expect(html).toContain('href="/compare"');
});

test("renders product compare shell title", () => {
  const html = renderToStaticMarkup(
    <MemoryRouter>
      <RootRoute />
    </MemoryRouter>
  );
  expect(html).toContain("Product Compare");
  expect(html).toContain("Browse products");
  expect(html).toContain("Compare products");
  expect(html).toContain('href="/products"');
  expect(html).toContain('href="/compare"');
});
