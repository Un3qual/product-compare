# Deterministic Tooling And Dependency Health

## Snapshot

- Status: active
- Priority: P2
- Plan: `docs/superpowers/plans/2026-08-30-deterministic-tooling-dependency-health-implementation-plan.md`
- Design: `docs/superpowers/specs/2026-08-30-whole-project-quality-and-complexity-remediation-design.md`

## Target Outcome

Strict frontend type coverage includes E2E source, one Phoenix command starts
the complete development stack, flaky test boundaries are deterministic,
toolchain pins are compared rather than merely present, and compatible locked
dependencies contain all available security fixes.

## Owned Paths

- `assets/tsconfig.json`
- `assets/tests/e2e/**`
- `assets/test/**` only for tooling/type coverage
- `assets/package.json`
- `assets/pnpm-lock.yaml`
- `mix.exs`
- `mix.lock`
- `config/dev.exs`
- `README.md`
- `.mise.toml` only if an actual mismatch is found
- `test/product_compare/ingestion/cj_product_import_scheduler_test.exs`
- `lib/product_compare/ingestion/cj_product_import_scheduler.ex` only if a controlled tick seam is necessary
- `test/support/database_test_helpers.ex`
- `test/product_compare/database_test_helpers_test.exs`
- `test/product_compare/toolchain_contract_test.exs`
- This lane document

## Internal Slices

1. E2E source in the strict TypeScript project.
2. Frozen setup and Phoenix-owned Vite watcher.
3. Scheduler capture and bounded database polling.
4. Exact mise/package pin comparison.
5. Compatible security dependency refresh.

## Blocker Rule

Stop if a security fix requires a major compatibility decision, if a package
has no fixed release in the accepted line, if local development needs an
environment-specific process choice not represented by current config, or if a
test can be deterministic only by changing production scheduling behavior.

## Completion Evidence

Pending implementation. Record TypeScript diagnostics removed, startup smoke
evidence, repeated focused tests, lockfile review, advisory results, full
isolated `mix ci`, Playwright, and the milestone commit here.
