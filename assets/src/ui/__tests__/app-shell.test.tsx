import { renderToStaticMarkup } from "react-dom/server";
import { AppShell } from "../components/layout/app-shell";

test("renders primary nav landmarks", () => {
  const html = renderToStaticMarkup(
    <AppShell>
      <div>content</div>
    </AppShell>
  );

  expect(html).toContain('aria-label="Primary"');
  expect(html).toContain('class="');
  expect(html).not.toContain('style=');
});
