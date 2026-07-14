# Product Trust And Discovery Work Doc

## Snapshot

- Status: active (specification provenance read contract)
- Priority: P0
- Source of truth: `docs/work/index.md`
- Program design:
  `docs/superpowers/specs/2026-07-13-product-trust-and-discovery-program-design.md`
- Program plan:
  `docs/superpowers/plans/2026-07-13-product-trust-and-discovery-program.md`
- Active implementation plan:
  `docs/superpowers/plans/2026-07-13-specification-provenance-read-contract-implementation-plan.md`
- Owner: `codex/product-trust-and-discovery`
- Last verified: 2026-07-13 against current ingestion, Specs, Pricing,
  Discussions, GraphQL, Relay route, and migration contracts.

## Selected Program

The user selected canonical specification-rich ingestion, complete and fresh
offer truth, durable ingestion, watchlists and alerts, public comparison
snapshots, source-backed recommendations, provenance and corrections, reviews
and Q&A, SEO/acquisition, and merchant pages.

The implementation order and safety boundaries are recorded in the program
design. In-app alerts are the first delivery transport; email stays deferred.
Recommendations are deterministic and evidence-backed.

## Canonical Product Identity Evidence

- Added a validated `product_identifiers` relation with safe GTIN uniqueness,
  source-artifact evidence, verification state, and product association.
- Added pure GTIN normalization for GTIN-8, UPC-A, EAN-13, and GTIN-14 without
  losing leading zeroes.
- Fresh listings now resolve an existing validated GTIN before creating a
  product shell. Different source listings and merchants retain separate
  external products and offers while sharing the canonical product.
- Existing source/external product attachments remain authoritative. A later
  conflicting GTIN cannot silently rebind the product or add a conflicting
  identifier.
- Blank, malformed, unsupported, and invalid-checksum values create no
  identifier and cause no merge.
- RED: the GTIN unit suite failed 3 tests because the module was absent. The
  ingestion suite then failed to compile because the identifier schema was
  absent.
- GREEN: the combined GTIN and ingestion run passed 34 tests with 0 failures.
- Final gates: `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate` (`6 ready rows`), and `git diff --check` passed.

## Foundation Successors

- Specification provenance read contract: active.
- Complete offer truth read contract: ready.
- Durable ingestion job foundation: ready.
- Enrichment, corrections, reconciliation, alerts, recommendations, sharing,
  community, merchant pages, and SEO are promoted only as their dependencies
  become green.
