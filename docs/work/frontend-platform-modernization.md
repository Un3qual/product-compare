# Frontend Platform Modernization

## Snapshot

- Status: completed
- Priority: P1
- Source of truth:
  `docs/superpowers/plans/2026-07-30-approved-maintainability-modernization-implementation-plan.md`
- Last verified: 2026-07-31 against the simplified pnpm scripts, dependency
  graph, Vite configuration, authored-source Oxc gates, and bundle contract.

## Target Outcome

mise owns repository runtime versions, pnpm owns frontend dependencies, Vite
builds through Rolldown, Oxc supplies compatible fast static checks, StyleX
retains its Babel transform, and no active Bun or Nix dependency contract
remains.

## Original Baseline

- The frontend already uses Vite for development, client builds, SSR builds,
  and Vitest.
- StyleX is compiled through the project-local Babel-backed Vite plugin and
  remains in scope unchanged.
- Before modernization, `assets/package.json`, `assets/bun.lock`,
  `assets/bunfig.toml`, and the root Mix frontend gate executed Bun. Those
  active contracts were removed by the completed migration.
- Root `flake.nix` and `flake.lock` own a Nix shell while ambient installations
  supply tools outside it; there is no existing `.tool-versions` contract.
- Relay validation, TypeScript, 1,507 unit tests, client/SSR production builds,
  and the former JavaScript-only bundle budget were green before migration.

## Boundaries

- Keep StyleX and its Babel plugin.
- Keep Vite as the command and plugin interface.
- Use the supported Rolldown-backed Vite distribution, not a second build
  pipeline.
- Retain TypeScript semantic typechecking; Oxc supplements compatible static
  checks.
- Remove active Bun/Nix commands and metadata, but do not rewrite historical
  evidence solely to erase the words.

## Delivered

- `.mise.toml` pins Erlang 28.3, Elixir 1.19.4, Node 24.18.1, and pnpm 11.18.0;
  unrelated inherited Ruby tool versions are disabled. Docker Compose, not
  mise, owns the PostgreSQL runtime.
- pnpm owns the dependency graph and lockfile; Bun and Nix metadata and active
  commands are removed.
- Vite 8 builds through Rolldown. The supported Rolldown Babel bridge preserves
  Relay and StyleX transforms.
- Oxlint and Oxfmt now cover authored `src`, `test`, Playwright `tests`,
  `scripts`, and root TypeScript while excluding generated Relay artifacts.
- The bundle audit accepts Rolldown's anonymous shared lazy-loader chunks while
  still requiring them to be reachable only through the entry's dynamic import
  graph. It deduplicates the complete initial JavaScript/CSS static closure
  against a 300,000-byte gzip ceiling.
- Vite and Vitest use direct flat plugin arrays. The inert pnpm workspace file
  is removed; explicit StyleX TypeScript imports retain supported native-config
  loading.
- Primary Relay queries and related mutations now live in six PascalCase
  workflow modules, and source-regex ownership tests are removed in favor of
  route and mutation behavior.
- The Relay transport is direct `async`/`await`; no Effect dependency or
  adapter remains.

## Verification

- The platform-modernization frozen pnpm install and toolchain contract passed.
- The final workflow-focused frontend set passed 11 files / 261 tests; Relay
  validation compiled 52 reader, 51 normalization, and 51 operation documents.
- `pnpm run check` passed after authored-source lint/format expansion, flat
  plugin configuration, family operation ownership, and the combined initial
  JavaScript/CSS bundle update.
- Final repository gate evidence is recorded by the 2026-07-31 platform
  simplification task.

## Blocker Rule

Stop and record a blocker if the supported Rolldown/Vite or Oxc versions cannot
run the existing Relay and StyleX transforms without changing product styling
or weakening TypeScript checks.
