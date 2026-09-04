import { readdir, readFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { dirname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

interface RouteManifestEntry {
  css: string[];
  imports: string[];
  module: string;
}

interface BrowserManifest {
  entry: RouteManifestEntry;
  routes: Record<string, RouteManifestEntry>;
}

const scriptDirectory = fileURLToPath(new URL(".", import.meta.url));
const distPath = resolve(scriptDirectory, "../dist/client");
const assetsPath = resolve(distPath, "assets");
const manifestFiles = (await readdir(assetsPath)).filter(
  (file) => file.startsWith("manifest-") && file.endsWith(".js"),
);

if (manifestFiles.length !== 1) {
  throw new Error(
    `Expected exactly one React Router browser manifest in ${assetsPath}, found ${manifestFiles.length}.`,
  );
}

const manifestPath = resolve(assetsPath, manifestFiles[0]);
const manifestSource = await readFile(manifestPath, "utf8");
const manifestPrefix = "window.__reactRouterManifest=";

if (!manifestSource.startsWith(manifestPrefix)) {
  throw new Error(`Unexpected React Router browser manifest format in ${manifestPath}.`);
}

const manifest = JSON.parse(
  manifestSource.slice(manifestPrefix.length).replace(/;\s*$/, ""),
) as BrowserManifest;

// The measured initial JS/CSS closure is 288,389 gzip bytes. The 300 KB
// ceiling leaves room for ordinary Vite and dependency patch drift.
const INITIAL_GZIP_BUDGET_BYTES = 300_000;
const INITIAL_FONT_BUDGET_BYTES = 44_800;

const requiredDynamicRoutes = [
  ["affiliate setup screen", "routes/affiliate/setup/AffiliateSetupRoute"],
  ["CJ programs screen", "routes/ingestion/cj-programs/CJProgramsRoute"],
  ["conversion ingestion screen", "routes/commerce/revenue/ingestion/ConversionIngestionRoute"],
  ["revenue screen", "routes/commerce/revenue/RevenueSummaryRoute"],
  ["API tokens screen", "routes/account/api-tokens/ApiTokensRoute"],
] as const;

const rootRoute = manifest.routes.root;
const indexRoute = manifest.routes["routes/home/HomeRoute"];

if (!rootRoute) {
  throw new Error(`React Router browser manifest ${manifestPath} has no root route.`);
}

if (!indexRoute) {
  throw new Error(`React Router browser manifest ${manifestPath} has no home index route.`);
}

const initialFiles = new Set([
  manifest.entry.module,
  ...manifest.entry.imports,
  ...manifest.entry.css,
  rootRoute.module,
  ...rootRoute.imports,
  ...rootRoute.css,
  indexRoute.module,
  ...indexRoute.imports,
  ...indexRoute.css,
]);
const initialBundleFiles = [...initialFiles].filter(
  (file) => file.endsWith(".js") || file.endsWith(".css"),
);
const initialJavaScriptFiles = initialBundleFiles.filter((file) => file.endsWith(".js"));
const initialCssFiles = initialBundleFiles.filter((file) => file.endsWith(".css"));
let initialRawBytes = 0;
let initialGzipBytes = 0;

for (const file of initialBundleFiles) {
  const contents = await readFile(resolveManifestAsset(file));
  initialRawBytes += contents.byteLength;
  initialGzipBytes += gzipSync(contents).byteLength;
}

const initialFontFiles = new Set<string>();

for (const cssFile of initialCssFiles) {
  const relativeCssFile = cssFile.replace(/^\//, "");
  const css = await readFile(resolveManifestAsset(cssFile), "utf8");

  for (const fontReference of css.matchAll(
    /url\(\s*["']?([^"')]+\.woff2(?:[?#][^"')]*)?)["']?\s*\)/gi,
  )) {
    const reference = fontReference[1]?.split(/[?#]/, 1)[0];
    if (!reference || /^(?:data:|https?:|\/\/)/i.test(reference)) continue;

    const relativeFontPath = normalize(
      reference.startsWith("/") ? reference.slice(1) : join(dirname(relativeCssFile), reference),
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

for (const [label, routeId] of requiredDynamicRoutes) {
  const route = manifest.routes[routeId];

  if (!route) {
    failures.push(`${label} route has no React Router manifest entry for ${routeId}`);
    continue;
  }

  if (initialFiles.has(route.module)) {
    failures.push(`${label} route chunk ${route.module} is in the initial static import closure`);
  }
}

if (failures.length > 0) {
  throw new Error(
    [
      "Client bundle contract failed:",
      ...failures.map((failure) => `- ${failure}`),
      `Initial closure: ${initialRawBytes.toLocaleString()} raw / ${initialGzipBytes.toLocaleString()} gzip bytes across ${initialJavaScriptFiles.length} JavaScript and ${initialCssFiles.length} CSS file(s).`,
      `Initial fonts: ${initialFontBytes.toLocaleString()} raw bytes across ${initialFontFiles.size} WOFF2 font file(s); font budget ${INITIAL_FONT_BUDGET_BYTES.toLocaleString()} bytes.`,
      "Keep non-root routes in separate React Router route modules.",
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

function resolveManifestAsset(file: string) {
  return resolve(distPath, file.replace(/^\//, ""));
}
