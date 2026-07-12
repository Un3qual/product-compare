import { readFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { resolve } from "node:path";

interface ManifestChunk {
  file: string;
  imports?: string[];
  isDynamicEntry?: boolean;
  isEntry?: boolean;
  src?: string;
}

type Manifest = Record<string, ManifestChunk>;

const manifestPath = resolve(import.meta.dir, "../dist/.vite/manifest.json");
const distPath = resolve(import.meta.dir, "../dist");

// Set from the measured post-split closure (180,879 bytes gzip) with roughly
// 10.6% headroom for ordinary Vite and dependency patch drift.
const INITIAL_GZIP_BUDGET_BYTES = 200_000;

const requiredDynamicRoutes = [
  ["affiliate setup", "src/routes/affiliate/setup/AffiliateSetupRoute.tsx"],
  ["feed candidates", "src/routes/ingestion/feed-candidates/FeedCandidatesRoute.tsx"],
  ["revenue", "src/routes/commerce/revenue/RevenueSummaryRoute.tsx"],
  ["API tokens", "src/routes/account/api-tokens/ApiTokensRoute.tsx"]
] as const;

const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as Manifest;
const manifestEntries = Object.entries(manifest);
const clientEntries = manifestEntries.filter(([, chunk]) => chunk.isEntry);

if (clientEntries.length !== 1) {
  throw new Error(
    `Expected exactly one client entry in ${manifestPath}, found ${clientEntries.length}.`
  );
}

const [entryKey] = clientEntries[0];
const initialClosure = collectStaticImportClosure(manifest, entryKey);
const initialFiles = [...initialClosure].map((key) => manifest[key]?.file).filter(Boolean);
const initialJavaScriptFiles = initialFiles.filter((file) => file.endsWith(".js"));
let initialRawBytes = 0;
let initialGzipBytes = 0;

for (const file of initialJavaScriptFiles) {
  const contents = await readFile(resolve(distPath, file));
  initialRawBytes += contents.byteLength;
  initialGzipBytes += gzipSync(contents).byteLength;
}

const failures: string[] = [];

if (initialGzipBytes > INITIAL_GZIP_BUDGET_BYTES) {
  failures.push(
    `initial static JavaScript closure is ${initialGzipBytes.toLocaleString()} gzip bytes, ` +
      `above the ${INITIAL_GZIP_BUDGET_BYTES.toLocaleString()}-byte budget`
  );
}

for (const [label, expectedSource] of requiredDynamicRoutes) {
  const match = manifestEntries.find(
    ([key, chunk]) => normalizeSource(chunk.src ?? key) === expectedSource
  );

  if (!match) {
    failures.push(`${label} route has no manifest chunk for ${expectedSource}`);
    continue;
  }

  const [chunkKey, chunk] = match;
  if (!chunk.isDynamicEntry) {
    failures.push(`${label} route chunk ${chunk.file} is not marked as a dynamic entry`);
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
      `Initial closure: ${initialRawBytes.toLocaleString()} raw / ${initialGzipBytes.toLocaleString()} gzip bytes across ${initialJavaScriptFiles.length} JavaScript file(s).`,
      "Build the client after moving every non-root route and loader behind direct React Router lazy imports."
    ].join("\n")
  );
}

console.log(
  `Client bundle contract passed: ${initialRawBytes.toLocaleString()} raw / ${initialGzipBytes.toLocaleString()} gzip bytes ` +
    `across ${initialJavaScriptFiles.length} initial JavaScript file(s); budget ${INITIAL_GZIP_BUDGET_BYTES.toLocaleString()} gzip bytes.`
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
  return source.replaceAll("\\", "/").replace(/^_+/, "");
}
