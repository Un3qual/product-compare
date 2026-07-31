import { readFileSync, readdirSync } from "node:fs";
import { relative, resolve } from "node:path";

test("frontend modules use project Radix wrappers for visible form controls", () => {
  const assetsRoot = process.cwd();
  const sourceRoot = resolve(assetsRoot, "src");

  const offenders = sourceFiles(sourceRoot)
    .flatMap((path) => visibleNativeControls(path).map((control) => ({ control, path })))
    .map(({ control, path }) => `${relative(assetsRoot, path)}: <${control}>`)
    .sort();

  expect(offenders).toEqual([]);
});

function visibleNativeControls(path: string) {
  const source = readFileSync(path, "utf8");

  return [...source.matchAll(/<(button|input|select|textarea)\b([^>]*)>/g)]
    .filter(([, control, attributes]) => {
      return control !== "input" || !/\btype\s*=\s*["']hidden["']/.test(attributes);
    })
    .map(([, control]) => control);
}

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);

    if (entry.isDirectory()) {
      return sourceFiles(path);
    }

    return /\.[jt]sx$/.test(entry.name) ? [path] : [];
  });
}
