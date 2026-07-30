# Approved Maintainability Modernization Implementation Plan

**Goal:** Execute the approved frontend toolchain, Relay operation ownership, and
domain-naming improvements without replacing StyleX or changing product
behavior.

**Architecture:** The frontend keeps Vite, React, Relay, Radix, and StyleX while
pnpm replaces Bun, mise replaces the split local tool-version setup, Rolldown
backs production bundling, and Oxc supplies fast static checks that do not
conflict with StyleX's required Babel transform. Relay operations live beside
their single consumers instead of in one-export files. Backend modules are
named for the domain responsibility they own rather than the persistence verbs
they happen to perform.

**Tech Stack:** mise, pnpm, Node.js, Vite, Rolldown, Oxc, React 19, Relay 20,
StyleX, Radix UI, TypeScript, Elixir, ExUnit, Vitest.

## Global Constraints

- Preserve StyleX and its Babel plugin; this program does not replace the
  styling system.
- Bun is removed from executable scripts, lockfiles, CI, documentation gates,
  and runtime assumptions.
- Use pnpm's lockfile and strict dependency graph as the only frontend package
  installation contract.
- Keep Vite as the development and build interface; adopt Rolldown through the
  supported Vite-compatible package rather than a parallel build system.
- Use Oxc only where its current supported behavior is compatible with Relay
  and StyleX. Keep the StyleX Babel transform and TypeScript semantic
  typechecking.
- Do not create dynamic Relay-operation registries or a new abstraction around
  `graphql`; colocate single-consumer documents and retain shared documents
  only when they have multiple real consumers.
- Rename modules for a stable domain responsibility, not for generic technical
  layers such as `Crud`, `Manager`, `Helper`, or `Utils`.
- Preserve GraphQL auth, Relay artifact generation, SSR, bundle budgets, and
  existing product behavior.
- Use focused RED/GREEN tests and commit each task as a reviewable milestone.

### Task 1: pnpm, mise, Rolldown, and Oxc Toolchain

**Files:**
- Create: `.mise.toml`
- Create: `assets/pnpm-lock.yaml`
- Modify: `assets/package.json`
- Modify: `assets/vite.config.ts`
- Modify: `assets/stylex-plugin.ts` only if the supported Rolldown integration
  requires it
- Modify: root Mix aliases, CI files, scripts, README, and active work docs that
  execute Bun
- Delete: `assets/bun.lock`
- Delete: `assets/bunfig.toml`
- Delete: `flake.nix`
- Delete: `flake.lock`
- Test: existing frontend unit, Relay, SSR build, and bundle gates.

**Interfaces:**
- Consumes: the existing Vite/StyleX build and the approved decision to replace
  Bun and split dependency managers.
- Produces: one mise-controlled local runtime contract and one pnpm-controlled
  frontend dependency/build contract.

- [x] Inventory every executable Bun, Nix, asdf, and frontend tool-version
  reference; distinguish historical prose from active commands.
- [x] Add a failing repository contract test that rejects active Bun commands,
  Bun lockfiles, and missing mise/pnpm metadata.
- [x] Pin the repository's actual Erlang, Elixir, Node.js, pnpm, and PostgreSQL
  requirements in mise without inventing version drift.
- [x] Generate the pnpm lockfile, rewrite package scripts and active repository
  gates, and remove Bun/Nix ownership.
- [x] Adopt the supported Rolldown-backed Vite package and Oxc lint/format
  checks while retaining the StyleX Babel transform.
- [x] Run pnpm install with a frozen lockfile, Relay validation, typecheck,
  unit tests, client/SSR production builds, bundle checks, backend integration
  gates, and `git diff --check`.
- [x] Commit with `build: adopt pnpm mise and rolldown tooling`.

### Task 2: Colocate Single-Consumer Relay Operations

**Files:**
- Modify: route, component, loader, and action owners under
  `assets/src/routes/**`
- Delete: single-export mutation modules under
  `assets/src/routes/**/{mutations,queries}/**`
- Modify: affected tests and generated Relay artifacts.

**Interfaces:**
- Consumes: the current one-export GraphQL mutation files and their actual
  import graph.
- Produces: operations colocated with their sole execution owner, while
  genuinely shared queries/fragments retain dedicated modules.

- [ ] Build an import-graph inventory of every authored Relay operation and
  classify zero-, one-, and multi-consumer documents.
- [ ] Add focused dependency-boundary tests that fail for single-consumer
  mutation-only modules but permit shared documents.
- [ ] Move each single-consumer mutation literal into its route/component/action
  owner and delete the empty operation module; do not merge unrelated route
  logic.
- [ ] Keep generated artifacts generated, update imports and tests, and verify
  Relay compiler stability.
- [ ] Run Relay validation, TypeScript, focused route tests, the full frontend
  unit suite, both production builds, bundle checks, and `git diff --check`.
- [ ] Commit with `refactor: colocate relay mutations with owners`.

### Task 3: Rename Persistence-Verb Domain Owners

**Files:**
- Move: `lib/product_compare/discussions/crud.ex` to a domain-responsibility
  name selected from its actual behavior.
- Modify: `lib/product_compare/discussions.ex`
- Move: `test/product_compare/discussions/thread_crud_test.exs` to the matching
  behavior-oriented test name.
- Modify: affected documentation references.

**Interfaces:**
- Consumes: the sole live `Crud`-named module and test.
- Produces: a discussions owner named for content lifecycle behavior with the
  public `ProductCompare.Discussions` facade unchanged.

- [ ] Characterize the module's actual responsibility and prove the current
  facade behavior with its focused suite.
- [ ] Rename the module and test to the narrow domain responsibility; do not add
  delegates, compatibility aliases, or a generic service layer.
- [ ] Remove active `Crud` naming from source and tests while preserving
  historical prose that is not an executable contract.
- [ ] Run discussions context and GraphQL suites, type checks, the full backend
  suite, and `git diff --check`.
- [ ] Commit with `refactor: name discussion content ownership`.

## Final Program Verification

- [ ] Run the repository frontend and backend CI gates from a clean dependency
  install.
- [ ] Confirm no active Bun command, lockfile, or runtime dependency remains.
- [ ] Confirm StyleX output and bundle budgets remain intact.
- [ ] Confirm authored single-consumer mutation-only files and active `Crud`
  source/test names are absent.
- [ ] Record exact verification evidence in the relevant lane docs.
