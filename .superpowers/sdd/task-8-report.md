# Task 8 Report: Destination URL Boundary And Whole-Project Gates

## Outcome

Task 8 is implemented as the final semantic milestone on
`codex/project-quality-audit`. The destination URL policy now has a pure
boundary, the project gates cover both application stacks, all final analyzers
are pristine, and the live dispatcher retains four ready rows after removal of
the completed audit row.

## Implementation

- Added `ProductCompare.CommerceAttribution.DestinationUrl.valid?/1` as the
  owner of the existing URL, authority, numeric IPv4, IPv6, IDNA, and punycode
  policy. `CommerceLink.valid_destination_url?/1` delegates to it.
- Removed unreachable internal clauses and the eager indexed IPv4 conversion;
  the replacement carries the base-256 exponent directly in the reduction.
- Removed the approved Task-3-introduced unreachable `put_attr/3` catch-all.
- Strengthened the two connection page-size tests to assert the exact returned
  node sequences.
- Expanded frontend `check` to run Relay validation, typecheck, all unit tests,
  client build, SSR build, and the bundle contract. Playwright remains separate.
- Added root `frontend_check` and placed it last in both `mix ci` and
  `mix precommit`; `mix cmd --cd assets bun run check` preserves the root
  working directory and propagates frontend failures.
- Added Bun to the Nix shell and documented root/frontend gates in README.
- Marked the project-quality lane done and removed only its active dispatcher
  section. Queue validation confirms all four ready rows remain.

## Characterization And TDD Evidence

- Pre-extraction characterization:
  `mix test test/product_compare/commerce_attribution/commerce_attribution_test.exs:120`
  passed 8 tests with 0 failures.
- Destination boundary RED: the new focused test failed with
  `DestinationUrl.valid?/1 is undefined`.
- Destination boundary GREEN: the focused boundary plus original adversarial
  suite passed 9 tests with 0 failures after extraction.
- Cursor-helper RED: two tests failed because
  `OptionNormalization.next_cursor/2` was undefined.
- Cursor-helper GREEN: pure helper plus both scheduler suites passed 21 tests
  with 0 failures.
- The existing explicit-brandless GraphQL regression passed after the approved
  fixture double-lookup cleanup.

## Pre-Change Command Graph Evidence

- Frontend `check` was only
  `bun run typecheck && bun run test:unit`; the inspection command exited 1 and
  reported missing `relay:check` and `build`.
- Root `ci` and `precommit` contained only backend tasks and no frontend gate.
  The attempted live alias inspection was also blocked by the sandbox's Mix
  PubSub socket restriction; subsequent required Mix commands ran with the
  approved execution permission.

## Approved Minimal Scope Expansions

- `lib/product_compare/commerce_attribution.ex`: removed only the unreachable
  map fallback introduced in Task 3; map-call semantics are unchanged.
- The first final ExDNA run found 7 clones against the 6-clone budget because
  both CJ schedulers contained the same cursor transition. With coordinator
  approval, `OptionNormalization.next_cursor/2` now owns only the shared
  nil/non-negative/unchanged value invariant. Scheduler reports and side
  effects remain separate; no generic scheduler abstraction was introduced.
- Combined CI then exposed Task 1's `Map.has_key?` plus `Map.fetch!` fixture
  lookup. With exact approval, one `Map.fetch/2` case preserves explicit nil
  and creates a default brand only when the key is absent. No analyzer was
  reordered, isolated, suppressed, or baselined.

## Final Verification

- `cd assets && bun run check`: 48 files / 718 tests passed; Relay validation,
  typecheck, client build, SSR build, and bundle contract passed. Initial client
  closure: 591,583 raw / 180,879 gzip bytes, within the 200,000-byte budget.
- `mix ci`: passed with 666 backend tests, 0 failures, 84.09% coverage, followed
  by the complete 718-test frontend/build gate.
- `mix dialyzer`: passed with no unsuppressed warnings.
- `mix reach.check --smells --strict --baseline .reach-baseline.json`: no issues;
  31 existing baseline findings suppressed.
- `mix ex_dna --max-clones 6`: passed at 6/6 near-miss clone groups.
- Focused connection tests: 11 focused tests passed alongside the URL boundary
  coverage; Credo analyzed 226 files and found no issues.
- Final format check, queue validator, diff check, and clean post-commit status
  are recorded by the milestone handoff.

## Self-Review

- URL acceptance/rejection logic was moved without standards-library or policy
  changes. The compatibility API and changeset error contract are intact.
- `DestinationUrl` exposes only `valid?/1`; schema concerns remain in
  `CommerceLink`.
- Both root aliases place frontend verification after backend verification, and
  their command runs from `assets` with normal non-zero exit propagation.
- The queue edit removes only the completed active project-quality section; no
  ready-row content changed.
- The one full-suite query-plan assertion selected a different valid index on
  one run, passed immediately in isolation without source changes, and the
  unchanged final `mix ci` run passed. No assertion was weakened.

## Concerns

No remaining Task 8 correctness or analyzer concern. The Vite build continues
to emit its existing advisory for a greater-than-500 KB chunk, while the
approved gzip bundle contract passes with about 9.6% headroom.
