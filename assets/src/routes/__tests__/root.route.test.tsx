import { renderToStaticMarkup } from "react-dom/server";
import { RootRoute } from "../root";

test("renders product compare shell title", () => {
  const html = renderToStaticMarkup(<RootRoute />);
  expect(html).toContain("Product Compare");
});
