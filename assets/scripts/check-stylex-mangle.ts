import { readFile, readdir } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { findStylexClassNames } from "../plugins/stylex-class-name.ts";
import { STYLEX_CLASS_NAME_PREFIX } from "../stylex-plugin.ts";

const scriptDirectory = fileURLToPath(new URL(".", import.meta.url));
const distDirectory = resolve(scriptDirectory, "../dist");
const textExtensions = new Set([".css", ".html", ".js", ".mjs"]);
const failures: string[] = [];
const outputContracts = {
  client: { references: new Set<string>(), registrations: new Set<string>() },
  ssr: { references: new Set<string>(), registrations: new Set<string>() },
};
const escapedPrefix = STYLEX_CLASS_NAME_PREFIX.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const stylexHash = `${escapedPrefix}(?:0|[1-9a-z][0-9a-z]*)`;
const variablePattern = new RegExp(`--(${stylexHash})(?![A-Za-z0-9_-])`, "g");
const constKeyPattern = new RegExp(`\\bconstKey\\s*:\\s*(["'\\\`])(${stylexHash})\\1`, "g");

for (const entry of await readdir(distDirectory, {
  recursive: true,
  withFileTypes: true,
})) {
  if (!entry.isFile() || !textExtensions.has(extname(entry.name))) {
    continue;
  }

  const path = resolve(entry.parentPath, entry.name);
  const source = await readFile(path, "utf8");
  const output = path.startsWith(resolve(distDirectory, "server") + "/")
    ? outputContracts.ssr
    : outputContracts.client;

  if (findStylexClassNames(source, STYLEX_CLASS_NAME_PREFIX).size > 0) {
    failures.push(path.slice(distDirectory.length + 1));
  }

  for (const match of source.matchAll(variablePattern)) {
    output.references.add(match[1]!);
  }

  for (const match of source.matchAll(constKeyPattern)) {
    output.registrations.add(match[2]!);
  }
}

for (const [label, output] of Object.entries(outputContracts)) {
  const missing = [...output.references].filter((name) => !output.registrations.has(name));

  if (missing.length > 0) {
    failures.push(`${label}: unregistered StyleX constants ${missing.join(", ")}`);
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
  `StyleX class mangling contract passed: atomic classes are shortened and generated constants are registered in client and SSR output.\n`,
);
