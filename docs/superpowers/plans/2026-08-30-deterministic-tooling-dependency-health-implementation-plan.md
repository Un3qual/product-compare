# Deterministic Tooling And Dependency Health Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make supported frontend source, local setup, scheduler/concurrency tests, toolchain pins, and production dependencies accurately covered by deterministic project gates.

**Architecture:** One strict TypeScript project covers authored unit and E2E code, Phoenix owns the canonical two-process development startup, and focused test helpers provide bounded diagnostics without busy spinning. Dependency locks move only within compatible lines to fixed releases and remain subordinate to the full project gate.

**Tech Stack:** Mix/Phoenix, ExUnit, TypeScript, Playwright, Vite, mise, pnpm, Hex

**Spec:** `docs/superpowers/specs/2026-08-30-whole-project-quality-and-complexity-remediation-design.md`

## Global Constraints

- Keep Playwright execution outside deterministic `mix ci`; TypeScript still checks E2E source.
- `mix setup` installs frontend packages with the frozen lockfile.
- `mix phx.server` is the canonical development command and owns Vite watcher lifecycle.
- Fix the scheduler test race without changing production scheduling semantics.
- Polling helpers use bounded backoff and actionable failure messages; they do not replace deterministic barriers where barriers are available.
- Update dependencies within current compatible lines only and avoid unrelated lockfile churn.
- Final backend verification uses a unique `MIX_TEST_PARTITION`; never reset the contaminated shared database.

---

### Task 1: Include Playwright source in the strict TypeScript project

**Files:**

- Modify: `assets/tsconfig.json`
- Modify only files that fail once included: `assets/tests/e2e/**/*.ts`
- Modify only if library globals require it: `assets/package.json`
- Create: `assets/test/tooling/e2e-type-coverage.test.ts`

**Interfaces:**

- `pnpm run typecheck` checks `src`, `test`, `tests/e2e`, scripts, and frontend configuration under the same strict compiler options.
- Playwright and Node types are available only through installed declarations; no ambient `any` shim or permissive secondary tsconfig is introduced.

- [ ] **Step 1: Add `tests/e2e` to the project and run RED**

  ```bash
  cd assets && pnpm run typecheck
  ```

  Record every newly exposed diagnostic and classify it as a real test-source error or missing installed environment type.

- [ ] **Step 2: Add a structural coverage assertion**

  Prove the main `tsconfig.json` includes `tests` so future E2E files cannot silently leave the gate.

- [ ] **Step 3: Fix the diagnostics with inference and library types**

  Prefer inferred fixtures and Playwright's exported types. Do not introduce local aliases that merely restate those APIs.

- [ ] **Step 4: Run GREEN**

  ```bash
  cd assets && pnpm run typecheck && pnpm run lint && pnpm run format:check
  ```

---

### Task 2: Make setup and development startup complete

**Files:**

- Modify: `mix.exs`
- Modify: `config/dev.exs`
- Modify: `README.md`
- Modify: `test/product_compare/toolchain_contract_test.exs`

**Interfaces:**

- `mix setup` runs backend dependency/database/seed setup and `pnpm install --frozen-lockfile` in `assets`.
- Development endpoint watchers launch `pnpm run dev -- --host 127.0.0.1` from `assets` and terminate with the Phoenix endpoint.
- README documents `mix setup` then `mix phx.server` as the complete local path, including Phoenix and Vite URLs.

- [ ] **Step 1: Extend the toolchain contract RED assertions**

  Assert the setup alias contains the frozen frontend install, the development endpoint has the pnpm watcher, and README no longer requires an undocumented second manual server.

- [ ] **Step 2: Run RED**

  ```bash
  mix test test/product_compare/toolchain_contract_test.exs
  ```

- [ ] **Step 3: Add the smallest setup alias and watcher configuration**

  Use Mix's `cmd --cd assets` alias form and Phoenix's watcher tuple. Do not add a custom process manager or shell script.

- [ ] **Step 4: Run GREEN and a bounded startup smoke check**

  ```bash
  mix test test/product_compare/toolchain_contract_test.exs
  ```

  Start `mix phx.server` on isolated Phoenix/Vite ports, wait for both health responses, and terminate the parent process; do not leave background services running.

---

### Task 3: Remove scheduler log races and database busy polling

**Files:**

- Modify: `test/product_compare/ingestion/cj_product_import_scheduler_test.exs`
- Modify only if explicit tick control is the simpler stable seam: `lib/product_compare/ingestion/cj_product_import_scheduler.ex`
- Modify: `test/support/database_test_helpers.ex`
- Modify: `test/product_compare/database_test_helpers_test.exs`

**Interfaces:**

- The scheduler failure-log test establishes capture before the first dispatch or sends the first dispatch under controlled scheduling.
- Production scheduler defaults and immediate-delay behavior do not change.
- One private bounded polling helper applies a short backoff and reports the expected database state plus relevant backend ids at timeout.

- [ ] **Step 1: Reproduce the scheduler warning outside capture**

  Stress the focused test enough to demonstrate the current zero-delay ordering hazard, then rewrite the test boundary so capture encloses process start/dispatch. Do not add arbitrary sleep.

- [ ] **Step 2: Add polling-helper unit characterization**

  Cover immediate success, eventual success after multiple probes, and timeout diagnostics through an injectable clock/probe seam if needed. Keep the seam test-only/private.

- [ ] **Step 3: Implement the minimal test-only synchronization/backoff changes**

  Replace recursive no-delay query loops with the shared helper. Preserve each public assertion helper's return and failure contract.

- [ ] **Step 4: Run focused tests repeatedly**

  ```bash
  for run in 1 2 3 4 5; do
    MIX_TEST_PARTITION=quality_tooling mix test \
      test/product_compare/ingestion/cj_product_import_scheduler_test.exs \
      test/product_compare/database_test_helpers_test.exs || exit 1
  done
  ```

---

### Task 4: Compare actual mise and frontend pins

**Files:**

- Modify: `test/product_compare/toolchain_contract_test.exs`
- Read without changing unless an actual mismatch is found: `.mise.toml`
- Read without changing unless an actual mismatch is found: `assets/package.json`

**Interfaces:**

- The test parses exact Node and pnpm values from `.mise.toml` and compares them with `package.json` engines and `packageManager`.
- Erlang/Elixir presence and retired Bun/Nix/PostgreSQL ownership checks remain intact.

- [ ] **Step 1: Replace presence-only Node/pnpm assertions with equality assertions**

  Parse the narrow TOML assignments with named regular-expression captures or an already-installed parser. Do not add a dependency solely to read four simple keys.

- [ ] **Step 2: Prove a mismatched fixture fails clearly**

  Extract only enough pure parsing/comparison behavior for a focused mismatch assertion if the current file-level test cannot inject fixture text cleanly.

- [ ] **Step 3: Run GREEN**

  ```bash
  mix test test/product_compare/toolchain_contract_test.exs
  ```

---

### Task 5: Refresh vulnerable compatible dependencies

**Files:**

- Modify: `mix.exs`
- Modify: `mix.lock`
- Modify only when needed for a fixed transitive resolution: `assets/package.json`
- Modify: `assets/pnpm-lock.yaml`

**Interfaces:**

- Direct Hex constraints retain their current major-compatible API lines and set security floors only where the broad existing requirement permits a vulnerable release.
- The frontend resolves `nanoid` at a fixed version through the smallest compatible parent update or a documented pnpm override.
- `mix hex.audit` and `pnpm audit --prod` have no applicable unresolved advisory, except an exact documented no-compatible-fix blocker.

- [ ] **Step 1: Refresh live advisory and outdated evidence**

  ```bash
  mix hex.audit
  mix hex.outdated
  cd assets && pnpm audit --prod
  cd assets && pnpm outdated
  ```

- [ ] **Step 2: Update only affected compatible packages**

  Use targeted `mix deps.update <names>` and `pnpm update <parent>@<compatible>` commands. Review every lockfile delta and revert unrelated package movement by using narrower updates, not by hand-editing lockfile internals.

- [ ] **Step 3: Run dependency-focused compile and frontend checks**

  ```bash
  MIX_ENV=test mix compile --warnings-as-errors --all-warnings
  cd assets && pnpm run relay:check && pnpm run typecheck && pnpm run test:unit
  ```

- [ ] **Step 4: Run complete outcome and advisory verification**

  ```bash
  MIX_TEST_PARTITION=quality_tooling mix ci
  mix hex.audit
  cd assets && pnpm audit --prod
  cd assets && PLAYWRIGHT_PORT=4194 pnpm run test:e2e
  git diff --check
  ```

- [ ] **Step 5: Commit the reviewed outcome**

  ```bash
  git add .mise.toml README.md assets/package.json assets/pnpm-lock.yaml \
    assets/tsconfig.json assets/tests assets/test config/dev.exs lib mix.exs mix.lock test \
    docs/work/deterministic-tooling-dependency-health.md docs/work/index.md
  git commit -m "chore: harden tooling and dependency health"
  ```
