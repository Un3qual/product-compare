# Base UI, StyleX, And Table Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Radix with ProductCompare-themed `shadcn-cssinjs`/Base UI primitives, convert all current tables to TanStack Table v9, and ship deterministic production StyleX class-name mangling across client and SSR builds.

**Architecture:** Vendor the approved registry snapshot into the existing primitive boundary, keep ProductCompare tokens authoritative, migrate consumers directly to the new APIs, and use specialized TanStack column models over shared semantic Table primitives. Split the supplied mangler prototype into deterministic class-name logic and a typed Vite plugin so separate client and SSR builds never depend on discovery order.

**Tech Stack:** React 19.2.4, Base UI 1.7.0, shadcn-cssinjs registry commit `5f0337ee4606f5d6c8f3cb2cb95924c8a70e9a5f`, StyleX 0.18.1, TanStack React Table 9.1.2, Vite 8.2.0, Vitest 4.1.8, Playwright 1.58.2.

## Global Constraints

- Preserve GraphQL, Relay, React Router SSR, Phoenix session, URL, ownership, and product behavior.
- Preserve the warm mineral/paper ProductCompare identity, local fonts, 44px targets, responsive hierarchy, and reduced-motion parity.
- Remove every Radix dependency, import, stylesheet, provider, and compatibility-only primitive in this batch.
- Use the copied registry components as the primitive source; do not add Tailwind, a second token source, or generic wrapper layers.
- Use TanStack Table v9 core models for all three existing tables without inventing client-owned sorting, filtering, pagination, selection, or virtualization.
- Production mangling must be deterministic across independent client and SSR builds and must fail closed on collisions.
- Preserve unrelated user work and commit only coherent code, test, dependency, and lane-evidence milestones.

---

### Task 1: Deterministic StyleX production mangling

**Files:**
- Create: `assets/plugins/stylex-class-name.ts`
- Move and rewrite: `assets/src/stylex-mangle.ts` -> `assets/plugins/stylex-mangle.ts`
- Create: `assets/test/build/stylex-mangle.test.ts`
- Create: `assets/scripts/check-stylex-mangle.ts`
- Modify: `assets/stylex-plugin.ts`, `assets/vite.config.ts`, `assets/package.json`, `assets/tsconfig.json`

**Interfaces:**
- `mangleStylexClassName(name, prefix): string | null` returns one stable short name for one atomic StyleX class and returns `null` for variables, keyframes, and non-StyleX identifiers.
- `rewriteStylexClassNames(text, prefix): { code: string; changed: boolean }` rewrites exact atomic tokens only.
- `stylexMangle({ classNamePrefix })` returns a production-only Vite plugin.

- [ ] Add failing unit cases for invalid options, boundary-safe matching, base-36 to base-62 determinism, discovery-order independence, client/SSR parity, JavaScript/CSS/HTML rewriting, collision failure, and untouched variables/keyframes.
- [ ] Run `cd assets && pnpm run test:unit -- test/build/stylex-mangle.test.ts`; confirm failure because the new build modules do not exist.
- [ ] Implement the two focused build modules using official Vite/Rollup types and the approved direct hash encoding; delete bundle-local ordinal allocation, AST-wide reservation heuristics, dynamic dependency imports, and write-after-build mutation.
- [ ] Configure Babel and Vite with one `__pcx_` production prefix and enable the mangler after the React/StyleX transform only for `vite build`.
- [ ] Add `check:stylex` to the production build chain and assert both client and SSR output contain shortened names and no unmangled atomic prefix.
- [ ] Run the focused test, `pnpm run typecheck`, and `pnpm run build`; confirm the mangling and existing bundle contracts pass.
- [ ] Commit the plugin milestone with the user-supplied file history preserved through the move.

### Task 2: Base UI and shadcn-cssinjs primitive cutover

**Files:**
- Modify: `assets/package.json`, `assets/pnpm-lock.yaml`, `assets/stylex-plugin.ts`, `assets/src/ui/theme/tokens.stylex.ts`, `assets/src/ui/theme/theme.css`, `assets/src/ui/providers/AppProviders.tsx`
- Replace: `assets/src/ui/primitives/**`
- Modify: existing ProductCompare composites and all current Radix-importing route components under `assets/src/ui/**` and `assets/src/routes/**`
- Modify: `assets/test/ui/primitives.test.tsx`, `assets/test/ui/app-providers.test.tsx`, focused overlay/layout tests, and Select test helpers

**Interfaces:**
- Local primitives follow the copied registry names and Base UI `render` composition contract.
- Button variants are `default | destructive | outline | secondary | ghost | link`; sizes are `default | sm | lg | icon | icon-sm | icon-lg` and every interactive size retains a 44px target.
- Select uses the registry compound API and Base UI form participation; ProductCompare forms compose `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, and `SelectItem` directly.
- ProductCompare tokens remain the only palette and spacing authority; shadcn semantic variables alias to them.

- [ ] Extend behavior tests first for Base UI render composition, 44px controls, real form values/reset, controlled Select updates, keyboard highlight, dialog focus return, provider SSR markup, and standardized data slots; confirm focused RED failures against the Radix implementation.
- [ ] Add exact `@base-ui/react@1.7.0`, current registry-required icon dependencies, and exact registry source provenance; add only the approved component files.
- [ ] Adapt registry imports and tokens, then migrate ProductCompare composites and route consumers directly from `asChild`, old variants/sizes/tones, and one-piece Select calls.
- [ ] Replace Radix Theme, Badge, Callout, Spinner, Popover, Tabs, ScrollArea, Dialog, AlertDialog, Accordion, form primitives, and disclosure imports with local components.
- [ ] Remove Slot, Radix-specific test helpers and source-text architecture checks, every `@radix-ui/*` dependency, and the Radix Themes stylesheet.
- [ ] Run focused primitive, provider, overlay, layout, root, auth, catalog, product, compare, account, and operations tests until behavior parity is green.
- [ ] Run `pnpm run typecheck`, `pnpm run lint`, and `pnpm run format:check`; confirm no Radix import or dependency remains.
- [ ] Commit the component-foundation milestone.

### Task 3: TanStack Table v9 conversion

**Files:**
- Add: `assets/src/ui/primitives/Table.tsx`
- Modify: `assets/src/routes/commerce/revenue/AttributionLedger.tsx`
- Modify: `assets/src/routes/compare/DecisionSummary.tsx`
- Modify: `assets/src/routes/compare/CompareSpecificationMatrix.tsx`
- Modify: `assets/test/routes/commerce/revenue/revenue-summary.route.test.tsx`, `assets/test/routes/compare/compare.route.test.tsx`, `assets/package.json`, `assets/pnpm-lock.yaml`

**Interfaces:**
- Each table owns a `tableFeatures({})`, typed `ColumnDef`, stable data, and `useTable` instance.
- Rendering uses `table.getHeaderGroups()`, `table.getRowModel().rows`, `row.getAllCells()`, and `table.FlexRender` through local `Table*` primitives.
- Relay and URL state remain outside TanStack.

- [ ] Add failing route assertions for the standardized table container/header/body/cell slots while retaining every existing accessible header, row, mixed-currency, missing-cell, pagination, retry, and empty-state assertion.
- [ ] Add exact `@tanstack/react-table@9.1.2` and the copied registry Table primitive.
- [ ] Convert Attribution Ledger with stable v9 columns while preserving Relay pagination and failure isolation.
- [ ] Convert Decision Summary and Specification Matrix with stable v9 columns while preserving exact product and row order.
- [ ] Run focused compare and revenue route suites, then typecheck, lint, and formatting; confirm no generic DataTable abstraction or unused TanStack feature was added.
- [ ] Commit the table milestone.

### Task 4: Complete verification and queue closeout

**Files:**
- Modify: `assets/tests/e2e/production-ui-home.spec.ts` and snapshots only when the verified Base UI rendering changes them intentionally
- Modify: `docs/work/base-ui-stylex-table-foundation.md`, `docs/work/index.md`, `docs/plans/INDEX.md`

**Interfaces:**
- The lane document records observed commands, counts, bundle measurements, browser evidence, and any retained risks.
- The live queue removes this active row only after all checks and the anti-slop review pass.

- [ ] Run the complete `cd assets && pnpm run check` gate, including client/SSR mangling and bundle contracts.
- [ ] Run deterministic Playwright coverage at desktop, tablet, and mobile widths; verify keyboard interaction, focus, overlays, Select, disclosures, tables, reduced motion, axe, and no overflow, then inspect changed snapshots at original resolution.
- [ ] Run `mix work_queue.validate`, `mix format --check-formatted`, and `git diff --check`.
- [ ] Audit the final diff for Radix remnants, duplicate token sources, compatibility shims, unnecessary wrappers, unstable table data, hydration drift, mangling collisions, and unrelated churn.
- [ ] Record final evidence, close the active queue row while retaining at least three ready rows, and commit the verified implementation closeout.
