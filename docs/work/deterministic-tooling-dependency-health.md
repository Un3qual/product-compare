# Deterministic Tooling And Dependency Health

## Snapshot

- Status: complete
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

- The strict TypeScript project includes `assets/tests/e2e`, and the existing
  E2E helpers were simplified enough to pass without a second relaxed type
  configuration (`79dc925c`).
- `mix setup` installs the frontend from the frozen pnpm lockfile. Phoenix owns
  the development Vite process through a supervised port wrapper, so one
  command starts both services and terminating Phoenix also terminates Vite;
  live startup/shutdown smoke checks left neither port listening (`e9dc2a0c`).
- Scheduler tests capture their controlled tick instead of sleeping, and
  database helpers use bounded retry polling instead of fixed timing guesses
  (`c1e607db`). Toolchain tests compare the exact mise, package-manager, and
  package pins instead of checking only for their presence (`ed7efef3`).
- Compatible security floors and locks were refreshed for Phoenix, Postgrex,
  Bandit, Absinthe, Absinthe Plug, Decimal, and nanoid without crossing a major
  compatibility boundary (`b5586bf9`). `mix hex.audit` reported no retired or
  advisory packages, and `pnpm audit --prod` reported no known vulnerabilities.
- `pnpm install --frozen-lockfile` completed with the committed lockfile already
  up to date under pnpm 11.18.0.
- Final isolated `mix ci` passed queue validation, formatting, Credo with zero
  issues, the 3/3 ExDNA clone budget, Reach with no issues, Dialyzer, 1,577
  backend tests with zero failures and 87.01% coverage, Relay validation,
  strict TypeScript, lint, frontend formatting, 1,501 unit tests in 111 files,
  client and SSR builds, StyleX mangling, and the client bundle budget (226,347
  gzip bytes against 300,000).
- The first Playwright run exposed two pre-existing harness defects: a visual
  test used the live clock, and an operator assertion disagreed with its own
  user-agent fixture. `d54dc65b` freezes the visual clock and preserves the
  fixture value exactly. The affected specs then passed 16 tests, and the full
  browser suite passed all 38 tests on isolated port 4194.
