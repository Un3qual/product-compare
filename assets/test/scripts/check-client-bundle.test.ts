import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

test("client bundle gate reports and enforces referenced initial WOFF2 transfer", async () => {
  const fixtureRoot = await mkdtemp(join(tmpdir(), "product-compare-bundle-gate-"));

  try {
    await mkdir(join(fixtureRoot, "scripts"), { recursive: true });
    await mkdir(join(fixtureRoot, "dist", "client", "assets"), { recursive: true });
    await writeFile(
      join(fixtureRoot, "scripts", "check-client-bundle.ts"),
      await readFile(join(process.cwd(), "scripts", "check-client-bundle.ts")),
    );
    await writeFile(
      join(fixtureRoot, "dist", "client", "assets", "manifest-fixture.js"),
      `window.__reactRouterManifest=${JSON.stringify(bundleFixtureManifest())};`,
    );
    await writeFile(
      join(fixtureRoot, "dist", "client", "assets", "entry.js"),
      "console.log('fixture');",
    );
    await writeFile(join(fixtureRoot, "dist", "client", "assets", "root.js"), "export {};");
    await writeFile(join(fixtureRoot, "dist", "client", "assets", "home.js"), "export {};");
    await writeFile(
      join(fixtureRoot, "dist", "client", "assets", "entry.css"),
      "@font-face{src:url('./ui-latin.woff2') format('woff2')} body{color:#111}",
    );
    await writeFile(
      join(fixtureRoot, "dist", "client", "assets", "home.css"),
      "@font-face{src:url('./home-latin.woff2') format('woff2')}",
    );
    await writeFile(
      join(fixtureRoot, "dist", "client", "assets", "ui-latin.woff2"),
      new Uint8Array(64),
    );
    await writeFile(
      join(fixtureRoot, "dist", "client", "assets", "home-latin.woff2"),
      new Uint8Array(44_736),
    );
    for (const routeFile of [
      "affiliate.js",
      "cj.js",
      "conversion-ingestion.js",
      "revenue.js",
      "tokens.js",
    ]) {
      await writeFile(join(fixtureRoot, "dist", "client", "assets", routeFile), "export {};");
    }

    const { stdout } = await execFileAsync(process.execPath, [
      join(fixtureRoot, "scripts", "check-client-bundle.ts"),
    ]);

    expect(stdout).toMatch(/44,800 raw bytes across 2 initial WOFF2 font file/i);
    expect(stdout).toMatch(/font budget/i);

    await writeFile(
      join(fixtureRoot, "dist", "client", "assets", "home-latin.woff2"),
      new Uint8Array(44_737),
    );

    await expect(
      execFileAsync(process.execPath, [join(fixtureRoot, "scripts", "check-client-bundle.ts")]),
    ).rejects.toMatchObject({
      stderr: expect.stringMatching(
        /referenced initial WOFF2 transfer is 44,801 raw bytes.*above/i,
      ),
    });
  } finally {
    await rm(fixtureRoot, { recursive: true, force: true });
  }
});

function bundleFixtureManifest() {
  return {
    entry: {
      css: ["assets/entry.css"],
      imports: [],
      module: "/assets/entry.js",
    },
    routes: {
      root: {
        css: [],
        imports: [],
        module: "/assets/root.js",
      },
      "routes/home/HomeRoute": {
        css: ["assets/home.css"],
        imports: [],
        module: "/assets/home.js",
      },
      "routes/affiliate/setup/AffiliateSetupRoute": route("affiliate"),
      "routes/ingestion/cj-programs/CJProgramsRoute": route("cj"),
      "routes/commerce/revenue/ingestion/ConversionIngestionRoute": route("conversion-ingestion"),
      "routes/commerce/revenue/RevenueSummaryRoute": route("revenue"),
      "routes/account/api-tokens/ApiTokensRoute": route("tokens"),
    },
  };
}

function route(name: string) {
  return {
    css: [],
    imports: [],
    module: `/assets/${name}.js`,
  };
}
