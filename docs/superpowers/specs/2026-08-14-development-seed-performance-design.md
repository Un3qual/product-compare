# Development Seed Performance Design

## Status

Approved in conversation on 2026-08-14.

This design refines the persistence strategy in the approved scalable realistic
development-data design. Inventory, ownership, deterministic reruns, profile
switching, offline execution, and named lifecycle behavior remain unchanged.

## Problem

The bounded seed performs about 14,000 SQL queries. The full seed performs about
25,000, and an unchanged full rerun still performs about 13,000. The generated
catalog, engagement, and operations fixtures use record-at-a-time production
write flows, frequently issue a second update to reserve an entropy identifier,
and sometimes delete and recreate unchanged rows. Price-history rows are
batched, but every rerun rewrites all expected observations.

The result is correct but disproportionately slow for both local resets and the
seed regression suite.

## Goals

- Preserve the existing bounded and full inventories and every named scenario.
- Preserve stable database identities across unchanged reruns.
- Restore mutated or deleted seed-owned generated rows without adopting local
  data that happens to share a visible value.
- Preserve unrelated local rows and fail closed on immutable-identity conflicts.
- Validate generated rows with their owning schema changesets before bulk
  persistence.
- Make unchanged generated datasets no-op writes.
- Reduce an unchanged full-profile rerun from about 13,000 SQL queries to fewer
  than 3,000 without a timing-based test.

## Non-Goals

- Do not change product, merchant, offer, history, engagement, or operations
  counts.
- Do not split the atomic seed transaction or parallelize dependent stages.
- Do not change production contexts or expose seed-specific production APIs.
- Do not bypass changeset validation, database constraints, foreign keys, or
  seed-ownership checks.
- Do not optimize the small named fixture set merely to remove a handful of
  queries.

## Design

`ProductCompare.DevSeeds.Support` will provide seed-only helpers that:

1. convert a schema changeset into a validated insert row;
2. preload expected entropy identifiers in bounded chunks;
3. compare persisted fields using the schema's Ecto types;
4. insert missing rows and update only changed seed-owned rows with `insert_all`;
5. leave unchanged rows untouched; and
6. return the complete persisted structs in caller order.

Callers remain responsible for checking natural identities such as product
slugs, validated MPNs, feed IDs, click IDs, and conversion references before
the helper writes anything. That separation keeps adoption decisions explicit
and domain-specific.

Generated catalog products, assignments, identifiers, and media will be built
and validated in memory, then synchronized by entropy identifier. Generated
saved comparisons and watches will update in place rather than delete and
recreate. Generated operations rows will be prefetched and synchronized in
batches; lifecycle-sensitive CJ program transitions remain on their existing
domain path. Generated price observations will use the same changed-row filter
before the existing chunked upsert.

Named fixtures will continue using production context APIs so development data
still exercises representative business workflows. Bulk persistence is limited
to deterministic, synthetic scale rows under `priv/repo/seeds/`.

## Failure And Transaction Behavior

All validation and ownership conflicts raise within the existing serializable
transaction. The transaction remains all-or-nothing. Bulk operations retain
database constraints as the final authority. A caller must validate every row
before issuing its first bulk write so a changeset error cannot leave a partial
chunk inside nested use.

## Verification

- Add a query-budget assertion around the unchanged full rerun in the existing
  identity/profile-switch regression.
- Witness that assertion fail before implementation.
- Keep the complete seed regression file green, including mutation restoration,
  local-data preservation, and full-to-bounded dependency cases.
- Measure bounded, full, and unchanged full runtimes and query counts using the
  same telemetry harness used for diagnosis.
- Run formatting, focused tests, the repository verification gate, and diff
  checks before pushing.
