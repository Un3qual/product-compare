# CJ Program Lifecycle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace feed-by-feed CJ review with one operator-only **CJ programs**
page where every advertiser program can be moved directly among all seven
lifecycle stages.

**Architecture:** A new `cj_programs` record owns the durable stage, note, and
change time for one trimmed CJ advertiser ID within one source. Feed candidates
remain observed feed facts and link to a program when they have stable
advertiser identity; program queries, reports, imports, GraphQL, and the React
route all use that one lifecycle record rather than copying state onto feeds.

**Tech Stack:** Elixir 1.19, Phoenix 1.8, Ecto/PostgreSQL, Absinthe GraphQL,
React 19, React Router 7, Relay 20, TypeScript, StyleX, Radix Collapsible,
ExUnit, Vitest, and Testing Library.

## Global Constraints

- Page and navigation label: **CJ programs**.
- Canonical path: `/ingestion/cj-programs`; `/ingestion/feed-candidates`
  redirects to it.
- Allowed stages are exactly **New**, **Considering**, **Selected**,
  **Applied**, **Accepted**, **Not pursuing**, and **Declined**.
- An operator can move a program directly to any stage; no transition guard may
  force sequential movement.
- One program owns one stage, note, and change time for one trimmed nonblank CJ
  advertiser ID within one source.
- Feed discovery may update feed facts or attach new feeds but may not replace a
  program's stage or note.
- Feeds without a usable advertiser ID stay unlinked and appear as
  **Unmatched feeds** on the same page.
- The program record is the only workflow source of truth after migration; do
  not dual-write or retain active per-feed review state.
- Do not use `readiness view`, `surface`, `contract`, `projection`, or
  `operator tooling` as product copy.
- Do not show the old fit score. Show factual feed values and plain-language
  warnings without claiming CJ approval or provider eligibility.
- Keep all browser access operator-only and authorize before database reads or
  writes.
- Never return raw provider metadata, credentials, unsafe account identifiers,
  tracking parameters, or provider payloads.
- No live CJ request, application submission, advertiser contact, credential
  storage, eBay fallback, Tier-3 scraping, or CSV export is in scope.
- Visual thesis: a dense, quiet operator workspace led by stage counts,
  filters, and a divided program list; use the existing design system, minimal
  chrome, and no hero or dashboard-card mosaic.
- Content plan: stage summary, program controls, paginated program list,
  expandable feed facts, then unmatched feeds.
- Interaction thesis: stage and note edits stay local to one row; Radix
  Collapsible reveals bounded feed pages on demand; pending, success, and error
  feedback never changes another row.
- Keep React route loading lazy, preload the independent root collections in
  one Relay operation, define row components at module scope, and use
  functional state updates whenever new state depends on current state.
- Use behavior tests rather than source-string assertions.
- Keep this as one independently shippable cross-stack queue outcome.

## Dispatch Prerequisite

The live queue has no `ready` implementation rows. This plan validates one
coherent outcome and does not manufacture database, GraphQL, and frontend
micro-batches to satisfy the reserve floor.

On 2026-07-25, the user selected this product direction and explicitly approved
a one-time waiver of the three-ready reserve rule for this batch. The
coordinator records the complete CJ outcome as `active`, links this plan, owns
every path named below (including the coordinator docs), and treats the tasks
as internal slices.

The waiver does not weaken `ProductCompare.WorkQueue.Validator`. While this
batch is active, `mix work_queue.validate` and therefore aggregate `mix ci`
are expected to fail only with:

```text
Ready Work requires at least 3 complete rows; found 0
```

Every other CI component must pass directly. Any different queue-validation
failure or any failure in formatting, types, quality, tests, frontend checks,
or diff hygiene remains a blocker.

After Task 1 review exposed a sequencing contradiction, the user ruled on
2026-07-25 that the staged task boundaries govern. Tasks 1-5 use their focused
behavior gates while legacy consumers assigned to later tasks still make the
aggregate compile/full suite red. Task 6 must restore
`mix compile --warnings-as-errors` and the full backend suite before frontend
work proceeds. Do not restore feed-level review compatibility or expand an
earlier task across later owned paths merely to make an intermediate aggregate
gate green.

---

### Task 1: Durable Program Schema And Legacy Backfill

**Files:**

- Create:
  `priv/repo/migrations/20260725120000_add_cj_program_lifecycle.exs`
- Create:
  `lib/product_compare_schemas/ingestion/cj_program.ex`
- Modify:
  `lib/product_compare_schemas/ingestion/merchant_feed_candidate.ex`
- Create:
  `test/product_compare/repo/migrations/add_cj_program_lifecycle_test.exs`
- Create:
  `test/product_compare/ingestion/cj_program_schema_test.exs`

**Interfaces:**

- Produces `ProductCompareSchemas.Ingestion.CJProgram` with stored fields
  `entropy_id`, `source_id`, `advertiser_id`, `stage`, `note`, and
  `changed_at`.
- Produces `CJProgram.changeset/2` for identity creation and
  `CJProgram.lifecycle_changeset/2` for stage/note validation.
- Adds `MerchantFeedCandidate.cj_program_id` and the `:cj_program`
  association.
- Removes `MerchantFeedCandidate.review_status`, `review_note`, `reviewed_at`,
  and `review_changeset/2`.

- [ ] **Step 1: Write the failing migration behavior test**

Create a prefix-isolated migration test following
`add_operator_access_to_users_test.exs`. Seed legacy CJ rows for:

```elixir
[
  %{advertiser_id: " adv-shortlist ", review_status: "shortlisted"},
  %{advertiser_id: "adv-shortlist", review_status: "dismissed"},
  %{advertiser_id: "adv-dismissed", review_status: "dismissed"},
  %{advertiser_id: "adv-dismissed", review_status: "dismissed"},
  %{advertiser_id: "adv-mixed", review_status: "pending"},
  %{advertiser_id: "adv-mixed", review_status: "dismissed"},
  %{advertiser_id: " ", review_status: "shortlisted"}
]
```

Assert that migration up:

```elixir
assert program_rows(prefix) == [
  ["adv-dismissed", "not_pursuing"],
  ["adv-mixed", "new"],
  ["adv-shortlist", "considering"]
]

assert linked_feed_count(prefix, "adv-shortlist") == 2
assert unmatched_feed_count(prefix) == 1
refute column_exists?(prefix, "merchant_feed_candidates", "review_status")
```

Also seed two nonblank notes with equal `reviewed_at` values and assert the
higher feed ID wins the deterministic tie. Assert the source/advertiser unique
constraint and stage check reject duplicates and unknown stages.

In `cj_program_schema_test.exs`, assert identity changesets require source,
trimmed advertiser identity supplied by the caller, a valid stage, and a change
time. Assert lifecycle changesets accept each of the seven exact stages and
reject any other value.

- [ ] **Step 2: Run the migration test and verify the missing migration fails**

Run:

```bash
mix test test/product_compare/repo/migrations/add_cj_program_lifecycle_test.exs test/product_compare/ingestion/cj_program_schema_test.exs
```

Expected: FAIL because the migration and schema modules do not exist.

- [ ] **Step 3: Add the transactional schema migration**

Create `cj_programs` and backfill with one grouped row per CJ source and
trimmed advertiser ID:

```elixir
create table(:cj_programs) do
  add :entropy_id, :uuid, null: false, default: fragment("uuidv7()")
  add :source_id, references(:sources, type: :bigint, on_delete: :delete_all),
    null: false
  add :advertiser_id, :text, null: false
  add :stage, :text, null: false, default: "new"
  add :note, :text
  add :changed_at, :utc_datetime_usec, null: false
  timestamps(type: :utc_datetime_usec)
end

alter table(:merchant_feed_candidates) do
  add :cj_program_id,
      references(:cj_programs, type: :bigint, on_delete: :nilify_all)
end
```

The backfill must use this stage precedence:

```sql
CASE
  WHEN bool_or(review_status = 'shortlisted') THEN 'considering'
  WHEN bool_and(review_status = 'dismissed') THEN 'not_pursuing'
  ELSE 'new'
END
```

Use a `DISTINCT ON (source_id, BTRIM(advertiser_id))` note subquery ordered by
`reviewed_at DESC NULLS LAST, id DESC`. Link CJ feed rows with:

```sql
UPDATE merchant_feed_candidates AS feed
SET cj_program_id = program.id
FROM cj_programs AS program
WHERE feed.provider = 'cj'
  AND program.source_id = feed.source_id
  AND program.advertiser_id = BTRIM(feed.advertiser_id)
  AND NULLIF(BTRIM(feed.advertiser_id), '') IS NOT NULL
```

Create these database protections before dropping the legacy fields:

```elixir
create unique_index(:cj_programs, [:entropy_id])

create unique_index(:cj_programs, [:source_id, :advertiser_id],
         name: :cj_programs_source_advertiser_uq
       )

create constraint(:cj_programs, :cj_programs_stage_chk,
         check:
           "stage IN ('new', 'considering', 'selected', 'applied', " <>
             "'accepted', 'not_pursuing', 'declined')"
       )

create index(:merchant_feed_candidates, [:cj_program_id],
         name: :merchant_feed_candidates_cj_program_idx
       )
```

Drop `merchant_feed_candidates_provider_review_status_idx`, the old review
constraint, and all three review columns. Implement `down/0` by restoring the
columns, mapping `new` to `pending`,
`considering|selected|applied|accepted` to `shortlisted`, and
`not_pursuing|declined` to `dismissed`, then dropping the program link and
table.

- [ ] **Step 4: Add the Ecto schemas**

Use these stage definitions and changeset boundaries:

```elixir
defmodule ProductCompareSchemas.Ingestion.CJProgram do
  use ProductCompareSchemas.Schema, :relational

  @stages ~w(new considering selected applied accepted not_pursuing declined)

  schema "cj_programs" do
    field :entropy_id, Ecto.UUID
    field :advertiser_id, :string
    field :stage, :string, default: "new"
    field :note, :string
    field :changed_at, :utc_datetime_usec
    field :advertiser_name, :string, virtual: true
    field :feed_count, :integer, virtual: true
    field :warning_codes, {:array, :string}, virtual: true, default: []

    belongs_to :source, ProductCompareSchemas.Specs.Source
    has_many :feeds, ProductCompareSchemas.Ingestion.MerchantFeedCandidate
    timestamps()
  end
end
```

`changeset/2` casts and requires `source_id`, `advertiser_id`, `stage`, and
`changed_at`; it validates the seven stages and the two named constraints.
`lifecycle_changeset/2` casts only `stage`, `note`, and `changed_at`.
`MerchantFeedCandidate.changeset/2` casts `cj_program_id`, exposes the
association, and no longer casts or validates legacy review data.

- [ ] **Step 5: Run the focused migration and schema tests**

Run:

```bash
mix test test/product_compare/repo/migrations/add_cj_program_lifecycle_test.exs test/product_compare/ingestion/cj_program_schema_test.exs
mix compile --warnings-as-errors
```

Expected: the focused suite passes. Under the user's approved staged-gate
ruling, compile remains red only for legacy review consumers owned by Tasks
2-6; any different warning or error is blocking. Task 6 restores the aggregate
compile gate.

- [ ] **Step 6: Commit the schema milestone**

```bash
git add priv/repo/migrations/20260725120000_add_cj_program_lifecycle.exs lib/product_compare_schemas/ingestion/cj_program.ex lib/product_compare_schemas/ingestion/merchant_feed_candidate.ex test/product_compare/repo/migrations/add_cj_program_lifecycle_test.exs test/product_compare/ingestion/cj_program_schema_test.exs
git commit -m "feat: add CJ program lifecycle storage"
```

### Task 2: Program Lifecycle And Discovery Linking

**Files:**

- Create: `lib/product_compare/ingestion/cj_programs.ex`
- Modify: `lib/product_compare/ingestion/feed_candidates.ex`
- Modify: `lib/product_compare/ingestion.ex`
- Modify: `test/support/fixtures/cj_ingestion_fixtures.ex`
- Create: `test/product_compare/ingestion/cj_programs_test.exs`
- Modify: `test/product_compare/ingestion/ingestion_test.exs`

**Interfaces:**

- `CJPrograms.ensure_in_transaction/2` consumes `source_id` and a raw
  advertiser ID and returns `{:ok, CJProgram.t()}` without changing an existing
  lifecycle.
- `CJPrograms.get_by_entropy_id/1` returns a program or `nil`.
- `CJPrograms.update_lifecycle/2` and `/3` consume an entropy UUID,
  `%{stage:, note:}`, and an optional explicit UTC timestamp and return
  `{:ok, CJProgram.t()} | {:error, :not_found | Ecto.Changeset.t()}`.
- `FeedCandidates.upsert_merchant_feed_candidate/2` keeps its public return
  type while performing program creation, feed upsert, and linking in one
  transaction.

- [ ] **Step 1: Write failing lifecycle and discovery tests**

Cover:

```elixir
test "two CJ feeds with one trimmed advertiser ID share one program"
test "the same advertiser ID in two sources creates two programs"
test "blank advertiser IDs and non-CJ feeds remain unmatched"
test "refreshing and adding feeds preserve the program stage and note"
test "every allowed stage can be selected directly"
test "blank notes become nil and unchanged saves preserve changed_at"
test "invalid stages and missing entropy IDs make no change"
test "a failed feed upsert rolls back newly created program state"
```

The preservation case must set a program to `applied`, add a note, upsert a
second feed for the same advertiser, and assert both values and `changed_at`
remain identical.

- [ ] **Step 2: Run the tests and verify missing lifecycle behavior fails**

Run:

```bash
mix test test/product_compare/ingestion/cj_programs_test.exs test/product_compare/ingestion/ingestion_test.exs
```

Expected: FAIL because `CJPrograms` and transactional linking do not exist.

- [ ] **Step 3: Implement race-safe program creation**

Normalize advertiser IDs with trim-and-blank-to-`nil`. Inside the caller's
transaction, insert with the unique identity as conflict target:

```elixir
%CJProgram{}
|> CJProgram.changeset(%{
  source_id: source_id,
  advertiser_id: advertiser_id,
  stage: "new",
  changed_at: DateTime.utc_now()
})
|> Repo.insert(
  on_conflict: :nothing,
  conflict_target: [:source_id, :advertiser_id],
  returning: true
)
```

When `on_conflict: :nothing` returns a struct without an ID, fetch the existing
row by `source_id` and `advertiser_id`. Do not update stage, note, or
`changed_at` in this path.

- [ ] **Step 4: Make feed upsert and linking atomic**

Wrap the existing candidate insert in `Repo.transaction/1`. For provider
`"cj"`, call `ensure_in_transaction/2` and put its ID into `cj_program_id`; for
blank identity or another provider, set `cj_program_id` to `nil`. Add
`:cj_program_id` to `@replace_fields` so a changed or removed identity cannot
leave a stale link. Roll back on either program or feed changeset failure and
preserve the existing public `{:ok, candidate} | {:error, reason}` result.

- [ ] **Step 5: Implement lifecycle updates**

Normalize both atom and string input keys, trim the note, and reject unknown
stages through `lifecycle_changeset/2`. Only put the supplied `changed_at` when
the normalized stage or note differs from the stored value:

```elixir
if changeset.changes == %{} do
  {:ok, program}
else
  program
  |> Ecto.Changeset.put_change(:changed_at, now)
  |> Repo.update()
end
```

Expose the new operations through `ProductCompare.Ingestion` and remove the old
`review_merchant_feed_candidate/2` and review-filter delegates.

- [ ] **Step 6: Update fixtures and run focused tests**

Add `cj_program_fixture/2`; make `merchant_feed_candidate_fixture/2` use the
normal ingestion upsert so linked programs are created consistently. Keep a
raw insert helper only for tests that explicitly need malformed or unmatched
database state.

Run:

```bash
mix test test/product_compare/ingestion/cj_programs_test.exs test/product_compare/ingestion/ingestion_test.exs test/product_compare/ingestion/cj_feed_discovery_test.exs
```

Expected: PASS.

- [ ] **Step 7: Commit the lifecycle milestone**

```bash
git add lib/product_compare/ingestion/cj_programs.ex lib/product_compare/ingestion/feed_candidates.ex lib/product_compare/ingestion.ex test/support/fixtures/cj_ingestion_fixtures.ex test/product_compare/ingestion/cj_programs_test.exs test/product_compare/ingestion/ingestion_test.exs
git commit -m "feat: link CJ feeds to program lifecycle"
```

### Task 3: Program Queries, Counts, Warnings, And Feed Pages

**Files:**

- Modify: `lib/product_compare/ingestion/cj_programs.ex`
- Create: `lib/product_compare/ingestion/cj_program_warnings.ex`
- Modify: `lib/product_compare/ingestion.ex`
- Modify: `lib/product_compare/ingestion/feed_candidates.ex`
- Delete: `lib/product_compare/ingestion/cj_candidate_cohort.ex`
- Delete: `lib/product_compare/ingestion/cj_application_readiness.ex`
- Delete: `lib/product_compare/ingestion/fit_score.ex`
- Modify: `test/product_compare/ingestion/cj_programs_test.exs`
- Create: `test/product_compare/ingestion/cj_program_warnings_test.exs`
- Delete: `test/product_compare/ingestion/cj_candidate_cohort_test.exs`
- Delete: `test/product_compare/ingestion/cj_application_readiness_test.exs`
- Delete: `test/product_compare/ingestion/fit_score_test.exs`

**Interfaces:**

- `CJPrograms.list_query/1` returns program structs annotated with the latest
  nonblank advertiser name and total feed count.
- `CJPrograms.stage_counts/0` returns all seven atom keys with zero values
  included.
- `CJPrograms.list_feeds_query/1` filters linked CJ feeds by program or stage.
- `CJPrograms.list_unmatched_feeds_query/0` returns only CJ feeds with no
  program link.
- `CJPrograms.pursued_stages/0` returns
  `["selected", "applied", "accepted"]`.
- `CJProgramWarnings.by_program_ids/1` returns one map entry per requested
  program ID and performs one bounded aggregate query.

- [ ] **Step 1: Write failing query behavior tests**

Add cases for:

```elixir
assert stage_counts() == %{
  new: 1,
  considering: 0,
  selected: 1,
  applied: 0,
  accepted: 0,
  not_pursuing: 0,
  declined: 0
}
```

Also verify:

- counts cover the full data set rather than the current page;
- stage filtering accepts only the seven stored values;
- `:name_asc`, `:last_changed_desc`, and `:feed_count_desc` use program ID as
  the final ascending tie break;
- program name comes from the most recently seen nonblank feed, with feed ID as
  the equal-time tie break and advertiser ID as the fallback;
- per-program feed ordering is last-seen descending then feed ID ascending;
- unmatched feeds exclude linked and non-CJ rows; and
- product counts remain individual feed facts and are never summed.

- [ ] **Step 2: Write failing warning aggregation tests**

Use two feeds under one program and assert one deterministic, duplicate-free
list:

```elixir
assert CJProgramWarnings.by_program_ids([program.id]) == %{
  program.id => [
    "missing_advertiser_name",
    "missing_product_count",
    "non_us_market",
    "non_usd_currency",
    "non_english_language"
  ]
}
```

Assert that raw metadata and tracking values never appear in the result and
that an empty ID list performs no query.

- [ ] **Step 3: Run tests and verify the new reads fail**

Run:

```bash
mix test test/product_compare/ingestion/cj_programs_test.exs test/product_compare/ingestion/cj_program_warnings_test.exs
```

Expected: FAIL because the query and warning interfaces are missing.

- [ ] **Step 4: Implement deterministic program queries**

Build one latest-name subquery using `distinct` on `cj_program_id`, ordered by
program ID, `last_seen_at DESC`, and feed ID DESC. Build a second grouped
subquery for `feed_count`. Join both into `CJProgram` and `select_merge` the
virtual `advertiser_name` and `feed_count` fields. Apply only these sorts:

```elixir
@sorts [:name_asc, :last_changed_desc, :feed_count_desc]
```

Every sort ends with `asc: program.id`. Invalid stages mean no stage filter;
invalid sorts fall back to `:name_asc`.

- [ ] **Step 5: Implement warnings and feed queries**

Aggregate warnings for the supplied, deduplicated positive program IDs only.
The warning module owns these codes in this order:

```elixir
@warning_codes [
  "missing_advertiser_name",
  "missing_product_count",
  "non_us_market",
  "non_usd_currency",
  "non_english_language"
]
```

Use factual `bool_or` checks across a program's feeds and return `[]` for a
program with no matching warning. Keep `list_feeds_query/1` and
`list_unmatched_feeds_query/0` as safe Ecto queries that never select
`raw_metadata`.

- [ ] **Step 6: Remove replaced shortlist and fit-score models**

Delete the candidate cohort, application-readiness, and fit-score modules and
their dedicated tests. Move the still-valid factual warning behavior into
`CJProgramWarnings`; do not leave compatibility functions that speak in
pending/shortlisted/dismissed vocabulary.

On 2026-07-25, the user approved adding `FeedCandidates` to this task after
the mandated `FitScore` deletion prevented even the focused Task 3 suite from
compiling. Remove only its obsolete `FitScore` import/calls here; do not add a
compatibility shim or broaden the candidate read model.

- [ ] **Step 7: Run focused reads and commit**

Run:

```bash
mix test test/product_compare/ingestion/cj_programs_test.exs test/product_compare/ingestion/cj_program_warnings_test.exs
```

Expected: PASS.

```bash
git add lib/product_compare/ingestion/cj_programs.ex lib/product_compare/ingestion/cj_program_warnings.ex lib/product_compare/ingestion.ex lib/product_compare/ingestion/feed_candidates.ex lib/product_compare/ingestion/cj_candidate_cohort.ex lib/product_compare/ingestion/cj_application_readiness.ex lib/product_compare/ingestion/fit_score.ex test/product_compare/ingestion/cj_programs_test.exs test/product_compare/ingestion/cj_program_warnings_test.exs test/product_compare/ingestion/cj_candidate_cohort_test.exs test/product_compare/ingestion/cj_application_readiness_test.exs test/product_compare/ingestion/fit_score_test.exs
git commit -m "feat: query CJ programs and warnings"
```

### Task 4: Stage-Based Candidate Reports

**Files:**

- Modify: `lib/product_compare/ingestion/cj_candidate_freshness.ex`
- Modify: `lib/product_compare/ingestion/cj_candidate_market_coverage.ex`
- Modify:
  `lib/mix/tasks/product_compare/ingestion/cj_candidates/options.ex`
- Modify:
  `lib/mix/tasks/product_compare/ingestion/cj_candidates/stale_report.ex`
- Modify:
  `lib/mix/tasks/product_compare/ingestion/cj_candidates/fit_gap_report.ex`
- Modify:
  `lib/mix/tasks/product_compare/ingestion/cj_candidates/application_cohort_report.ex`
- Modify: `test/product_compare/ingestion/cj_candidate_freshness_test.exs`
- Modify:
  `test/product_compare/ingestion/cj_candidate_market_coverage_test.exs`
- Modify: `test/mix/tasks/product_compare_ingestion_cj_candidates_test.exs`

**Interfaces:**

- `cj_candidates --stage` accepts the seven program stages plus `all`.
- `cj_candidates --include-unmatched` includes feeds without a program where
  that report permits them.
- Stale defaults to `stage=all`; fit gaps defaults to `stage=new`;
  application cohort is fixed to `stage=selected`.
- Freshness and market coverage continue to count feeds, with stage breakdowns
  and an explicit `unmatched` count.

- [ ] **Step 1: Replace report tests with stage-language expectations**

Test exact option and output behavior:

```elixir
assert opts[:stage] == "new"
assert opts[:include_unmatched] == false
```

- invalid `--stage` raises `invalid program stage`;
- stale `--stage all --include-unmatched` includes linked and unmatched CJ
  feeds;
- fit gaps defaults to New programs;
- application cohort includes Selected only and prints `program_stage=selected`,
  `program_note_present`, `program_changed_at`, and factual warning codes;
- Applied and Accepted programs do not re-enter the application cohort; and
- output contains no `review_status`, `shortlisted`, `dismissed`, or fit score.

- [ ] **Step 2: Run the report tests and verify old vocabulary fails**

Run:

```bash
mix test test/mix/tasks/product_compare_ingestion_cj_candidates_test.exs test/product_compare/ingestion/cj_candidate_freshness_test.exs test/product_compare/ingestion/cj_candidate_market_coverage_test.exs
```

Expected: FAIL on old status options, keys, and fields.

- [ ] **Step 3: Migrate report options and queries**

Replace `status` with `stage` in normalized options and add
`include_unmatched: :boolean`. Use `CJPrograms.list_feeds_query/1`; preload the
program only when output needs its note or timestamps. The application-cohort
branch must override its stage to `"selected"` instead of accepting a caller
override.

- [ ] **Step 4: Migrate freshness and coverage aggregates**

Join programs once, group linked feeds by program stage, and put unlinked CJ
feeds into `:unmatched`. Preserve fresh/aging/stale thresholds, normalized
market buckets, deterministic order, total feed counts, and secret-safe
aggregate output.

- [ ] **Step 5: Run focused reports and commit**

Run:

```bash
mix test test/mix/tasks/product_compare_ingestion_cj_candidates_test.exs test/product_compare/ingestion/cj_candidate_freshness_test.exs test/product_compare/ingestion/cj_candidate_market_coverage_test.exs
```

Expected: PASS.

```bash
git add lib/product_compare/ingestion/cj_candidate_freshness.ex lib/product_compare/ingestion/cj_candidate_market_coverage.ex lib/mix/tasks/product_compare/ingestion/cj_candidates/options.ex lib/mix/tasks/product_compare/ingestion/cj_candidates/stale_report.ex lib/mix/tasks/product_compare/ingestion/cj_candidates/fit_gap_report.ex lib/mix/tasks/product_compare/ingestion/cj_candidates/application_cohort_report.ex test/product_compare/ingestion/cj_candidate_freshness_test.exs test/product_compare/ingestion/cj_candidate_market_coverage_test.exs test/mix/tasks/product_compare_ingestion_cj_candidates_test.exs
git commit -m "feat: report CJ feeds by program stage"
```

### Task 5: Program-Based Imports And Operational Checks

**Files:**

- Move:
  `lib/mix/tasks/product_compare/ingestion/cj_import/candidates.ex` to
  `lib/mix/tasks/product_compare/ingestion/cj_import/programs.ex`
- Modify:
  `lib/mix/tasks/product_compare/ingestion/cj_import/options.ex`
- Modify: `lib/mix/tasks/product_compare.ingestion.cj_import.ex`
- Modify: `lib/mix/tasks/product_compare.ingestion.cj_readiness_gate.ex`
- Delete:
  `lib/mix/tasks/product_compare.ingestion.cj_candidate_review_batch.ex`
- Modify: `test/mix/tasks/product_compare_ingestion_cj_import_test.exs`
- Modify:
  `test/mix/tasks/product_compare_ingestion_cj_readiness_gate_test.exs`
- Delete:
  `test/mix/tasks/product_compare_ingestion_cj_candidate_review_batch_test.exs`
- Modify: `docs/runbooks/cj-weekly-operator-loop.md`

**Interfaces:**

- `CjImport.Programs.requested?/1` is true for `--from-programs` or explicit
  provider feed IDs.
- Without explicit feed IDs, `--from-programs` selects feeds linked to
  Selected, Applied, and Accepted programs.
- Repeated `--stage` narrows `--from-programs` to a validated subset of those
  three stages.
- Explicit `--provider-feed-id` ignores program stage and supports unmatched
  feeds.
- `--feed-limit` replaces the old `--candidate-limit` option and output uses
  feed language.
- The readiness gate accepts `--min-pursued-programs` and emits
  `pursued_program_count`.

- [ ] **Step 1: Write failing import and readiness tests**

Cover:

```elixir
test "--from-programs defaults to selected applied and accepted"
test "repeated --stage narrows managed program imports"
test "explicit feed IDs bypass stage and unmatched restrictions"
test "considering not_pursuing declined and non-CJ feeds are excluded"
test "readiness counts programs rather than feeds"
test "advancing selected to applied or accepted preserves pursued count"
test "the old review batch task is unavailable"
```

Also assert invalid stages raise without contacting CJ and reports contain no
review-status vocabulary.

- [ ] **Step 2: Run tests and verify the old command behavior fails**

Run:

```bash
mix test test/mix/tasks/product_compare_ingestion_cj_import_test.exs test/mix/tasks/product_compare_ingestion_cj_readiness_gate_test.exs
```

Expected: FAIL on `from_candidates`, `review_status`, and shortlist counts.

- [ ] **Step 3: Replace candidate import selection with program selection**

Parse:

```elixir
from_programs: :boolean,
stage: :keep,
provider_feed_id: :keep,
feed_limit: :integer
```

Rename the corresponding normalized option and report keys to `feed_limit`,
`feed_count`, and `imported_feeds`. Normalize repeated stages against
`CJPrograms.pursued_stages/0`. In
`Programs.run/1`, explicit provider feed IDs take precedence; otherwise join
feeds to programs and filter by the normalized stages.

- [ ] **Step 4: Replace readiness shortlist counts**

Count distinct `cj_programs.id` for stages returned by
`CJPrograms.pursued_stages/0`. Rename parser, report keys, and minimum check
from `min_shortlisted`/`shortlisted_count` to
`min_pursued_programs`/`pursued_program_count`. Preserve credential, run
freshness, schedule, and `--require-ready` behavior.

- [ ] **Step 5: Remove the second write path and update the runbook**

Delete `cj_candidate_review_batch` and its test. Replace its weekly-loop steps
with an instruction to use **CJ programs** at `/ingestion/cj-programs`.
Replace:

```text
--from-candidates --review-status shortlisted
```

with:

```text
--from-programs
```

Update report examples to `--stage`, explain Selected as the application
cohort, and keep all existing credential, application-submission, contact,
scraping, and export guardrails.

- [ ] **Step 6: Run operational tests and commit**

Run:

```bash
mix test test/mix/tasks/product_compare_ingestion_cj_import_test.exs test/mix/tasks/product_compare_ingestion_cj_readiness_gate_test.exs test/mix/tasks/product_compare_ingestion_cj_candidates_test.exs
```

Expected: PASS.

```bash
git add lib/mix/tasks/product_compare/ingestion/cj_import/candidates.ex lib/mix/tasks/product_compare/ingestion/cj_import/programs.ex lib/mix/tasks/product_compare/ingestion/cj_import/options.ex lib/mix/tasks/product_compare.ingestion.cj_import.ex lib/mix/tasks/product_compare.ingestion.cj_readiness_gate.ex lib/mix/tasks/product_compare.ingestion.cj_candidate_review_batch.ex test/mix/tasks/product_compare_ingestion_cj_import_test.exs test/mix/tasks/product_compare_ingestion_cj_readiness_gate_test.exs test/mix/tasks/product_compare_ingestion_cj_candidate_review_batch_test.exs docs/runbooks/cj-weekly-operator-loop.md
git commit -m "feat: operate CJ imports from program stages"
```

### Task 6: Operator-Only GraphQL Program API

**Files:**

- Modify: `lib/product_compare_web/graphql/global_id.ex`
- Modify: `lib/product_compare_web/graphql/loader/root_sources.ex`
- Modify: `lib/product_compare_web/resolvers/ingestion_resolver.ex`
- Modify: `lib/product_compare_web/schema/types/commerce.ex`
- Modify: `lib/product_compare_web/schema.ex`
- Modify: `assets/schema.graphql`
- Create: `test/product_compare_web/graphql/cj_program_queries_test.exs`
- Modify: `test/product_compare_web/graphql/global_id_test.exs`
- Modify: `test/product_compare_web/graphql/dataloader_batching_test.exs`
- Modify: `test/product_compare_web/graphql/schema_snapshot_test.exs`
- Modify: `test/product_compare/ingestion/ingestion_test.exs`
- Delete:
  `test/product_compare_web/graphql/merchant_feed_candidate_queries_test.exs`

**Interfaces:**

- Query `cjPrograms(first, after, stage, sort)` returns
  `CJProgramConnection`.
- Query `cjProgram(id)` returns one authorized program for on-demand feed
  loading.
- Query `cjProgramStageCounts` returns all seven full-dataset counts.
- Query `unmatchedCjFeeds(first, after)` returns safe feed facts only.
- `CJProgram.feeds(first, after)` returns a bounded candidate connection.
- Mutation `updateCjProgram(input: {id, stage, note})` returns
  `{program, errors}`.
- Program IDs encode `CJProgram.entropy_id` as Global ID type `CjProgram`.

- [ ] **Step 1: Write failing GraphQL behavior tests**

The tests must exercise the public schema, not resolver source text:

```graphql
query CJPrograms($first: Int!, $stage: CJProgramStage) {
  cjProgramStageCounts {
    new
    considering
    selected
    applied
    accepted
    notPursuing
    declined
  }
  cjPrograms(first: $first, stage: $stage, sort: NAME_ASC) {
    edges {
      node {
        id
        advertiserId
        advertiserName
        stage
        note
        lastChanged
        feedCount
        warningCodes
      }
    }
    pageInfo { hasNextPage endCursor }
  }
}
```

Cover stable pagination and all sorts, full counts under a filter, bounded
nested feeds, unmatched feeds, direct mutation to all stages, blank-note
normalization, invalid/wrong-type/missing IDs, and typed validation errors.
Capture SQL queries and assert anonymous and authenticated non-operators cause
zero reads from `cj_programs` and `merchant_feed_candidates`.

- [ ] **Step 2: Add a secret-exclusion introspection test**

Assert the CJ program and feed types do not contain:

```elixir
~w(rawMetadata credentials accountId trackingParams providerPayload)
```

Also assert old fields and operations are absent:

```elixir
~w(reviewStatus reviewNote reviewedAt reviewMerchantFeedCandidate merchantFeedCandidates)
```

- [ ] **Step 3: Run GraphQL tests and verify the schema is missing**

Run:

```bash
mix test test/product_compare_web/graphql/cj_program_queries_test.exs test/product_compare_web/graphql/global_id_test.exs test/product_compare_web/graphql/schema_snapshot_test.exs
```

Expected: FAIL because the CJ program types and fields are undefined.

- [ ] **Step 4: Add Global ID and GraphQL types**

Add `:cj_program => "CjProgram"` to `GlobalId`. Define these Absinthe types:

```elixir
enum :cj_program_stage
enum :cj_program_sort
enum :cj_program_warning_code
object :cj_program
object :cj_program_stage_counts
object :cj_program_connection
object :cj_program_edge
input_object :update_cj_program_input
object :update_cj_program_payload
```

`CJProgram.id` encodes `entropy_id`; `last_changed` resolves from
`changed_at`. Retain `merchant_feed_candidate` only as the safe feed fact type
used inside program and unmatched connections, and remove its three review
fields and the old status/sort enums.

- [ ] **Step 5: Implement authorization-first resolvers**

Each query first calls `Authorization.require_operator/1`, then builds a
bounded `Connection`. For a program page, collect the returned program IDs,
call `CJProgramWarnings.by_program_ids/1` once, and merge `warning_codes` into
the page nodes. Decode program IDs with:

```elixir
GlobalId.decode_uuid(value, :cj_program)
```

The mutation maps authorization, invalid ID, missing record, and changeset
failures to the adjacent typed mutation-error format. Remove the old candidate
resolver and its authorized-loader branch.

- [ ] **Step 6: Refresh the checked-in schema and Relay input**

Mechanically regenerate `assets/schema.graphql` from
`Absinthe.Schema.to_sdl(ProductCompareWeb.Schema)`, format the resulting file,
then run:

```bash
mix test test/product_compare_web/graphql/schema_snapshot_test.exs
```

Expected: PASS with byte-for-byte schema equality.

- [ ] **Step 7: Run GraphQL tests and commit**

Run:

```bash
mix test test/product_compare_web/graphql/cj_program_queries_test.exs test/product_compare_web/graphql/global_id_test.exs test/product_compare_web/graphql/dataloader_batching_test.exs test/product_compare_web/graphql/schema_snapshot_test.exs
```

Expected: PASS.

The first required full-suite convergence run exposed one obsolete fit-score
ranking test in `ingestion_test.exs` that Task 3's FitScore-removal file list
omitted. Remove only that stale test here; do not change ingestion behavior or
add score compatibility. This cleanup is necessary for Task 6's mandatory
aggregate-green gate.

```bash
git add lib/product_compare_web/graphql/global_id.ex lib/product_compare_web/graphql/loader/root_sources.ex lib/product_compare_web/resolvers/ingestion_resolver.ex lib/product_compare_web/schema/types/commerce.ex lib/product_compare_web/schema.ex assets/schema.graphql test/product_compare_web/graphql/cj_program_queries_test.exs test/product_compare_web/graphql/global_id_test.exs test/product_compare_web/graphql/dataloader_batching_test.exs test/product_compare_web/graphql/schema_snapshot_test.exs test/product_compare_web/graphql/merchant_feed_candidate_queries_test.exs test/product_compare/ingestion/ingestion_test.exs
git commit -m "feat: expose operator CJ program lifecycle"
```

### Task 7: Relay Queries, URL State, And Loader

**Files:**

- Create:
  `assets/src/routes/ingestion/cj-programs/queries/CJProgramsRouteQuery.ts`
- Create:
  `assets/src/routes/ingestion/cj-programs/queries/CJProgramFeedsQuery.ts`
- Create:
  `assets/src/routes/ingestion/cj-programs/mutations/UpdateCJProgramMutation.ts`
- Create:
  `assets/src/routes/ingestion/cj-programs/cj-program-data.ts`
- Create: `assets/src/routes/ingestion/cj-programs/pagination.ts`
- Create: `assets/src/routes/ingestion/cj-programs/loader.ts`
- Create:
  `assets/test/routes/ingestion/cj-programs/cj-program-data.test.ts`
- Create:
  `assets/test/routes/ingestion/cj-programs/cj-programs-loader.test.ts`
- Delete:
  `assets/src/routes/ingestion/feed-candidates/queries/MerchantFeedCandidatesRouteQuery.ts`
- Delete:
  `assets/src/routes/ingestion/feed-candidates/mutations/ReviewMerchantFeedCandidateMutation.ts`
- Delete:
  `assets/src/__generated__/MerchantFeedCandidatesRouteQuery.graphql.ts`
- Delete:
  `assets/src/__generated__/ReviewMerchantFeedCandidateMutation.graphql.ts`
- Generate:
  `assets/src/__generated__/CJProgramsRouteQuery.graphql.ts`
- Generate:
  `assets/src/__generated__/CJProgramFeedsQuery.graphql.ts`
- Generate:
  `assets/src/__generated__/UpdateCJProgramMutation.graphql.ts`

**Interfaces:**

- `CJProgramsPagination` has `first`, `after`, `stage`, `sort`,
  `unmatchedFirst`, and `unmatchedAfter`.
- `cjProgramsPaginationFromUrl/1` bounds page sizes to 1-50, trims cursors,
  accepts only the seven stages, and defaults sort to `NAME_ASC`.
- `buildCJProgramPaginationData/2` preserves stage, sort, and the other
  connection's cursor when constructing links.
- `buildUpdateCJProgramInput/3` always returns trimmed current note plus the
  directly selected stage.
- The route loader preloads counts, the requested program page, and the
  requested unmatched page in one Relay operation.

- [ ] **Step 1: Write failing pure-data and URL tests**

Test all seven GraphQL stage values and URL values:

```typescript
const STAGES = [
  ["NEW", "new"],
  ["CONSIDERING", "considering"],
  ["SELECTED", "selected"],
  ["APPLIED", "applied"],
  ["ACCEPTED", "accepted"],
  ["NOT_PURSUING", "not_pursuing"],
  ["DECLINED", "declined"]
] as const;
```

Assert malformed page sizes/cursors/stages/sorts fall back safely, pagination
links preserve both connections' state, warning codes map to factual copy, and
mutation input trims blank notes to `null`.

- [ ] **Step 2: Write failing loader tests**

Assert the loader passes one variable object:

```typescript
{
  first: 20,
  after: null,
  stage: null,
  sort: "NAME_ASC",
  unmatchedFirst: 10,
  unmatchedAfter: null
}
```

Verify request abort propagation and the existing route-loader error recovery
shape.

- [ ] **Step 3: Run tests and verify the route modules are missing**

Run:

```bash
cd assets
bun x vitest run test/routes/ingestion/cj-programs/cj-program-data.test.ts test/routes/ingestion/cj-programs/cj-programs-loader.test.ts
```

Expected: FAIL because the modules and generated Relay types do not exist.

- [ ] **Step 4: Implement the GraphQL documents and pure data owners**

The root operation fetches all stage counts, one program connection, and one
unmatched connection. The feeds operation fetches `cjProgram(id)` with its
bounded `feeds` connection. The mutation returns program ID, stage, note,
last-change time, and typed errors.

Keep formatting, warning copy, mutation variables, and pagination path building
framework-free in `cj-program-data.ts` and `pagination.ts`.

- [ ] **Step 5: Implement the route loader**

Follow the existing route-preload pattern. Parse the URL once, call
`preloadRouteQuery` once, and return:

```typescript
type CJProgramsLoaderData =
  | {
      status: "ready";
      pagination: CJProgramsPagination;
      query: RelayRouteQueryDescriptor<CJProgramsRouteQuery["variables"]>;
    }
  | {
      status: "error";
      pagination: CJProgramsPagination;
    };
```

- [ ] **Step 6: Regenerate Relay artifacts and run tests**

Run:

```bash
cd assets
bun run relay
bun x vitest run test/routes/ingestion/cj-programs/cj-program-data.test.ts test/routes/ingestion/cj-programs/cj-programs-loader.test.ts
```

Expected: PASS and the old generated candidate artifacts are gone.

Relay compilation cannot ignore source documents that reference schema types
removed in Task 6. Delete the two obsolete feed-candidate query/mutation source
documents in this task together with their generated artifacts. Routing,
components, tests, navigation, and remaining old-route files stay owned by
Task 8.

- [ ] **Step 7: Commit the Relay and loader milestone**

```bash
git add assets/src/routes/ingestion/cj-programs assets/test/routes/ingestion/cj-programs assets/src/routes/ingestion/feed-candidates/queries/MerchantFeedCandidatesRouteQuery.ts assets/src/routes/ingestion/feed-candidates/mutations/ReviewMerchantFeedCandidateMutation.ts assets/src/__generated__/CJProgramsRouteQuery.graphql.ts assets/src/__generated__/CJProgramFeedsQuery.graphql.ts assets/src/__generated__/UpdateCJProgramMutation.graphql.ts assets/src/__generated__/MerchantFeedCandidatesRouteQuery.graphql.ts assets/src/__generated__/ReviewMerchantFeedCandidateMutation.graphql.ts
git commit -m "feat: load paginated CJ program data"
```

### Task 8: Unified CJ Programs Page And Route Replacement

**Files:**

- Create:
  `assets/src/routes/ingestion/cj-programs/CJProgramsRoute.tsx`
- Create:
  `assets/src/routes/ingestion/cj-programs/CJProgramList.tsx`
- Create:
  `assets/src/routes/ingestion/cj-programs/CJProgramRow.tsx`
- Create:
  `assets/test/routes/ingestion/cj-programs/cj-programs.route.test.tsx`
- Modify: `assets/src/react-relay.d.ts`
- Modify: `assets/scripts/check-client-bundle.ts`
- Modify: `assets/src/router.tsx`
- Modify: `assets/test/router.test.tsx`
- Modify: `assets/src/routes/root-destination-data.ts`
- Modify: `assets/test/routes/root-destination-data.test.ts`
- Modify: `assets/test/routes/root.route.test.tsx`
- Delete: `assets/src/routes/ingestion/feed-candidates/FeedCandidatesRoute.tsx`
- Delete:
  `assets/src/routes/ingestion/feed-candidates/FeedCandidateReviewList.tsx`
- Delete:
  `assets/src/routes/ingestion/feed-candidates/feed-candidate-review-data.ts`
- Delete:
  `assets/src/routes/ingestion/feed-candidates/feed-candidate-review-mutation-data.ts`
- Delete: `assets/src/routes/ingestion/feed-candidates/loader.ts`
- Delete: `assets/src/routes/ingestion/feed-candidates/pagination.ts`
- Delete:
  `assets/test/routes/ingestion/feed-candidates/feed-candidate-review-data.test.ts`
- Delete:
  `assets/test/routes/ingestion/feed-candidates/feed-candidate-review-mutation-data.test.ts`
- Delete:
  `assets/test/routes/ingestion/feed-candidates/feed-candidates-loader.test.ts`
- Delete:
  `assets/test/routes/ingestion/feed-candidates/feed-candidates.route.test.tsx`
- Modify: `ARCHITECTURE.md`
- Modify: `docs/work/product-data-scraping.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/INDEX.md`

**Interfaces:**

- `CJProgramsRoute` owns the preloaded root query, page shell, controls, and
  unavailable state.
- `CJProgramList` owns stage counts, connection pagination, and unmatched feed
  presentation.
- Each module-scope `CJProgramRow` owns its note draft, selected stage,
  mutation state, feedback, Collapsible state, and on-demand feed query.
- Only the current row is disabled while its mutation is in flight.

- [ ] **Step 1: Write failing route behavior tests**

Cover:

- title, utility description, and **CJ programs** navigation;
- seven full-dataset stage counts and filter choices;
- direct selection of every stage from every current stage;
- save variables with the current trimmed note;
- two rows where one pending mutation leaves the other interactive;
- one row's success or error message never appears in another row;
- factual advertiser name, ID, feed count, and last-change display;
- each warning's plain copy and complete absence of `Fit score`;
- expanding a row triggers its bounded feed query only then;
- feed facts, first/next feed pages, and per-feed product counts;
- unmatched feed facts and independent unmatched pagination;
- loading, empty, authorization/unavailable, and GraphQL payload errors; and
- `/ingestion/feed-candidates` redirects to `/ingestion/cj-programs`.

- [ ] **Step 2: Run the route tests and verify the page is missing**

Run:

```bash
cd assets
bun x vitest run test/routes/ingestion/cj-programs/cj-programs.route.test.tsx test/routes/root-destination-data.test.ts test/routes/root.route.test.tsx
```

Expected: FAIL because the route and components are absent.

- [ ] **Step 3: Implement the restrained page composition**

Use the existing `PageShell`, `WorkspaceLayout`, `ContextRail`,
`SummaryStrip`, `Pagination`, `StatusBadge`, `Button`, tokens, and Radix-backed
`Collapsible`. Use one divided list rather than a card grid:

```tsx
<PageShell
  eyebrow="Ingestion"
  title="CJ programs"
  description="Track each advertiser program from discovery through its application outcome."
>
  <WorkspaceLayout
    label="CJ programs"
    context={<CJProgramControls pagination={pagination} />}
  >
    <CJProgramList data={data} pagination={pagination} />
  </WorkspaceLayout>
</PageShell>
```

The controls form uses `stage` and `sort`, posts to
`/ingestion/cj-programs`, and preserves page sizes but resets the program cursor.

- [ ] **Step 4: Implement row-local lifecycle updates**

Define `CJProgramRow` at module scope. Give each row its own:

```typescript
const [stage, setStage] = useState(program.stage);
const [note, setNote] = useState(program.note ?? "");
const [feedback, setFeedback] = useState("");
const [commitUpdate, isUpdateInFlight] =
  useMutation<UpdateCJProgramMutation>(updateCJProgramMutation);
```

The stage `<select>` contains all seven choices regardless of current stage.
Disable only that row's inputs and save button while pending. On success,
refresh root counts/list data and keep success local; on payload or network
failure, retain the draft and show a row-local error.

- [ ] **Step 5: Load feed details only when expanded**

Inside each row, use `useQueryLoader<CJProgramFeedsQuery>` and call `loadQuery`
when Radix `Collapsible` first opens. Mount a separate Suspense child for
`usePreloadedQuery`; do not define that child inside the row component. Loading
next/first feed pages replaces only that row's feed query reference. Dispose
the query reference on unmount.

- [ ] **Step 6: Render unmatched feeds and replace routing**

Render **Unmatched feeds** after the program connection with its own
`Pagination`. It has no stage control. Add the canonical lazy route and a
legacy loader redirect:

```tsx
{
  path: "ingestion/feed-candidates",
  loader: () => redirect("/ingestion/cj-programs")
}
```

Change the operator destination to
`{label: "CJ programs", to: "/ingestion/cj-programs"}` and update route
metadata and route/root tests.

- [ ] **Step 7: Run frontend focused checks**

Run:

```bash
cd assets
bun x vitest run test/routes/ingestion/cj-programs/cj-program-data.test.ts test/routes/ingestion/cj-programs/cj-programs-loader.test.ts test/routes/ingestion/cj-programs/cj-programs.route.test.tsx test/routes/root-destination-data.test.ts test/routes/root.route.test.tsx
bun run typecheck
bun run relay:check
```

Expected: PASS.

- [ ] **Step 8: Update durable docs and run the verification gates**

Update `ARCHITECTURE.md` with the program/feed ownership boundary. Record the
batch implementation and exact verification in
`docs/work/product-data-scraping.md`; update `docs/plans/INDEX.md`; close or
advance the live queue truthfully without inventing reserve rows.

Run:

```bash
mix format --check-formatted
mix typecheck
mix quality
mix test test/product_compare/repo/migrations/add_cj_program_lifecycle_test.exs test/product_compare/ingestion/cj_programs_test.exs test/product_compare/ingestion/cj_program_warnings_test.exs test/product_compare/ingestion/cj_candidate_freshness_test.exs test/product_compare/ingestion/cj_candidate_market_coverage_test.exs test/mix/tasks/product_compare_ingestion_cj_candidates_test.exs test/mix/tasks/product_compare_ingestion_cj_import_test.exs test/mix/tasks/product_compare_ingestion_cj_readiness_gate_test.exs test/product_compare_web/graphql/cj_program_queries_test.exs test/product_compare_web/graphql/global_id_test.exs test/product_compare_web/graphql/dataloader_batching_test.exs test/product_compare_web/graphql/schema_snapshot_test.exs
mix test --cover
mix frontend_check
mix work_queue.validate
mix ci
git diff --check
```

Expected: formatting, types, quality, focused tests, full coverage, frontend
checks, and diff hygiene exit 0; schema and Relay snapshots are current.
`mix work_queue.validate` and `mix ci` fail only with the exact approved
zero-ready-row message above. The final evidence records both the passing
component gates and that narrow waived failure.

- [ ] **Step 9: Run an anti-slop diff review**

Verify:

- no active production or test reference remains to `review_status`,
  `review_note`, `candidate.reviewed_at`, `shortlisted`, the old route
  components, or the candidate review task, except historical dated
  migrations/plans plus the new backfill migration and its migration test;
- no new module, wrapper, fallback, or guard lacks a reachable responsibility;
- no source-string test was added;
- program and feed counts keep their distinct meanings;
- no program stage can be overwritten by feed discovery; and
- no secret-bearing field entered GraphQL or frontend types.

- [ ] **Step 10: Commit the completed cross-stack outcome**

```bash
git add assets/src/react-relay.d.ts assets/scripts/check-client-bundle.ts assets/src/router.tsx assets/test/router.test.tsx assets/src/routes/root-destination-data.ts assets/src/routes/ingestion/cj-programs assets/src/routes/ingestion/feed-candidates assets/test/routes/root-destination-data.test.ts assets/test/routes/root.route.test.tsx assets/test/routes/ingestion/cj-programs assets/test/routes/ingestion/feed-candidates ARCHITECTURE.md docs/work/index.md docs/work/product-data-scraping.md docs/plans/INDEX.md
git commit -m "feat: add unified CJ programs workspace"
```
