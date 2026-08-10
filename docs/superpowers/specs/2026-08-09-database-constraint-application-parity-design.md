# Database Constraint Application Parity Design

## Status

Approved on 2026-08-09.

## Problem

PostgreSQL is the final integrity authority, but application-owned same-row
`CHECK` constraints do not have uniform Ecto coverage. Some constraints have an
equivalent changeset validation and a `check_constraint/3` mapping, some have
only one of those layers, and a smaller group relies on the database at the
final write boundary even though the same invariant can be rejected before
SQL.

This produces inconsistent caller behavior. A validation-backed failure is
available on an invalid changeset before `Repo.insert/2` or `Repo.update/2`, a
mapped database failure becomes `{:error, changeset}` only after SQL, and an
unmapped database failure can raise `Ecto.ConstraintError`. The repository must
retain PostgreSQL enforcement while making reachable application checks
predictable before and after a write attempt.

## Decisions

- Every application-owned same-row `CHECK` constraint reachable through an
  Ecto changeset has both an equivalent pre-write validation and an explicit
  `check_constraint/3` mapping.
- A pre-write validation supplements PostgreSQL; it never replaces the
  database constraint.
- Unique, foreign-key, and genuinely cross-row rules remain
  database-authoritative. Do not add a race-prone query-before-write check as a
  substitute.
- A single constrained SQL statement relies on PostgreSQL statement atomicity.
  Any workflow that performs a dependent read before its write runs both in one
  `Repo.transaction/2`, using an appropriate row lock or one atomic statement.
- Trigger-maintained tables without an application write changeset may be an
  explicit exception when the originating application values are validated and
  the trigger runs in the originating statement.
- The permanent rule is documented in `AGENTS.md`. This batch adds ordinary
  behavior and transaction tests, not a generic constraint registry, DSL,
  source scanner, or catalog-driven CI policy.

## Current Inventory Boundary

The live PostgreSQL catalog contains 75 application-owned `CHECK` constraints
after excluding the five checks owned by Oban. The remediation operates on the
current database catalog and owning changesets, not only the checks introduced
by the immediately preceding identifier-and-reference batch.

The following active checks already have equivalent pre-write validation but
need explicit Ecto mappings:

- `category_mapping_candidates_observation_count_positive`;
- `claim_dependencies_not_self`;
- `community_reports_one_target`;
- `ingestion_runs_offers_deactivated_non_negative`;
- `product_attribute_claim_single_typed_value`;
- `product_attribute_claims_confidence_range`;
- `product_media_position_non_negative`;
- `product_reviews_rating_range`;
- `product_taxons_confidence_range`;
- `saved_comparison_items_position_range`; and
- `taxon_closure_depth_nonnegative`.

The following active checks need both final-boundary pre-write validation and
Ecto mapping:

- `alert_events_numeric_evidence_bounds`;
- `comparison_snapshot_attributes_confidence_range`;
- `comparison_snapshot_offers_amounts_non_negative`;
- `comparison_snapshot_rankings_landed_price_non_negative`; and
- `thread_posts_parent_not_self_check`.

The following checks are already mapped but need a complete same-row
pre-write validation on every reachable owning changeset:

- `commerce_links_affiliate_program_check`;
- `community_write_windows_hour_check`;
- `ingestion_runs_terminal_finished_at_required`; and
- `price_watch_rules_baseline_landed_price_non_negative`.

`price_must_be_non_negative` and `shipping_must_be_non_negative` are obsolete
subsets of the mapped finite, non-negative price-point checks. A reversible
migration removes the redundant checks instead of carrying two names for the
same lower bound.

`product_slug_reservations_slug_format_check` is the one documented same-row
exception. The table has no Ecto write schema; product and alias changesets
validate the exact slug first, and their PostgreSQL triggers maintain the
reservation inside the originating insert, update, or delete statement. Direct
SQL coverage retains the reservation constraint itself.

The superseded `api_tokens_prefix_not_empty` name is not an active catalog gap;
the current migration replaced it with the mapped and prevalidated
`api_tokens_prefix_length_check`.

## Application Remediation

### Immutable snapshot and alert facts

The snapshot attribute, offer, and ranking changesets validate the exact
numeric facts protected by their checks immediately before persistence.
Confidence is nullable and, when present, lies from zero through one. Item,
shipping, landed, baseline, and target monetary facts are nullable only where
their schemas already allow null and are finite and non-negative when present.
Percentage drop is nullable and, when present, is greater than zero and at most
100.

Use the existing `ProductCompareSchemas.Schema.normalize_non_finite_decimals/2`
boundary before `cast/3`, followed by local `validate_number/3` calls. Do not
add a generic monetary validator or alter capture calculations, snapshot
immutability, alert evaluation, or persisted values.

### Existing cross-field checks

- Affiliate commerce links require `affiliate_program_id` when `link_type` is
  `:affiliate` before persistence.
- Community write windows reject timestamps that are not aligned to the start
  of a UTC hour before persistence.
- Generic ingestion-run changesets reject terminal `:succeeded` or `:failed`
  state without `finished_at`; `:running` remains valid without it, and
  `completion_changeset/2` retains its stronger terminal-only contract.
- A persisted thread post rejects its own id as `parent_post_id` before
  persistence. Cross-thread parent ownership remains deferred and is not added
  by this batch.

### Existing validations missing mappings

Add the owning `check_constraint/3` call beside each existing validation. Do
not change its message, accepted values, normalization, or context behavior.
The mapping exists so a database rejection caused by concurrent, bypass, or
future alternate input paths returns a changeset error instead of an unmapped
constraint exception.

## Transaction And Race-Safety Contract

No remediation validation performs a database read. Same-row values are
validated from the changeset only.

Audit every changed write path:

- snapshot publication and child persistence remain inside the existing
  snapshot transaction;
- alert evaluation and event insertion remain inside the existing locked watch
  transaction;
- community submission, write-window accounting, and thread-post creation
  retain their existing transactional boundary;
- any affiliate workflow that reads authorization, merchant, or program state
  before mutation keeps that read and write in the existing transaction; and
- ingestion completion retains its locked transaction around current-run state
  and the terminal update.

Add or extend behavior tests when a changed path lacks observable rollback or
locking coverage. A test must prove that failure leaves no partial write. For a
read-modify-write invariant, a concurrency test must prove the competing write
cannot pass between the dependent read and mutation. Do not add an explicit
transaction around a lone insert merely for ceremony; PostgreSQL already runs
the constrained statement atomically.

## Permanent Repository Guidance

Add a concise `Database Constraint Contract` section to `AGENTS.md`:

- same-row application checks require matching changeset validation,
  `check_constraint/3`, direct-write coverage, and pre-write behavior coverage;
- trigger-only exceptions require an explanation and originating-write test;
- uniqueness, foreign keys, and cross-row invariants stay database-backed;
- dependent reads and writes share a transaction with locking or an atomic
  statement; and
- migrations must not introduce a constraint without updating its owning
  application contract and tests in the same batch.

This guidance is intentionally review-enforced. The repository does not gain a
hand-maintained constraint manifest or a meta-test that attempts to infer
semantic equivalence from source shape.

## Test Strategy

Follow RED/GREEN behavior cycles grouped by owner:

1. Add changeset tests that currently remain valid for malformed snapshot,
   alert, watch-baseline, affiliate-link, write-window, ingestion-terminal, and
   thread-parent values. Each test names the production validation that will
   make it fail.
2. Add mapping tests where a reachable constraint currently lacks
   `check_constraint/3`. Prefer a real `Repo.insert/2` result when the existing
   validation can be bypassed through a meaningful alternate path; otherwise
   assert the direct-write constraint in the established storage suite and the
   owning changeset behavior separately.
3. Preserve or extend direct SQL tests for every database check affected by the
   cleanup migration or changed owner.
4. Run focused snapshot, alert, commerce-attribution, discussion, ingestion,
   specification, taxonomy, catalog, and pricing suites.
5. Run the complete backend tests, typecheck, quality, formatting, queue
   validation, and diff hygiene.

## Scope Boundaries

- Do not change product policy, accepted ranges, normalization, stored data, or
  public error messages beyond exposing an existing database rule earlier.
- Do not add cross-thread parent ownership; that discussion/community work
  remains deferred.
- Do not add preflight existence or uniqueness queries.
- Do not generalize validators into a new shared constraint abstraction.
- Do not add a catalog-driven policy test, static source scan, constraint DSL,
  or production registry.
- Do not touch third-party constraints such as Oban's checks.

## Completion

The batch is complete when every active application same-row check with a
reachable changeset is either dual-enforced and mapped or is the documented
trigger-maintained reservation exception; redundant price checks are absent;
changed race-sensitive workflows retain tested atomic transaction boundaries;
the repository guidance records the permanent rule; and all focused and full
verification gates pass.
