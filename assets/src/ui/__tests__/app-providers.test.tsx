import { renderToStaticMarkup } from "react-dom/server";
import { AppProviders } from "../providers/app-providers";

test("renders theme wrapper with compiled style props", () => {
  const html = renderToStaticMarkup(
    <AppProviders>
      <div>content</div>
    </AppProviders>
  );

  expect(html).toContain('data-theme="default"');
  expect(html).toContain('class="');
  expect(html).not.toContain('style=');
});
