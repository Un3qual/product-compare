# Production UI System Spine And Home

## Snapshot

- Status: complete
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
- Focused backend tests, the canonical complete `mix test` suite, `mix typecheck`, `mix quality`, and `mix format --check-formatted`.
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
- 2026-08-10: Task 5 completed the real-browser production gate and responsive remediation. Operation-name GraphQL fixtures now cover guest search/category entry, add/open/remove comparison, signed-in For you fallback and matched reasons, local deals failure/retry, keyboard focus, reduced motion, three zero-violation axe scans, plain-language checks, and exact no-overflow checks at 1440×1000, 900×1100, and 390×844. The final update and non-update Playwright runs each passed 9/9 on isolated `PLAYWRIGHT_PORT=4174`; port 4173 was held by an unrelated Vite process. Desktop and tablet expose all secondary facts directly and have zero visible disclosure controls. Mobile alone retains all six 44px disclosure controls; its four navigation controls also meet the 44px minimum. Desktop headings align to the six row columns within one pixel. Tablet has exactly two 415px columns plus a 16px gap filling the 846px workspace/list/article width with zero fill delta. Mobile shows only identity, offer, actions, and one disclosure source for secondary facts.
- 2026-08-10: Original-resolution visual inspection passed for `/Users/admin/.codex/worktrees/c7f1/backend/assets/tests/e2e/production-ui-home.spec.ts-snapshots/home-workbench-desktop-darwin.png` (1440×1663 full page from the 1440×1000 viewport), `home-workbench-tablet-darwin.png` (900×2040 from 900×1100), and `home-workbench-mobile-darwin.png` (390×2990 from 390×844). Search, categories, selection, and the ledger dominate; deals remain a smaller divider-based list. There are no clipped controls, duplicated mobile facts, redundant desktop/tablet disclosure rows, sticky-nav capture artifacts, marketing hero, generic card grid, weak comparison identity, or font fallback. Instrument Sans Variable and IBM Plex Mono both load explicitly. The six-column desktop ledger keeps an explicit 10rem actions track rather than stretching sparse facts across the viewport.
- 2026-08-10: Final gates passed: frontend Relay/type/lint/format, 110 test files and 1,547 tests, client/SSR build, 1,333,427 raw / 274,924 gzip bytes (25,076 bytes below the 300,000 budget, +31 bytes from 274,893 and +4,852 from the 270,072 pre-spine measurement); focused backend 29 tests; `mix typecheck`; `mix quality` (Credo clean, ExDNA 3/3, Reach clean, Dialyzer successful); `mix format --check-formatted`; `mix work_queue.validate`; and `git diff --check`. The first sandboxed frontend and Mix quality/queue attempts could not access Watchman state or local Mix PubSub sockets; the unchanged commands passed with normal local access. No isolated test database partition was needed. Remediation milestone `93948b2f` contains the responsive UI polish plus controller-authorized quality fixes; final Task 5 evidence awaits the coordinator-owned queue/successor-doc closeout.
- 2026-08-10: Coordinator closeout was applied and independently reviewed without worker edits to the shared documents. The live queue validates with four ready successor rows: Discover & Evaluate, Compare & Return, Account & Setup, and Operations. Task 5 browser evidence, deterministic snapshots, and this lane ledger ship with those unchanged coordinator documents in the required `test: verify production UI system and home` closeout milestone.
- 2026-08-10: Task 5 Fix Round 1 closed the production-gate review findings without changing application UI or visual baselines. The GraphQL harness now records unexpected operation names per page and an automatic `afterEach` assertion fails even when Relay swallows the returned HTTP 200 error. A deliberate missing-responder mutation failed with `Unhandled GraphQL operations: CompareProductPickerQuery`; restoring the responder returned the exact non-update browser run to 9/9. Search, category entry, add/open/remove comparison, mobile Explore/disclosure, and deals retry are reached through bounded Tab/Shift+Tab traversal, show a visible focus ring, and activate with Enter or Space. The guest search assertion now proves exact trimmed variables, including `query: "precision kettle"` and `sort: "RELEVANCE"`. The three-viewport plain-language scan now covers evidence, taxon, merchant product, source artifact, current attributes, qualification, recommendation profile, and persisted snapshot in addition to the transport/internal terms already checked.
- 2026-08-10: The previously missing canonical backend production gate passed unpartitioned against the Fix Round 1 working tree: `mix test` completed 1,392 tests with 0 failures in 152.3 seconds (seed 755425). `pnpm run check` also passed unchanged with 110 files / 1,547 tests and the same 274,924-byte gzip bundle; `mix typecheck`, `mix quality`, `mix format --check-formatted`, `mix work_queue.validate` (four ready rows), and `git diff --check` passed. The three Darwin snapshots remain byte-for-byte unchanged; Darwin-only baselines are a deferred, nonblocking portability risk rather than Linux coverage supplied by this task.
