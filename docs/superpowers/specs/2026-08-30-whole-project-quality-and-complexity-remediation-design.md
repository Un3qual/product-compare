# Whole-Project Quality And Complexity Remediation Design

## Status

Approved on 2026-08-30 and implemented through the six completed work lanes
linked from docs/work/index.md.

## Problem

The repository already had broad static, unit, build, and bundle coverage, but
the audit found a smaller set of correctness defects and avoidable machinery at
runtime configuration, database, ingestion, operator, frontend, and tooling
boundaries. The remediation had to preserve real domain and data-integrity
contracts rather than optimize for line count alone.

## Principles

- Validate once at genuine external or persistence boundaries.
- Keep PostgreSQL authoritative for constraints and concurrency.
- Prefer Ecto and Relay contracts over parallel handwritten logic.
- Keep state with the component or process that owns the behavior.
- Retain native PostgreSQL only where Ecto does not model the capability or
  where one atomic statement protects an invariant.
- Do not add generic frameworks, speculative extension points, or tests that
  merely mirror implementation details.

## Outcomes

### Runtime and database trust boundaries

- Same-origin checks derive authority from configured endpoint values, not the
  request Host header.
- Production requires valid host and public-origin configuration. Session
  cookies remain host-only unless deployment configures an explicit domain.
- One finite-decimal Ecto type turns special Decimal values into cast errors.
  PostgreSQL remains the final authority for finite and non-negative commerce
  constraints.
- Cast foreign keys map database failures through changesets without race-prone
  existence preflights. GraphQL changeset field names follow camelCase.

### Ingestion concurrency and observation ordering

- Merchant identity resolution serializes the dependent read/write decision by
  source and merchant identifier in one transaction.
- Media and category conflict updates prevent older observations from replacing
  newer facts.
- CJ successful responses validate result-list and pagination shapes before
  enumeration or arithmetic and return one bounded error without provider data.

### Operator command safety and diagnostics

- Strict CLI parsing and range checks run before repository or application
  startup.
- Repository-only tasks do not start the full supervision tree.
- CJ failures expose stable categories and source locations without exception
  arguments, provider bodies, credentials, or nested reasons.

### Frontend correctness and simplification

- Product-detail partial recovery is limited to the optional offers region.
- Relay pagination fragments own connection accumulation for community,
  comparison picker, and snapshot flows.
- Affiliate mutation state lives in the submitting step; the route keeps only
  shared coordination state.
- The shared select is single-select, and preload descriptors retain generated
  request identity and variables without serialized GraphQL text.
- Generated Relay and useful boundary types remain; no generic hook was added
  merely to deduplicate mutation code.

### Deterministic tooling and dependency health

- The strict TypeScript project covers authored E2E source directly.
- mix setup uses the frozen pnpm lock, and Phoenix starts Vite through its
  standard watcher contract.
- Scheduler and database-concurrency tests use controlled messages or bounded
  polling rather than timing guesses.
- mise and package metadata agree on exact Node and pnpm pins; compatible
  security updates were applied without major-version churn.

### Ecto query ownership and native SQL boundaries

- Ordinary filtering, typing, coalescing, ordering, aggregation, existence
  checks, and updates use Ecto expressions.
- Report classification happens in small Elixir functions after set-based
  aggregate queries.
- Native SQL remains only for PostgreSQL features such as advisory/table locks,
  isolation control, full-text/trigram operations, and atomic EXCLUDED
  expressions that Ecto cannot express more clearly.

## Non-Goals

- No line-count-only file splits or abstraction layers.
- No weakening of authorization, Relay fragment masking, generated contracts,
  URL validation, row locking, or database authority.
- No destructive database cleanup, service-dependent browser tests in
  deterministic CI, unrelated product changes, or broad major upgrades.

## Verification

Each work-lane document records focused evidence and milestone commits. The
complete isolated mix ci, frontend build and bundle gates, advisory scans,
frozen install, and Playwright suite passed at the original closeout. Later
simplification passes must rerun affected tests and the complete repository
gate before publication.
