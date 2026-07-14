# Durable Ingestion Job Foundation Implementation Plan

**Goal:** Make scheduled CJ work database-backed, unique, retryable, and
observable without changing provider parsing or import semantics.

**Design:**
`docs/superpowers/specs/2026-07-13-offer-truth-and-durable-ingestion-design.md`

**Owned paths:**

- `mix.exs`
- `mix.lock`
- `config/config.exs`
- `config/test.exs`
- `config/runtime.exs`
- `lib/product_compare/application.ex`
- `lib/product_compare/ingestion/jobs/**`
- `lib/product_compare/ingestion/cj_feed_discovery_scheduler.ex`
- `lib/product_compare/ingestion/cj_product_import_scheduler.ex`
- `priv/repo/migrations/*_add_oban_jobs.exs`
- `test/product_compare/ingestion/jobs/**`
- `test/product_compare/ingestion/cj_feed_discovery_scheduler_test.exs`
- `test/product_compare/ingestion/cj_product_import_scheduler_test.exs`
- `docs/work/product-trust-and-discovery.md`

## Tasks

1. Add Oban, its migration, supervised runtime, inline/manual test mode, and
   bounded ingestion queues. Verify a no-op worker persists and executes.
2. Write failing worker tests for normalized arguments, schedule-window
   uniqueness, success, transient retry, terminal provider failure, and secret-
   safe errors. Implement feed-discovery and product-import workers by calling
   the existing task-owned import functions until those functions receive a
   later context extraction.
3. Change current schedulers to enqueue unique jobs only. Preserve disabled-by-
   default runtime flags and bounded options. Update scheduler tests.
4. Add an operator-safe job health read model and focused tests.
5. Run migration/test restart evidence, focused scheduler/worker tests,
   formatting, typecheck, queue validation, and `git diff --check`.

Complete-run offer reconciliation is the next ingestion milestone; it does not
land in this dependency-foundation slice.

