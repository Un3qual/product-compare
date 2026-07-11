import { renderToStaticMarkup } from "react-dom/server";
import { AppProviders } from "../../src/ui/providers/AppProviders";

test("renders theme wrapper with compiled style props", () => {
  const html = renderToStaticMarkup(
    <AppProviders>
      <div>content</div>
    </AppProviders>
  );

  expect(html).toContain('data-theme="default"');
  expect(html).toContain('class="radix-themes');
  expect(html).toContain('data-accent-color="indigo"');
  expect(html).toContain('class="');
  expect(html).not.toContain('style=');
});
