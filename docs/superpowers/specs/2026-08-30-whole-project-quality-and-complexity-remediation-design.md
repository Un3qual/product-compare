# Whole-Project Quality And Complexity Remediation Design

## Status

The direction and scope were approved in chat on 2026-08-30. This written
form is awaiting the required spec review before implementation planning.

## Problem

The repository passes most of its extensive static, unit, build, and bundle
gates, but the whole-project audit found a smaller set of correctness defects,
security-sensitive trust-boundary mistakes, nondeterministic tests, and
unnecessary implementation machinery that the existing gates do not expose.

The backend issues cluster around five boundaries:

- request origin and session-cookie authority;
- PostgreSQL numeric and relationship integrity;
- concurrent and out-of-order ingestion;
- third-party response and operator-command validation; and
- failure reporting that must remain useful without leaking provider data.

The frontend issues are not a general shortage of types. Relay-generated
contracts, route-loader unions, external-input validators, and exhaustive state
models are doing useful work and stay. The needless complexity is narrower:
manual effect-driven pagination around Relay connections, mutation state lifted
far above its owner, a select primitive generic over an unused multiple mode,
an overlarge route-preload descriptor, and partial GraphQL recovery that accepts
more error shapes than its rendering assumptions can safely handle.

This is a correctness-first remediation, not a license for repository-wide
churn. Large files, repeated code, and explicit types change only when there is
a concrete ownership, invariant, or maintenance benefit.

## Audit Baseline

The 2026-08-30 audit established the following baseline before source changes:

- The complete frontend gate passed Relay validation, TypeScript, lint,
  formatting, 1,501 unit tests, client and SSR builds, StyleX validation, and
  the 300 KiB gzip bundle contract.
- Backend static gates passed Credo, the configured three-clone ExDNA budget,
  Reach with its documented baseline, and Dialyzer apart from one ignored
  dependency item.
- The backend test run executed 1,537 tests and exposed two environmental or
  nondeterministic failures. One was shared-test-database contamination from an
  unmerged branch and passed in an isolated test partition. The other was a
  scheduler log-capture race caused by zero-delay work starting before the test
  established its capture boundary.
- The live Hex advisory scan reported 24 advisories in locked dependencies,
  including high-severity advisories in core HTTP and GraphQL dependencies.
  The production pnpm audit reported one high-severity transitive `nanoid`
  advisory through the `@unhead` stack.
- Compatible dependency releases are available for the affected Phoenix,
  Absinthe, Bandit, Ecto, Postgrex, and related packages. The remediation does
  not use a blanket latest-version upgrade.

The contaminated shared database is evidence about test isolation, not a
source defect in the current branch. It will not be reset, dropped, or otherwise
modified destructively as part of this work. Authoritative full backend runs
use a unique `MIX_TEST_PARTITION`.

## Goals

- Derive same-origin trust from configured endpoint authority rather than an
  attacker-controlled request host.
- Reject malformed or non-finite application values before persistence while
  retaining PostgreSQL as final authority.
- Make merchant identity resolution safe under simultaneous first sightings
  and make observation-derived candidates monotonic under out-of-order input.
- Convert malformed provider success payloads and bad operator arguments into
  bounded, diagnosable failures rather than exceptions, silent defaults, or
  data leaks.
- Give each Relay connection and mutation state a clear frontend owner.
- Remove unused generic/type branches and redundant serialized query data while
  preserving generated Relay and external-boundary contracts.
- Make setup, type coverage, and test behavior deterministic enough that the
  normal project gates describe the real supported code.
- Refresh vulnerable dependencies within compatible release lines and prove the
  resulting lockfiles with the repository gates and advisory scanners.

## Non-Goals

- No line-count-only module or test-file splits.
- No generic abstraction invented solely to remove the three intentional ExDNA
  clone groups.
- No broad fixture framework, source analyzer, constraint DSL, or repository
  registry introduced to satisfy tooling.
- No weakening of Relay fragment masking, generated types, route-loader
  discriminated unions, authorization, row locking, external URL validation,
  or database authority.
- No wholesale rewrite of generated Relay test fixtures merely to remove
  pragmatic `$fragmentType` helpers.
- No destructive cleanup of the shared development or test database.
- No service-dependent Playwright execution added to deterministic `mix ci`.
- No across-the-board upgrade to the newest major dependency versions.
- No unrelated product behavior, schema surface, visual redesign, or new
  operator workflow.

## Design Principles

### Preserve real boundaries

Validation remains explicit at network, URL, CLI, browser storage, custom
scalar, authorization, and database boundaries. Inside a boundary already
owned by Relay, Ecto, or a focused domain module, prefer the generated or
inferred contract over parallel handwritten shapes.

### Keep PostgreSQL authoritative

Application validation provides early, predictable errors. Check, foreign-key,
unique, and concurrency constraints remain enforced by PostgreSQL. A workflow
that depends on a preceding read uses one transaction with a suitable lock or
one atomic statement; a lone constrained statement does not gain a ceremonial
transaction.

### Prefer owner-local state

A component or process should own state only for behavior it performs. Relay
connections belong to pagination fragments, affiliate mutation status belongs
to the step that submits it, and route preload identity belongs to the preload
layer. Parent components retain only coordination state genuinely shared by
multiple children.

### Refactor against evidence

Every behavioral correction starts with a focused failing test. Pure
simplifications may use characterization coverage when existing tests already
lock the contract. File size, annotation count, or clone count alone is not
evidence that an abstraction is warranted.

## Outcome 1: Runtime And Database Trust Boundaries

### Configured same-origin authority

`ProductCompareWeb.Plugs.RequireSameOrigin` will build the canonical expected
origin from the endpoint URL configuration, including configured scheme, host,
and effective port. It will not substitute `conn.host` for the configured host.
Explicitly configured trusted origins remain normalized exact origins; they do
not become wildcard host allowances.

Production configuration will require a non-empty, valid `PHX_HOST`. The
session cookie remains host-only by default. A parent-domain cookie is allowed
only through an explicit configuration value whose domain is validated against
the configured application host. This prevents a forged `Host` header and
matching `Origin` from redefining the application's trusted origin and avoids
sharing session authority with sibling subdomains by accident.

Focused plug and runtime-configuration tests will cover the forged-host case,
default and non-default ports, trusted-origin additions, missing production
host, host-only cookies, and any explicit parent-domain opt-in.

### Finite commerce values

Decimal schema fields use one Ecto type that preserves normal decimal casting
while returning cast errors, rather than raising, for non-finite `Decimal`
values. External decimal parsing shares that same finite-value boundary.
PostgreSQL checks reject `NaN`, positive infinity, and negative infinity for
the same columns. Existing non-negative checks retain their lower-bound policy;
signed facts such as `price_delta` gain only a finite-value condition, not an
invented non-negative rule.

The migration, owning changesets, `check_constraint/3` mappings, changeset
tests, and direct SQL tests ship together in accordance with the repository's
database constraint contract. Provider and catalog parsing use the shared
finite-value boundary so an external token cannot reach comparison or changeset
logic in a shape that raises.

### Relationship and GraphQL error contracts

`Product`, `ProductTaxon`, and `CommunityReport` changesets will map the foreign
keys they cast with `foreign_key_constraint/3`. They will not add preflight
existence queries. A missing relationship therefore remains
database-authoritative and returns a changeset error rather than raising an
unmapped constraint exception.

GraphQL mutation error fields derived from changesets will use the schema's
camelCase field convention. Read-side or internal errors that do not represent
input fields remain unchanged.

Community write receipt and write-window storage tests will directly exercise
the existing digest, key, count, and temporal constraints, including malformed
digests and direct database bypasses. This adds missing boundary evidence
without creating a generic constraint inventory.

## Outcome 2: Ingestion Concurrency And Observation Ordering

### First-sighting merchant identity serialization

Merchant identity resolution will serialize the first-sighting path by the
logical key `{source_id, merchant_identifier}` inside the existing transaction.
A transaction-scoped PostgreSQL advisory lock will be derived deterministically
from that key. After acquiring it, resolution re-reads the identity before
creating or retargeting a merchant.

The lock protects the dependent lookup, merchant upsert, and source-identity
write as one decision. Existing uniqueness constraints remain the final
authority. Concurrent callers for the same logical identity converge on one
identity and do not leave an otherwise unreferenced merchant created by the
losing path. Different identity keys remain independently executable.

A deterministic concurrency test will hold the first transaction at a barrier
and prove that the second same-key resolution waits and converges. The test will
also assert the absence of an orphan merchant. No process sleeps or probabilistic
timing assertions will be used as the synchronization mechanism.

### Monotonic observation-derived candidates

Product-media and category-mapping candidate conflict updates will include the
stored observation timestamp in their conflict predicate. An older observation
may contribute only behavior explicitly defined as monotonic, such as a bounded
counter if that counter is intentionally arrival-based; it may not replace the
current URL, category, source fact, or last-seen timestamp with older evidence.

Equal-timestamp behavior will be deterministic and documented by the existing
identity/tie-breaking contract. Focused tests will apply newer-then-older
observations from different sources and prove the persisted candidate does not
regress.

### CJ response-shape validation

A successful HTTP status is not sufficient evidence of a valid CJ product
response. The adapter will validate that `resultList` is a list and that
pagination/count fields are integers in the accepted domain before the importer
iterates or performs arithmetic. Null, missing, string, fractional, negative,
or otherwise malformed success fields return a tagged provider-response error.

The error retains a stable internal category for logs and operator reporting
without exposing the raw body or headers. Valid empty lists remain valid empty
results.

## Outcome 3: Operator Command Safety And Diagnostics

### Validate before application startup

The product-attribute backfill validation task will parse and validate all
arguments before starting repository services. Its dry-run path will use the
existing repo-only startup boundary and will not boot the full supervision tree
or Oban.

CJ feed, credential, and related ingestion tasks will use the existing focused
CLI option parser. Duplicate options, missing required values, unknown options,
and out-of-range numeric values fail with concise usage errors. Invalid input
must not silently fall back to a default or be discarded by map construction.

### Sanitized failure reporting

CJ task and resume boundaries will share the existing runner's failure
categorization and sanitization policy rather than formatting arbitrary terms.
Operator output and logs may include the operation, stable category, safe
identifiers, and sanitized stacktrace location. They must not inspect or print
provider bodies, authorization headers, credentials, exception arguments, or
arbitrary nested reasons.

Unexpected exceptions still preserve enough category and stacktrace context to
debug the owning code. Expected provider and validation failures remain tagged
return values and do not become crashes solely to gain a stacktrace.

## Outcome 4: Frontend Correctness And Simplification

### Narrow product-detail partial recovery

Product-detail partial recovery will activate only for GraphQL errors whose
path begins at `product.merchantProducts`, the optional region the page can
truthfully omit. Recovery also requires the minimum product and SEO projection
used by the successful renderer. Errors in product identity, metadata, SEO,
specifications, community, or any unrelated nested field return the normal
error state rather than caching and dereferencing an unsafe partial object.

Focused loader tests will cover the accepted merchant-offer partial case and
rejection of unrelated nested errors, missing SEO, and malformed product
objects.

### Relay-native connection ownership

Manual effect-driven accumulation in product reviews, product questions,
question answers, the compare picker, and share-comparison selection will be
replaced with Relay connection ownership. Each independently paginated region
will use a focused `@refetchable` fragment with `@connection` and
`usePaginationFragment`.

Where one parent currently owns multiple independently paginated lists, the
connection fragment and pagination state move into the child that renders that
list. The parent retains only product identity and cross-region coordination.
Navigation, loading indicators, error isolation, existing page sizes, and
visible ordering remain unchanged. This work must not create a generic
pagination hook around Relay.

### Affiliate mutation colocation

`AffiliateSetupPanel` will retain shared sequence data such as the selected
network, program, and merchant identifiers. Network, program, merchant-link,
and coupon steps will each own the mutation handle, pending state, result, and
error for the action they submit. Existing step components or small focused
step owners receive this state directly; a generic mutation-state abstraction
is out of scope.

The result should remove the parent component's large bundle of unrelated
state and refs without hiding the guided workflow or changing mutation
variables, authorization, pagination, or one-time result behavior.

### Single-select primitive contract

All current `Select` consumers are single-select. The shared primitive will
therefore expose `SelectRootProps<Value, false>` rather than a second generic
for an unused multiple mode. The array reset branch, multiple-value assertion,
`multiple` plumbing, and array-specific trigger formatting will be removed.

Form reset behavior, controlled and uncontrolled modes, refs, accessibility,
and current call-site inference remain supported. This is a YAGNI reduction,
not a replacement select API.

### Compact route preload descriptors

React Router loader data will no longer serialize the complete GraphQL
operation text for every preloaded route query. The descriptor will carry the
generated request's stable `cacheID`, operation name for diagnostics, and
variables. The operation name is not a weaker identity fallback. The actual
generated operation remains a local module dependency supplied to
`getRoutePreloadedQuery`.

Descriptor identity stays variable-order-independent and distinguishes
different generated operations. SSR hydration, store-only query creation,
lease disposal, bounded cache eviction, and route remount keys retain their
current behavior. If a generated request lacks a stable cache identifier, the
preload boundary will fail explicitly in development/test rather than silently
restoring the full operation text to loader data.

The pure `SnapshotControlView` pass-through component will be folded into its
real sharing owner only if the pagination/state changes make that deletion
local and behavior-preserving. It is not a standalone refactor target.

## Outcome 5: Deterministic Tooling And Dependency Health

### Frontend type and development setup coverage

The main frontend TypeScript project will include `assets/tests/e2e` and the
Node/Playwright environment required by those files. Existing E2E diagnostics
will be fixed rather than hidden in a second permissive TypeScript project.
Playwright execution remains a separate service-backed gate; the normal
typecheck covers its source without requiring a running browser or server.

`mix setup` will perform a frozen pnpm install in `assets` after backend
dependencies are available. The canonical Phoenix development command will
start the Vite development server through an endpoint watcher, with ports and
shutdown behavior matching the existing frontend configuration. README setup
and development instructions will describe that single supported path.

### Deterministic tests and toolchain contracts

The CJ product import scheduler test will establish log capture before the
zero-delay GenServer can emit its warning, or will trigger the first tick under
explicit test control. Production scheduling semantics remain unchanged.

Database assertion helpers that currently spin until a fixed two-second
deadline will use one bounded polling helper with a short backoff and a failure
message that identifies the unmet database state. The helper will not replace
proper synchronization in concurrency tests.

Toolchain contract tests will compare the actual `.mise.toml` Node and pnpm
pins with `package.json` engines/package-manager values. Presence-only checks
are insufficient. Existing source-level policy tests for architectural
contracts remain; they are not replaced with a new AST or meta-analysis system.

### Compatible dependency refresh

Backend packages will be updated within the existing declared compatibility
lines far enough to consume the applicable security fixes, with direct
dependency constraints narrowed only when the current range permits a known
vulnerable release. Frontend resolution will move the transitive `nanoid`
version to a fixed release through the smallest supported parent update or a
documented package-manager override if no compatible parent release resolves
it.

Every dependency change must pass compilation, focused behavior tests, the
complete isolated project gate, `mix hex.audit`, and `pnpm audit --prod`.
Unrelated major upgrades, feature adoption, and lockfile churn are excluded.
If a current compatible line has no fixed release, record that exact blocker
instead of masking the advisory.

## Outcome 6: Ecto Query Ownership And Native SQL Boundaries

### Prefer Ecto expressions for ordinary query semantics

Application queries will use Ecto's typed values, `coalesce/2`, `exists/1`,
null-ordering modes, enum-aware schema fields, date casts, filtered aggregates,
and ordinary boolean expressions wherever those APIs express the contract
directly. Fragments will not reimplement those built-ins or hide report
classification rules inside multiline SQL `CASE` expressions.

Read models that currently use schemaless tables solely to work around enum
typing will use their existing Ecto schemas and normalize presentation values
in Elixir. Aggregate reports will keep filtering and counting in PostgreSQL,
while mapping database values to public bucket names remains ordinary Elixir
code.

### Keep unsupported PostgreSQL behavior narrow and explicit

Fragments remain appropriate for PostgreSQL capabilities Ecto does not model,
including full-text/trigram operators, `NULLIF` plus trimming/normalization,
custom `tsvector` builders, conditional conflict access to `EXCLUDED`, and
database-specific aggregate functions. Those fragments will contain only the
unsupported expression; surrounding filters, updates, parameters, and result
handling stay in Ecto.

Hand-built application `UPDATE` strings will move to `Repo.update_all/3` when
Ecto can own the target set and bind parameters. Transaction-scoped advisory
locks have no Ecto query API, so their one PostgreSQL statement will be
centralized behind a focused database-lock boundary and reused by all domain
callers. Table locks, migration DDL, and direct database-contract tests remain
explicit SQL because pretending they are portable Ecto would obscure their
purpose.

### Preserve concurrency and query-shape contracts

Observation-ordering upserts remain one atomic database decision. A conflict
query may replace repeated `CASE` fragments with an Ecto conflict predicate
when no arrival counter or other always-updated field requires the rejected row
to execute. It must not split one atomic invariant into a read followed by an
unlocked write merely to eliminate SQL text.

This outcome is behavior-preserving. Existing ordering, pagination, aggregate,
query-budget, stale-write, and concurrency tests are the characterization
boundary. A refactor that requires loading an unbounded result set into Elixir,
adds a query waterfall, or produces a less legible emulation of a native
PostgreSQL primitive is rejected.

## Delivery And Queue Strategy

The work will be planned and dispatched as independently reviewable outcomes,
not per-file cleanup tickets:

1. runtime and database trust boundaries;
2. ingestion concurrency and observation ordering;
3. operator command safety and diagnostics;
4. frontend correctness and simplification; and
5. deterministic tooling and compatible dependency health; and
6. Ecto query ownership and native SQL boundaries.

Each outcome receives its own implementation plan and queue row because its
rollback boundary, verification focus, and reviewer decision differ. Internal
path-disjoint slices stay inside the outcome plan. The sixth outcome was added
as an explicitly approved follow-up while the fifth was active; the coordinator
records both active outcomes and retains the truthful ready-floor exception
instead of inventing filler.

Execution follows RED/GREEN/refactor cycles, updates the relevant lane evidence
with each milestone, and commits code, tests, generated artifacts, migrations,
and status evidence together. Queue-only checkboxes or progress narration do
not receive standalone commits.

## Verification Strategy

Each outcome runs the narrowest focused tests that prove its contracts before
the repository-wide gate. Final verification requires:

- `mix format --check-formatted`;
- focused backend tests under a unique `MIX_TEST_PARTITION`;
- `mix ci` under the same isolated partition;
- `cd assets && pnpm run check`;
- targeted Playwright coverage for changed browser flows with an isolated port;
- `mix hex.audit`;
- `cd assets && pnpm audit --prod`;
- `git diff --check`;
- review of generated migrations, Relay artifacts, and lockfile changes; and
- a clean branch working tree.

The shared default test database is not authoritative for this branch because
the audit proved it contains an unmerged table. A failure reproduced in the
isolated partition is a branch defect and must be fixed. A failure unique to
the contaminated shared database is reported separately and does not authorize
destructive cleanup.

## Completion Criteria

The program is complete when all six outcomes are implemented and reviewed;
focused RED/GREEN evidence exists for behavioral corrections; frontend state
and typing are simpler without weakening real boundaries; vulnerable
dependencies are fixed or have an exact documented incompatible-line blocker;
ordinary query semantics use Ecto while unavoidable PostgreSQL primitives stay
narrow and explicit;
the complete isolated backend and frontend gates pass; advisory scanners have
no applicable known production vulnerability left unresolved unless the
compatible dependency line has no fixed release and the exact blocker is
documented; and the live queue and lane documents truthfully record completion
and remaining work.
