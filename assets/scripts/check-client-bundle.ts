import { readFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { dirname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

interface ManifestChunk {
  css?: string[];
  dynamicImports?: string[];
  file: string;
  imports?: string[];
  isDynamicEntry?: boolean;
  isEntry?: boolean;
  name?: string;
  src?: string;
}

type Manifest = Record<string, ManifestChunk>;

const scriptDirectory = fileURLToPath(new URL(".", import.meta.url));
const manifestPath = resolve(scriptDirectory, "../dist/.vite/manifest.json");
const distPath = resolve(scriptDirectory, "../dist");

// The measured initial JS/CSS closure is 270,072 gzip bytes. The 300 KB
// ceiling leaves room for ordinary Vite and dependency patch drift.
const INITIAL_GZIP_BUDGET_BYTES = 300_000;
const INITIAL_FONT_BUDGET_BYTES = 44_800;

const requiredDynamicRoutes = [
  ["affiliate setup screen", "src/routes/affiliate/setup/AffiliateSetupRoute.tsx"],
  ["CJ programs screen", "src/routes/ingestion/cj-programs/CJProgramsRoute.tsx"],
  ["revenue screen", "src/routes/commerce/revenue/RevenueSummaryRoute.tsx"],
  ["API tokens screen", "src/routes/account/api-tokens/ApiTokensRoute.tsx"],
] as const;

const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as Manifest;
const manifestEntries = Object.entries(manifest);
const clientEntries = manifestEntries.filter(([, chunk]) => chunk.isEntry);

if (clientEntries.length !== 1) {
  throw new Error(
    `Expected exactly one client entry in ${manifestPath}, found ${clientEntries.length}.`,
  );
}

const [entryKey] = clientEntries[0];
const entryDynamicImports = new Set(manifest[entryKey]?.dynamicImports ?? []);
const initialClosure = collectStaticImportClosure(manifest, entryKey);
const initialFiles = [
  ...new Set(
    [...initialClosure].flatMap((key) => {
      const chunk = manifest[key];
      return chunk ? [chunk.file, ...(chunk.css ?? [])] : [];
    }),
  ),
];
const initialBundleFiles = initialFiles.filter(
  (file) => file.endsWith(".js") || file.endsWith(".css"),
);
const initialJavaScriptFiles = initialBundleFiles.filter((file) => file.endsWith(".js"));
const initialCssFiles = initialBundleFiles.filter((file) => file.endsWith(".css"));
let initialRawBytes = 0;
let initialGzipBytes = 0;

for (const file of initialBundleFiles) {
  const contents = await readFile(resolve(distPath, file));
  initialRawBytes += contents.byteLength;
  initialGzipBytes += gzipSync(contents).byteLength;
}

const initialFontFiles = new Set<string>();

for (const cssFile of initialCssFiles) {
  const css = await readFile(resolve(distPath, cssFile), "utf8");

  for (const fontReference of css.matchAll(
    /url\(\s*["']?([^"')]+\.woff2(?:[?#][^"')]*)?)["']?\s*\)/gi,
  )) {
    const reference = fontReference[1]?.split(/[?#]/, 1)[0];
    if (!reference || /^(?:data:|https?:|\/\/)/i.test(reference)) continue;

    const relativeFontPath = normalize(
      reference.startsWith("/") ? reference.slice(1) : join(dirname(cssFile), reference),
    );
    if (relativeFontPath.startsWith("..")) {
      throw new Error(`Initial CSS ${cssFile} references a font outside dist: ${reference}`);
    }
    initialFontFiles.add(relativeFontPath);
  }
}

let initialFontBytes = 0;

for (const file of initialFontFiles) {
  initialFontBytes += (await readFile(resolve(distPath, file))).byteLength;
}

const failures: string[] = [];

if (initialGzipBytes > INITIAL_GZIP_BUDGET_BYTES) {
  failures.push(
    `initial static JavaScript/CSS closure is ${initialGzipBytes.toLocaleString()} gzip bytes, ` +
      `above the ${INITIAL_GZIP_BUDGET_BYTES.toLocaleString()}-byte budget`,
  );
}

if (initialFontBytes > INITIAL_FONT_BUDGET_BYTES) {
  failures.push(
    `referenced initial WOFF2 transfer is ${initialFontBytes.toLocaleString()} raw bytes, ` +
      `above the ${INITIAL_FONT_BUDGET_BYTES.toLocaleString()}-byte font budget`,
  );
}

for (const [label, expectedSource] of requiredDynamicRoutes) {
  const match = findManifestEntry(expectedSource);

  if (!match) {
    failures.push(`${label} route has no manifest chunk for ${expectedSource}`);
    continue;
  }

  const [chunkKey, chunk] = match;
  if (!chunk.isDynamicEntry && !entryDynamicImports.has(chunkKey)) {
    failures.push(`${label} route chunk ${chunk.file} is not reachable through a dynamic import`);
  }
  if (initialClosure.has(chunkKey)) {
    failures.push(`${label} route chunk ${chunk.file} is in the initial static import closure`);
  }
}

if (failures.length > 0) {
  throw new Error(
    [
      "Client bundle contract failed:",
      ...failures.map((failure) => `- ${failure}`),
      `Initial closure: ${initialRawBytes.toLocaleString()} raw / ${initialGzipBytes.toLocaleString()} gzip bytes across ${initialJavaScriptFiles.length} JavaScript and ${initialCssFiles.length} CSS file(s).`,
      `Initial fonts: ${initialFontBytes.toLocaleString()} raw bytes across ${initialFontFiles.size} WOFF2 font file(s); font budget ${INITIAL_FONT_BUDGET_BYTES.toLocaleString()} bytes.`,
      "Build the client after moving every non-root route behind a direct React Router lazy import.",
    ].join("\n"),
  );
}

process.stdout.write(
  `Client bundle contract passed: ${initialRawBytes.toLocaleString()} raw / ${initialGzipBytes.toLocaleString()} gzip bytes ` +
    `across ${initialJavaScriptFiles.length} initial JavaScript and ${initialCssFiles.length} CSS file(s); budget ${INITIAL_GZIP_BUDGET_BYTES.toLocaleString()} gzip bytes.\n`,
);
process.stdout.write(
  `Initial fonts: ${initialFontBytes.toLocaleString()} raw bytes across ${initialFontFiles.size} initial WOFF2 font file(s); ` +
    `font budget ${INITIAL_FONT_BUDGET_BYTES.toLocaleString()} bytes.\n`,
);

function collectStaticImportClosure(manifest: Manifest, entryKey: string) {
  const closure = new Set<string>();
  const pending = [entryKey];

  while (pending.length > 0) {
    const key = pending.pop();
    if (!key || closure.has(key)) continue;

    const chunk = manifest[key];
    if (!chunk) {
      throw new Error(`Manifest import ${key} does not resolve to a chunk.`);
    }

    closure.add(key);
    pending.push(...(chunk.imports ?? []));
  }

  return closure;
}

function normalizeSource(source: string) {
  return source.replace(/\\/g, "/").replace(/^_+/, "");
}

function findManifestEntry(expectedSource: string) {
  return manifestEntries.find(
    ([key, chunk]) => normalizeSource(chunk.src ?? key) === expectedSource,
  );
}
