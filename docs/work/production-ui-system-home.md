# Production UI System Spine And Home

## Snapshot

- Status: active
- Owner: Codex subagent-driven implementation in the current managed worktree
- Priority: P0
- Plan: `docs/superpowers/plans/2026-08-10-production-ui-system-home-implementation-plan.md`
- Design: `docs/superpowers/specs/2026-08-10-production-ui-redesign-design.md`
- Last verified: 2026-08-10 against the live router, GraphQL schema, context boundaries, frontend package scripts, and complete route behavior inventory.

## Target Outcome

ProductCompare has one stable production visual spine and a useful index route with ranked search, category shortcuts, a bounded six-row product ledger, URL-backed comparison continuity, and isolated new, trending, and owner-private relevant deals. The root viewer contract, SSR hydration, existing route behavior, privacy, query budgets, accessibility, responsive hierarchy, bundle budget, and plain-language boundary remain intact.

## Owned Paths

- Shared frontend package, router, root navigation, layout, feedback, primitive, theme, font, brand, comparison-continuity, and product-ledger paths named by the plan.
- New `assets/src/routes/home/**`, focused home/root/UI tests, generated Home Relay artifacts, and the home Playwright spec/snapshots.
- Focused Catalog, Specs, Pricing, Alerts, Commerce Attribution, GraphQL home schema/resolver, and tests named by the plan.
- `docs/work/production-ui-system-home.md`.

## Internal Slices

1. Exact set-based workspace, price, activity, watch, and saved-comparison read contracts.
2. Typed GraphQL workspace/deal operations with owner privacy and fixed query budgets.
3. Warm visual tokens, local fonts, responsive navigation, layouts, primitives, and restrained motion.
4. Index-owned workbench with essential workspace and optional fault-isolated deals.
5. Desktop/tablet/mobile browser, accessibility, reduced-motion, visual, bundle, and production verification.

## Verified Preconditions

- The written design and complete functionality matrix are approved.
- The current root loader contains viewer/session data only and the index route has no separate data loader.
- Catalog, SEO, Specs, Pricing, Alerts, saved comparisons, and Commerce Attribution already own the source facts required by the approved read contracts.
- The current frontend uses React Router loaders/SSR, Relay, StyleX, local Radix wrappers, Vitest, and Playwright.
- The four successor cohorts have complete plans but depend on this stable shared spine and are not yet dispatchable.

## Verification

- Focused RED/GREEN domain boundary and GraphQL semantic/privacy/query-budget suites named by the plan.
- Focused home, root, router, UI, URL, SSR, degraded-state, and responsive unit tests.
- Deterministic Playwright journeys, axe scans, reduced motion, and inspected snapshots at 1440×1000, 900×1100, and 390×844.
- `cd assets && pnpm run check`.
- Focused backend tests, `mix typecheck`, `mix quality`, and `mix format --check-formatted`.
- `mix work_queue.validate` and `git diff --check`.

## Blocker Rule

Stop if exact deal semantics cannot remain set-based, viewer facts can cross an ownership boundary, a font cannot fit the existing bundle budget, a shared component requires route-kind flags, or owned paths conflict with active work. Record the exact query, privacy, bundle, component, or path evidence; do not weaken product policy or widen later cohort ownership.

## Completion

Complete every feature-parity ledger row, record observed tests and screenshots, then close this row and promote all four path-disjoint successor cohorts together only after the shared owners are stable.

## Progress

- 2026-08-10: Claimed for implementation. Task 1 domain boundary tests and set-based reads are in progress.
- 2026-08-10: Task 1 added bounded Catalog, SEO, Specs, Pricing, Alerts, and Commerce Attribution home reads. Focused domain suite passed (21 tests); the full backend suite also passed in an isolated `MIX_TEST_PARTITION=_task1` database while another process held the shared test-database lock.
- 2026-08-10: Task 2 added non-null typed `homeWorkspace` and `homeDeals` GraphQL operations. The resolver composes set-based domain reads under one observed timestamp, encodes presentation ids with `GlobalId`, keeps guest deal relevance empty, and scopes signed-in relevance exclusively to `context.current_user`; signed-in viewers without matches receive an ordered public-deal fallback. The focused semantic, privacy, and fixed-budget suite passed (3 tests), SDL was regenerated, and Relay generation completed.
- 2026-08-10: Task 3 established the shared production UI spine: warm mineral/paper semantic tokens with compatibility aliases, local Instrument Sans and IBM Plex Mono font packages and OFL-1.1 notices, 44px controls, visible focus and reduced-motion overrides, a compact compare mark, normalized numbered comparison continuity, and one semantic product-ledger list with Radix disclosure. Primary navigation now keeps Search and Compare direct while guest, member, and operator destinations use responsive Radix disclosure menus rather than a horizontal link strip. Router metadata now uses “details” instead of the internal term “evidence.” RED/GREEN component, token, navigation, and metadata tests passed; complete frontend unit suite, typecheck, lint, and format checks passed under Node 25.6.0 with the known pnpm engine warning.
- 2026-08-10: Task 3 Fix Round 1 made skip navigation transfer focus to the main working region, verified focused Button and TextField contracts with rendered 44px target styles, and marked ledger freshness with explicit freshness tokens. Small ledger labels now use compliant secondary ink rather than subtle ink. The focused UI suite passed (107 files, 1,538 tests), as did typecheck, lint, format, and the production build/bundle gate: 274,894 gzip bytes, 25,106 bytes below the 300,000-byte budget (4,822 bytes above the prior 270,072-byte measurement).
- 2026-08-10: Task 3 Fix Round 2 removed the testing-only focus marker. Keyboard-focus coverage now verifies each real Button/TextField element is focused and that the loaded production CSSOM binds its `:focus-visible` selector to the compare-blue two-pixel outline. The corrected focused command names only existing paths and passed with typecheck, lint, and format checks; jsdom cannot render pseudo-class computed styles, so browser focus visibility remains Task 5 verification.
- 2026-08-10: Task 3 Fix Round 3 added `@testing-library/user-event` for actual JSDOM tab traversal. The focused test tabs to Button then TextField, derives each active element’s rendered data-slot selector, and verifies its matching production CSSOM focus-visible outline. Full frontend tests, typecheck, lint, format, and build passed; the runtime closure is 274,893 gzip bytes, one byte below the prior measurement and 25,107 bytes below budget.
- 2026-08-10: Task 4 replaced the retired index placeholder with a lazy, index-owned home workbench. Its loader starts the essential workspace and optional deals preloads together, awaits only the workspace descriptor for SSR retention, passes the request abort signal to both, and degrades workspace failure to search/catalog recovery while an optional deals failure stays local with a retry action. The route keeps URL-normalized comparison continuity, catalog/category entry, a capped six-row semantic product ledger with progressive disclosure, and typed plain-language New/Trending/For you deal copy. RED first failed on the absent home modules; GREEN focused tests (110 files, 1,545 tests), Relay validation, TypeScript, full frontend units, lint, and format all passed. The Node 25.6.0 versus requested 24.18.1 engine warning remains environmental.
