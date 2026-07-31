# Concurrency-Safe Writes

## Snapshot

- Status: complete
- Priority: P1
- Source of truth:
  `docs/superpowers/plans/2026-07-30-concurrency-safe-write-audit-implementation-plan.md`
- Last verified: 2026-07-30 against the repository write surface at that checkpoint.
- Last reconciled: 2026-07-31 for the removed reputation-event API.

## Target Outcome

Every first-party modifying action has an explicit atomicity mechanism, and
every confirmed read-modify-write race is fixed at the database boundary with
a deterministic concurrency regression.

## Audit Result

The audit traced every first-party context action that inserts, updates,
deletes, or validates mutable relational state before a dependent write. The
inventory below has no unclassified modifying action and no remaining unsafe
read-modify-write path.

Classification terms:

- **statement**: one conditional SQL statement or conflict clause owns the
  concurrent decision;
- **constraint**: a foreign key, unique/check constraint, or trigger makes the
  invariant durable;
- **lock**: a transaction reloads every mutable decision row with a row or
  transaction-scoped advisory lock before writing;
- **stale**: optimistic locking or a compare-and-update predicate rejects an
  intervening write;
- **snapshot**: all facts are captured from one repeatable database snapshot;
- **append-only**: the action records an immutable event/fact and does not
  modify earlier truth; and
- **partial last-write**: one-row presentation/content fields have no derived
  invariant, and Ecto updates only the fields present in the changeset.

## Confirmed Findings And Fixes

| Invariant | Unsafe former behavior | Database-owned fix | Regression evidence |
| --- | --- | --- | --- |
| API-token lifecycle | Revoke/rotate authenticated a stale token struct; authentication could touch a token revoked after its read. | Token transitions reload under `FOR UPDATE`; authentication touches only an active, unexpired row. | `concurrency_safe_transitions_test.exs`; commits `7800e438`, `75c44be3`. |
| First-writer lifecycle timestamps | Alert reads, comparison revocation, and claim moderation could overwrite a committed transition. | Each transition locks and rechecks the current row before updating. | `concurrency_safe_transitions_test.exs`; commit `7800e438`. |
| Moderation authorization | Operator access could be revoked after authorization but before the moderation write. | The user authorization row is locked and rechecked in the moderation transaction. | `concurrency_safe_transitions_test.exs`; commit `138ff479`. |
| Delivered email-token replacement | A delivery callback ran inside the transaction, and concurrent deliveries could leave multiple active replacement tokens. | Delivery runs outside locks; activation locks the user and deletes competing context tokens atomically. | `concurrency_safe_transitions_test.exs`; commit `138ff479`. |
| Product slug namespace | Product slugs and historical aliases used separate unique indexes, allowing cross-table collisions. | A trigger-maintained namespace relation owns both forms; product updates reload under lock and preserve the public conflict result. | Product slug namespace and stale-update regressions; commits `ed8c57fa`, `0aad4352`. |
| Taxonomy hierarchy | Cross-moves could both pass a stale cycle check, and a taxon could change taxonomy identity. | Taxonomy and involved taxons are locked in deterministic order; taxonomy identity is immutable. | `concurrency_safe_transitions_test.exs`; commit `49478b4a`. |
| Provider enrichment | Missing-field and category-alias validation could be invalidated before the product write. | Product and alias decision rows are locked and all decisions are recomputed inside the transaction. | `concurrency_safe_transitions_test.exs`; commit `f9396d41`. |
| Comparison publication | Products, attributes, offers, and prices could be read from different committed database states. | Publication requires one repeatable-read or serializable snapshot, including nested callers. | Mixed-fact publication regression; commit `49149b1f`. |
| Import completion | Concurrent success/failure completions could both derive from `running` and overwrite one another. | Completion locks and reloads the import run; the first terminal result wins and replay is idempotent. | `concurrency_safe_transitions_test.exs`; commit `b04362cd`. |
| Imported current claim | Two eligible imports could both mark their own claim accepted although only one became current. | Current-row insertion chooses the winner atomically; only that claim is promoted. | `concurrency_safe_transitions_test.exs`; commit `b69422a9`. |
| Merchant-offer identity | Upsert could retarget one merchant URL to another product or currency, reinterpreting alerts, clicks, conversions, and price history. | Conditional conflict updates preserve product/currency; a database trigger makes merchant, product, URL, and currency immutable. | Pricing and ingestion identity regressions; commit `35bfd388`. |
| Specification value semantics | Attribute type/dimension and unit conversion factors could change after typed-value validation, invalidating stored base values and claims. | Conditional upserts reject semantic conflicts; triggers make attribute and unit value semantics immutable while presentation metadata remains editable. | `definition_semantics_test.exs`; commit `64bd3848`. |

## Complete Modifying-Action Inventory

| Context owner | Modifying action(s) | Protected invariant | Atomicity mechanism and classification |
| --- | --- | --- | --- |
| `Accounts.ApiTokens.Authentication` | `authenticate/2` touch | A revoked or expired token is never returned after the dependent touch. | Conditional active-row `UPDATE`; **statement**. |
| `Accounts.ApiTokens.Lifecycle` | `create/2`, `revoke/2`, `rotate/3` | Token issue is append-only; revoke/rotate consume the current active state once. | Unique token hash plus locked reload for transitions; **constraint + lock**. |
| `Accounts.Users` | `create_user/1`, `register_user/1`, `bootstrap_operator_user/3`, `ensure_user_with_password/2`, `set_operator_access/2` | Email identity is unique; bootstrap/password repair cannot overwrite a concurrent user; operator writes are serialized with moderation checks. | Email unique constraint, user-row locks, conflict insert, and partial one-field update; **constraint + lock + partial last-write**. |
| `Accounts.Reputation` | `upsert_user_reputation/2` | One absolute reputation summary exists per user. | `ON CONFLICT` absolute set; **statement**. |
| `Accounts.UserAuth.Sessions` | issue/generate, activate, delete/discard, and clear token actions | Session issue uses the authenticated password state; one delivered context token becomes active; token deletion is idempotent. | User-row lock, token uniqueness, and predicate `DELETE`; **lock + statement**. |
| `Accounts.UserAuth.EmailTokens` | deliver confirmation/reset, `confirm_user/1`, `reset_user_password/2` | One token is consumed once and password/session changes share that consumption. | Token/user locking, delete-and-update transaction, and atomic context clearing; **lock**. |
| `Affiliate` | `upsert_network/1`, `upsert_program/1`, `upsert_link/1`, `create_coupon/1` | Network/program/link identities converge; coupons are independent records. | Unique conflict targets and single conflict updates; **statement + constraint**. |
| `Alerts.WatchRules` | `create_watch/2`, `update_watch/3`, `delete_watch/2` | Watch scope references one stable product/currency offer; evaluation state resets with rule edits. | Product FK plus immutable offer identity; partial update/reset statement and stale-aware delete; **constraint + partial last-write**. |
| `Alerts.Evaluation` | `evaluate_price_point/2` | Cooldown/condition decisions and event creation use one current watch state; a price point emits at most one event per watch. | Watch-row lock and unique `(watch_rule_id, triggering_price_point_id)` insert; **lock + constraint**. |
| `Alerts.Inbox` | `mark_alert_read/2` | The first committed read timestamp is preserved. | Locked reload and idempotent transition; **lock**. |
| `Catalog.Evidence` | `create_product_identifier/1`, `upsert_product_media/4` | A validated identifier has one product owner; one media URL row exists per product. | Validated identifier and product/media unique indexes; media conflict update is one statement; **constraint + statement**. |
| `Catalog.Products` | `create_brand/1`, `upsert_brand/1`, `create_product/1`, `update_product/2` | Brand name converges; product type belongs to the type taxonomy; canonical and historical slugs share one namespace. | Conflict upsert, FK/immutable taxonomy identity, locked product reload, and slug-namespace trigger; **statement + lock + constraint**. |
| `Catalog.SavedComparisons` | create and delete saved comparison sets | Items commit with their set, reference existing products, preserve order, and owner deletion is idempotent. | `Ecto.Multi`, product FKs, per-set uniqueness, and stale-normalized delete; **constraint + stale**. |
| `Pricing.Merchants` | `upsert_merchant/1` | Name- and domain-based imports converge without duplicate identities. | Name/domain unique constraints and savepoint-backed conflict upserts; **statement + constraint**. |
| `Pricing.Offers` | `upsert_merchant_product/1` | Merchant/product/URL/currency identity never changes while mutable availability metadata can update. | Conditional conflict query plus immutable-identity trigger; **statement + constraint**. |
| `Pricing.PriceHistory` | `add_price_point/1` | A price fact and its evaluation job commit together. | Insert plus job enqueue in one transaction; facts are **append-only**. |
| `CommerceAttribution.Clicks.Links` | link `upsert/1` | Destination/program/merchant/type identity converges while campaign metadata may refresh. | Expression unique target with conflict update; **statement + constraint**. |
| `CommerceAttribution.Clicks.Sessions` | `create/1`, `track_outbound/1` | A tracked session refers to the resolved immutable destination and offer identity. | Link upsert and click insert share one transaction; session is **append-only**. |
| `CommerceAttribution.Conversions` | `ingest/1` including attribution resolution | A provider conversion is unique, newer reports win, and click-derived dimensions cannot be contradicted. | Existing conversion is locked, related identities are immutable, and conflict update is conditional on `reported_at`; **lock + statement + constraint**. |
| `CommerceAttribution.Conversions.PurchaseFacts` | `create/1` | Purchase-price evidence never rewrites a previous fact. | FK-backed immutable insert; **append-only**. |
| `ComparisonSnapshots.Lifecycle` | `publish/3`, `revoke/3` | All captured facts share one committed view; revocation is first-writer/idempotent. | Repeatable-read transaction and locked revocation; **snapshot + lock**. |
| `Discussions.ContentLifecycle` | create/update/delete thread, post, and review actions | Ownership/product/thread identity is immutable; parent changes remain acyclic and same-thread; verified purchase cannot be client-written. | Insert FKs, immutable changeset fields, thread lock for parent-graph changes, review locked reload, and partial content updates; **constraint + lock + partial last-write**. |
| `Discussions.Moderation` | `accept_answer/3`, `moderate/5` | Accepted answers belong to the locked question; operator authorization and content lifecycle are current. | User, question, answer, and content rows are locked in the transaction; **lock**. |
| `Discussions.Submissions.Creates` | `submit_review/4`, `ask_question/4`, `answer_question/4` | Idempotency keys replay one payload only, rate limits are atomic, and answers require a currently public question. | Transaction advisory key lock, unique receipt, locked question, and locked write window; **lock + constraint**. |
| `Discussions.Submissions.OwnerActions` | owner `update/4`, `remove/3` | Current ownership/lifecycle authorizes the write; accepted-answer links are cleared with answer changes. | Content/question/answer locked reloads and one transaction; **lock**. |
| `Discussions.Submissions.Reports` | report `create/4` | A user reports a target once and duplicate attempts do not consume quota. | Target FK and unique report constraint inside the write-limit transaction; **constraint + lock**. |
| `Discussions.Submissions.WriteLimits` | `increment!/2` | Concurrent writes cannot exceed a per-user/action/hour limit. | Conflict-created window followed by `FOR UPDATE` increment; **lock + constraint**. |
| `Ingestion.FeedCandidates` | `upsert_merchant_feed_candidate/2` | Candidate provider agrees with its source and feed type; source/feed identity converges. | Source row lock through provider reconciliation plus unique conflict upsert; **lock + statement**. |
| `Ingestion.CJPrograms` | ensure and lifecycle update actions | Source/advertiser identity converges and stale lifecycle editors cannot overwrite a newer decision. | Unique conflict insert and `changed_at` optimistic lock/conditional no-op; **constraint + stale**. |
| `Ingestion.Runs` | `start_import_run/1`, `complete_import_run/2` | Provider agrees with the source; exactly one terminal completion and reconciliation outcome wins. | Source lock on start and import-run lock on completion; **lock**. |
| `Ingestion.SourceProviders` | `ensure_in_transaction/2` | A source acquires at most one provider identity and callers observe it before dependent writes. | Required transaction plus source-row `FOR UPDATE`; **lock**. |
| `Ingestion.Sources.CJ.SourceResolver` | `fetch_source/0` | The canonical CJ source converges and has the CJ provider/domain. | Unique conflict insert, source lock, and same transaction update; **lock + constraint**. |
| `Ingestion.MerchantIdentities` | `resolve/2`, `resolve_in_transaction/2` | Source merchant identity follows only an equal/newer observation and merchant retarget commits with it. | Freshness-predicate `UPDATE` retains the row lock through retarget; unique conflict insert handles creation; **statement + lock**. |
| `Ingestion.ListingPersistence.Artifacts` | source artifact/external product upserts and attachment | Artifacts deduplicate by content; older observations cannot change external-product identity or attachment. | Partial unique artifact index and freshness-predicate conflict/update statements; **constraint + statement**. |
| `Ingestion.ListingPersistence.Products` | `ensure_product/3` | Existing source identity remains bound; validated GTIN has one owner; concurrent shells converge. | External-product serialization, validated-GTIN unique index, slug namespace constraint, and loser cleanup in the outer transaction; **constraint + lock**. |
| `Ingestion.ListingPersistence.Enrichment` | product enrichment, category mapping, media/spec evidence | Provider values fill only fields still missing; curated type and current alias mapping win. | Locked product reload, shared alias lock, atomic candidate increment/upsert, and downstream constrained inserts; **lock + statement**. |
| `Ingestion.ListingPersistence.Offers` | `persist_offer/4` | Older observations cannot change offer state; offer identity is immutable; price artifacts deduplicate. | Freshness-predicate offer upsert, identity trigger, and partial unique price-point insert; **statement + constraint**. |
| `Ingestion.ListingPersistence` | `persist/3` orchestration | Merchant, artifact, product, enrichment, offer, price, and reconciliation observation commit as one listing result. | One encompassing transaction; component mechanisms above retain their locks until commit; **lock + constraint**. |
| `Ingestion.Reconciliation` | `observe/2`, `finalize/1` | One observation exists per run/external product; complete scopes reconcile serially and older runs cannot supersede newer success. | Unique observation conflict and scope-key advisory transaction lock; **constraint + lock**. |
| `Specs.Definitions` | upsert dimension, unit, enum set/option, and attribute | Controlled identities converge; unit conversion and attribute typed-value semantics never change after creation. | Unique conflict upserts, semantic conflict predicates, and database immutability triggers; **statement + constraint**. |
| `Specs.Claims.Proposals` | `propose/4` | Typed values match stable attribute/unit/enum semantics and evidence commits with the claim. | Immutable definition semantics, FKs, and claim/evidence transaction; **constraint**. |
| `Specs.Claims.Imports` | `import_observation/4` | Replays deduplicate; evidence commits; only the claim that creates current truth is auto-accepted. | Fingerprint unique insert, evidence conflict insert, and unique current-row insert in one transaction; **constraint + statement**. |
| `Specs.Claims.Moderation` | accept/reject/select current actions | One lifecycle transition uses current status; selected claim is accepted and matches product/attribute. | Claim/current row locks and current-row conflict update; **lock + constraint**. |
| `Specs.Corrections` | `propose_correction/5`, `moderate_correction/4` | Proposal records the observed current claim; acceptance fails if current truth changed and moves claim/current/correction together. | Correction/claim/current row locks, supersedes comparison, and one transaction; **lock**. |
| `Taxonomy.Taxonomies` | seed/upsert taxonomy | Taxonomy code identity converges. | Unique code conflict update; **statement + constraint**. |
| `Taxonomy.Hierarchy` | create/update/move taxon | Taxonomy identity is fixed; closure rows match one acyclic parent graph under concurrent moves. | Taxonomy/taxon deterministic locks, immutable taxonomy field, and transactional closure rebuild; **lock + constraint**. |
| `Taxonomy.Aliases` | `upsert_taxon_alias/2` and write resolution | Alias identity converges; enrichment uses the mapping current at its dependent product write. | Unique normalized path upsert and `FOR SHARE` alias read retained by the outer transaction; **statement + lock**. |
| `Taxonomy.Assignments` | assign/unassign use case | Assignment taxon belongs to the use-case taxonomy and duplicate assignments converge. | Immutable taxon taxonomy identity, FK, conflict replace, and predicate delete; **constraint + statement**. |

## Boundaries

- Audit all first-party modifying actions, not only files containing an
  explicit `Repo.update/2`.
- Do not add blanket locks, table locks, or a generic transaction framework.
- Do not count read-only queries as findings.
- Use deterministic process coordination in concurrency tests; avoid
  sleep-based races.
- Keep external calls and expensive pure computation outside locked
  transactions.

## Next Action

None. The audit exit condition is satisfied and the active queue row is
closed.

## Verification

- `MIX_ENV=test mix ecto.reset` rebuilt the database through all migrations,
  including the slug namespace, merchant-offer identity, and specification
  semantics triggers.
- `mix test test/product_compare/concurrency_safe_transitions_test.exs` passed
  ten times with seeds `101`, `211`, `307`, `401`, `503`, `601`, `709`, `809`,
  `907`, and `1009`: 130 coordinated concurrency tests, 0 failures.
- The focused specification/ingestion run passed 90 tests; definition
  semantics passed 32 focused tests; both scheduler suites passed 21 tests.
- The final full `mix test` run passed 1,008 tests with 0 failures.
- `mix typecheck` passed.
- `mix quality` passed: Credo found no issues, ExDNA stayed within its 3/3
  baseline clone budget, the cross-function smell detector found no issues,
  and Dialyzer reported 0 errors.
- `mix work_queue.validate` passed with 3 ready rows.
- `mix format --check-formatted` and `git diff --check` passed.

## Blocker Rule

Stop and record a blocker if an invariant depends on an external system that
cannot participate in the database transaction, or if the correct conflict
semantics would change a public product decision that the user has not made.
