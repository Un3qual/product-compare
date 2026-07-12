import { renderToStaticMarkup } from "react-dom/server";
import { AppProviders } from "../../src/ui/providers/AppProviders";

test("renders the semantic theme boundary with compiled StyleX props", () => {
  const html = renderToStaticMarkup(
    <AppProviders>
      <div>content</div>
    </AppProviders>
  );

  expect(html).toContain('data-theme="default"');
  expect(html).toContain('class="');
  expect(html).toContain("content");
  expect(html).not.toContain('style=');
});
