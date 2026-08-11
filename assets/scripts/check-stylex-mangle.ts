import { readFile, readdir } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { findStylexClassNames } from "../plugins/stylex-class-name.ts";
import { STYLEX_CLASS_NAME_PREFIX } from "../stylex-plugin.ts";

const scriptDirectory = fileURLToPath(new URL(".", import.meta.url));
const distDirectory = resolve(scriptDirectory, "../dist");
const textExtensions = new Set([".css", ".html", ".js", ".mjs"]);
const failures: string[] = [];

for (const entry of await readdir(distDirectory, {
  recursive: true,
  withFileTypes: true,
})) {
  if (!entry.isFile() || !textExtensions.has(extname(entry.name))) {
    continue;
  }

  const path = resolve(entry.parentPath, entry.name);
  const source = await readFile(path, "utf8");

  if (findStylexClassNames(source, STYLEX_CLASS_NAME_PREFIX).size > 0) {
    failures.push(path.slice(distDirectory.length + 1));
  }
}

if (failures.length > 0) {
  throw new Error(
    [
      `StyleX class mangling left atomic classes with the production prefix "${STYLEX_CLASS_NAME_PREFIX}" in build output:`,
      ...failures.map((file) => `- ${file}`),
    ].join("\n"),
  );
}

process.stdout.write(
  `StyleX class mangling contract passed: no "${STYLEX_CLASS_NAME_PREFIX}" atomic classes remain in client or SSR output.\n`,
);
