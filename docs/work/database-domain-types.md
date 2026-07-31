# Database Domain Types Work Doc

## Snapshot

- Status: complete
- Priority: P1
- Source of truth: `docs/superpowers/plans/2026-07-30-database-domain-types-implementation-plan.md`
- Last verified: 2026-07-31 against a clean test-database rebuild, reference
  codec/database parity, table-driven affiliate networks, and slug/reputation
  migration contracts.

## Target Outcome

Every first-party categorical database value is stored as a native PostgreSQL
enum, a foreign key to controlled reference data, or is removed because it is
redundant. Application-owned comparison and alert facts are normalized out of
JSON, while provider-owned raw evidence remains verbatim and is never used as
normalized domain state.

## Completed Batches

- Native PostgreSQL enum storage for the 28 approved closed-domain columns.
- Physical storage is verified through `information_schema`, not inferred from
  `Ecto.Enum`.
- Existing lifecycle, transaction, GraphQL, and query behavior remains covered
  by the focused context suites.
- Currency codes and affiliate-program statuses are controlled reference rows.
  Affiliate networks are open table-backed identities whose normalized string
  codes resolve through the database rather than a closed application list.
- Seven operational currency owners, affiliate programs, and conversions store
  numeric foreign keys while Ecto and GraphQL continue to expose stable codes.
- Commerce links derive network identity through their required affiliate
  program instead of storing a second value that can drift.
- Existing affiliate-network upserts avoid a no-op `updated_at` write, removing
  the row lock that reproduced a cross-fixture deadlock at seed `284640`.
- Source kinds, integration providers, provider-scoped surfaces and feed types,
  countries, and languages are controlled reference rows with stable codes.
- Sources own provider identity; ingestion runs and feed candidates no longer
  duplicate provider strings, and all provider-sensitive reads join through
  the locked source row.
- Candidate country, currency, language, and feed type values are numeric
  foreign keys. Unknown provider-owned values remain only in raw evidence and
  never become invented controlled rows.
- CJ source resolution and provider claiming use conflict-safe insert/fetch and
  a conditional `UPDATE ... WHERE provider_id IS NULL` claim rather than an
  unconditional source-row mutex.
- Reputation events reference controlled event-type rows and no longer carry a
  free-form reason or polymorphic table-name/id pair. No subject column was
  invented because the repository has no concrete reputation event producer.
- Derived formulas, alert delivery attempts, and question threads no longer
  store unused or single-value categorical columns.
- Community idempotency receipts use their native PostgreSQL `content_type`
  enum in the unique identity instead of duplicating it in a string
  `mutation_kind`.
- Unreleased feed-review migrations were removed, and CJ lifecycle storage is
  created directly in its final native-enum and foreign-key shape.
- Immutable comparison snapshots use ordered relational rows for copied
  products, attributes, evidence, offers, recommendations, and rankings.
  Recommendation profile/status and offer freshness are native PostgreSQL
  enums; source kind, currency, and recommendation algorithm use controlled
  references.
- Snapshot hydration uses bounded association preloads and retains the public
  GraphQL payload projection without a persisted JSON payload or decoder.
- Alert events copy baseline, target, and percentage facts into typed decimal
  columns rather than an application-owned JSON map.
- Stable lookup-code maps live with the schemas that persist each foreign key.
  Read models join lookup tables directly for labels, so the application does
  not carry passive one-table Ecto modules or duplicate code-normalization
  implementations.

## Simplification Reconciliation

- A self-checking parity matrix now discovers every production
  `ReferenceCode` field and compares each deterministic codec directly with its
  seeded database rows, including comparison-snapshot evidence source kinds.
- Affiliate network filters and conversion ingestion accept normalized string
  codes only when a matching `affiliate_networks` row exists; no atom
  conversion or closed provider vocabulary remains.
- Unused reputation event add/list behavior and the event-type default delta
  are removed. The relational event/type foundation remains for a future real
  producer.
- Slug reservations no longer persist the unused `is_alias` discriminator.
  Namespace uniqueness, canonical rotation, historical alias immutability, and
  deletion cleanup remain trigger-protected.
- The categorical storage oracle now lives only in `test/support` as
  `ProductCompare.TestSupport.CategoricalStoragePolicy`; production carries no
  test-policy module.

## Active Batch

- None. The database-domain program is complete.

## Dependent Successors

- Application JSON storage policy and operator mutation authorization
  freshness remain ready successors. The frontend and GraphQL simplification
  outcomes are reconciled in their lane docs.

## Historical Lane-Delivery Verification

The counts in this section preserve the evidence recorded as each database-
domain batch landed; later full-suite totals do not replace them.

- Baseline repair commit: `506fff4f test: stabilize catalog filter index contract`
- `mix test test/product_compare/catalog/filtering_regression_test.exs`:
  8 tests, 0 failures.
- `MIX_ENV=test mix ecto.reset`: all migrations applied through
  `20260727121000`.
- `mix test test/product_compare/repo/domain_enum_storage_test.exs`: 1 test,
  0 failures.
- Focused enum-owning context suites: 438 tests, 0 failures.
- `mix test`: 978 tests, 0 failures.
- `mix typecheck`, `mix format --check-formatted`, `mix work_queue.validate`,
  and `git diff --check`: passed.
- `mix test test/product_compare/repo/domain_reference_storage_test.exs`:
  3 tests, 0 failures.
- Focused commerce-reference context and GraphQL suites: 277 tests, 0 failures.
- `mix test --seed 284640`: 982 tests, 0 failures.
- `mix typecheck`: passed.
- `MIX_ENV=test mix ecto.reset`: all rewritten source/provider migrations
  applied through `20260727121000`.
- `mix test test/product_compare/repo/ingestion_reference_storage_test.exs
  test/product_compare/ingestion`: 162 tests, 0 failures.
- Focused CJ ingestion Mix-task suites: 68 tests, 0 failures.
- `mix test test/product_compare/repo/migrations/add_cj_program_lifecycle_test.exs`:
  7 tests, 0 failures.
- `mix test`: 984 tests, 0 failures.
- `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate`, and `git diff --check`: passed.
- `MIX_ENV=test mix ecto.reset`: rewritten migration history applied through
  `20260727121000` without creating the transient feed-review columns.
- Discriminator storage, direct CJ migration, discussions, thread CRUD, and
  alert suites: 42 tests, 0 failures.
- Affected community, alert, and dataloader GraphQL suites: 59 tests,
  0 failures.
- `mix test`: 981 tests, 0 failures.
- `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate` (3 ready rows), and `git diff --check`: passed.
- `MIX_ENV=test mix ecto.reset`: normalized snapshot and alert migrations
  applied through `20260727121000`.
- Snapshot/alert storage, enum storage, comparison snapshots, alerts, SEO, and
  affected GraphQL/query-budget suites: 80 tests, 0 failures.
- `mix test`: 982 tests, 0 failures.
- Final `MIX_ENV=test mix ecto.reset`: all rewritten migrations applied
  through `20260727121000`.
- `mix test test/product_compare/repo`: 19 storage and migration contract
  tests, 0 failures. The suite covers native enum physical types, controlled
  references, removed discriminators, and absence of application-owned
  snapshot/alert categorical JSON.
- Final `mix ci`: 982 backend tests, 0 failures, 84.44% coverage; 1,507
  frontend tests, 0 failures; Credo, ExDNA at the intentional 3/3 baseline,
  strict Reach smell analysis, Dialyzer with zero findings, Relay validation,
  TypeScript, client/SSR builds, and the client bundle budget all passed.
- `mix work_queue.validate`: 3 ready rows remain.
- `mix format --check-formatted` and `git diff --check`: passed.

## 2026-07-31 Simplification Verification

- `MIX_ENV=test mix ecto.reset`: completed successfully from an empty test
  database through the complete rewritten migration history.
- Reference-code parity, table-driven affiliate networks, reputation and slug
  cleanup, and the moved test-support categorical policy passed their two
  focused commands: 83 tests, 0 failures.
- The broader repo, commerce, slug, SEO, GraphQL, and redirect command passed
  120 tests, 0 failures.
- The final Task 6 branch backend suite passed 1,050 tests, 0 failures.
- `mix typecheck` passed. `mix quality` exited successfully; its two existing
  test-code findings are recorded in the Task 6 report.
- `mix work_queue.validate` passed with 3 ready rows; formatting and diff checks
  passed.

## Blocker Rule

Stop and record a blocker if a provider-owned raw field is required for
application filtering, if a proposed reference code cannot be mapped without
inventing data, or if a migration would require compatibility dual writes.
