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
    await mkdir(join(fixtureRoot, "dist", ".vite"), { recursive: true });
    await mkdir(join(fixtureRoot, "dist", "assets"), { recursive: true });
    await writeFile(
      join(fixtureRoot, "scripts", "check-client-bundle.ts"),
      await readFile(join(process.cwd(), "scripts", "check-client-bundle.ts")),
    );
    await writeFile(
      join(fixtureRoot, "dist", ".vite", "manifest.json"),
      JSON.stringify(bundleFixtureManifest()),
    );
    await writeFile(join(fixtureRoot, "dist", "assets", "entry.js"), "console.log('fixture');");
    await writeFile(
      join(fixtureRoot, "dist", "assets", "entry.css"),
      "@font-face{src:url('./ui-latin.woff2') format('woff2')} body{color:#111}",
    );
    await writeFile(join(fixtureRoot, "dist", "assets", "ui-latin.woff2"), new Uint8Array(64));
    for (const routeFile of ["affiliate.js", "cj.js", "revenue.js", "tokens.js"]) {
      await writeFile(join(fixtureRoot, "dist", "assets", routeFile), "export {};");
    }

    const { stdout } = await execFileAsync(process.execPath, [
      join(fixtureRoot, "scripts", "check-client-bundle.ts"),
    ]);

    expect(stdout).toMatch(/64 raw bytes across 1 initial WOFF2 font file/i);
    expect(stdout).toMatch(/font budget/i);

    await writeFile(join(fixtureRoot, "dist", "assets", "ui-latin.woff2"), new Uint8Array(44_801));

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
    "src/entry.client.tsx": {
      css: ["assets/entry.css"],
      dynamicImports: ["affiliate", "cj", "revenue", "tokens"],
      file: "assets/entry.js",
      isEntry: true,
      src: "src/entry.client.tsx",
    },
    affiliate: {
      file: "assets/affiliate.js",
      isDynamicEntry: true,
      src: "src/routes/affiliate/setup/AffiliateSetupRoute.tsx",
    },
    cj: {
      file: "assets/cj.js",
      isDynamicEntry: true,
      src: "src/routes/ingestion/cj-programs/CJProgramsRoute.tsx",
    },
    revenue: {
      file: "assets/revenue.js",
      isDynamicEntry: true,
      src: "src/routes/commerce/revenue/RevenueSummaryRoute.tsx",
    },
    tokens: {
      file: "assets/tokens.js",
      isDynamicEntry: true,
      src: "src/routes/account/api-tokens/ApiTokensRoute.tsx",
    },
  };
}
