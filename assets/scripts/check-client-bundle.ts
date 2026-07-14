import { readFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { resolve } from "node:path";

interface ManifestChunk {
  dynamicImports?: string[];
  file: string;
  imports?: string[];
  isDynamicEntry?: boolean;
  isEntry?: boolean;
  name?: string;
  src?: string;
}

type Manifest = Record<string, ManifestChunk>;

const manifestPath = resolve(import.meta.dir, "../dist/.vite/manifest.json");
const distPath = resolve(import.meta.dir, "../dist");

// Set from the measured post-split closure (180,879 bytes gzip) with roughly
// 10.6% headroom for ordinary Vite and dependency patch drift.
const INITIAL_GZIP_BUDGET_BYTES = 200_000;

const requiredDynamicRoutes = [
  ["affiliate setup screen", "src/routes/affiliate/setup/AffiliateSetupRoute.tsx"],
  [
    "affiliate setup loader",
    "src/routes/affiliate/setup/loader.ts",
    "src/routes/affiliate/setup/AffiliateSetupRoute.tsx"
  ],
  ["feed candidates screen", "src/routes/ingestion/feed-candidates/FeedCandidatesRoute.tsx"],
  [
    "feed candidates loader",
    "src/routes/ingestion/feed-candidates/loader.ts",
    "src/routes/ingestion/feed-candidates/FeedCandidatesRoute.tsx"
  ],
  ["revenue screen", "src/routes/commerce/revenue/RevenueSummaryRoute.tsx"],
  [
    "revenue loader",
    "src/routes/commerce/revenue/loader.ts",
    "src/routes/commerce/revenue/RevenueSummaryRoute.tsx"
  ],
  ["API tokens screen", "src/routes/account/api-tokens/ApiTokensRoute.tsx"],
  [
    "API tokens loader",
    "src/routes/account/api-tokens/loader.ts",
    "src/routes/account/api-tokens/ApiTokensRoute.tsx"
  ]
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
const entryDynamicImports = new Set(manifest[entryKey]?.dynamicImports ?? []);
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

for (const [label, expectedSource, relatedScreenSource] of requiredDynamicRoutes) {
  const match = findManifestEntry(expectedSource, relatedScreenSource);

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

process.stdout.write(
  `Client bundle contract passed: ${initialRawBytes.toLocaleString()} raw / ${initialGzipBytes.toLocaleString()} gzip bytes ` +
    `across ${initialJavaScriptFiles.length} initial JavaScript file(s); budget ${INITIAL_GZIP_BUDGET_BYTES.toLocaleString()} gzip bytes.\n`
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

function findManifestEntry(expectedSource: string, relatedScreenSource?: string) {
  const directMatch = manifestEntries.find(
    ([key, chunk]) => normalizeSource(chunk.src ?? key) === expectedSource
  );
  if (directMatch || !relatedScreenSource) return directMatch;

  // Rollup omits `src` when a directly imported loader is also shared with its
  // screen. Associate that facade through the screen's static imports and the
  // client entry's dynamic-import graph instead of relying on output hashes.
  const screenMatch = manifestEntries.find(
    ([key, chunk]) => normalizeSource(chunk.src ?? key) === relatedScreenSource
  );
  if (!screenMatch) return undefined;

  const loaderName = expectedSource.split("/").at(-1)?.replace(/\.[^.]+$/, "");
  const candidates = (screenMatch[1].imports ?? []).filter((key) => {
    const chunk = manifest[key];
    return chunk?.name === loaderName && chunk.isDynamicEntry && entryDynamicImports.has(key);
  });

  return candidates.length === 1 ? ([candidates[0], manifest[candidates[0]]] as const) : undefined;
}
