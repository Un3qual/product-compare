# Community Content Lifecycle

## Snapshot

- Status: complete
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Design: `docs/superpowers/specs/2026-07-20-cross-stack-ready-work-design.md`
- Plan: `docs/superpowers/plans/2026-07-20-community-content-lifecycle-implementation-plan.md`
- Last verified: 2026-07-20 against discussion schemas/context, GraphQL
  mutations, the product-community Relay surface, and focused tests.

## Batch Outcome

Authenticated reviews, questions, and answers have a complete owner-controlled,
abuse-resistant lifecycle from durable backend policy through typed GraphQL and
accessible Relay controls.

## Ready Evidence

- The accepted community design requires owner update/delete, per-user rate
  limits, and duplicate-submission idempotency.
- Current GraphQL supports create, accept, report, and operator moderation but
  exposes no owner update/remove mutations.
- Current schemas support pending/published/hidden/rejected, but not retained
  owner removal.
- Current context and tests contain no per-user write limiter or general create
  idempotency receipt.
- The approved 2026-07-20 policy fixes exact limits, idempotency behavior,
  edit-to-pending rules, and accepted-answer cleanup, so no decision remains.

## Internal Slices

1. Migration and durable write receipts/windows.
2. Owner lifecycle, idempotency, and rate-limit context policy.
3. Typed GraphQL mutations, errors, capabilities, and schema snapshot.
4. Relay idempotency and owner controls.

## Boundaries

- Public review/question/answer connections remain published-only and author
  identity stays private. A bounded viewer-scoped product field may return the
  current owner's non-public submissions for lifecycle management, including a
  published answer made inaccessible because its parent question is no longer
  public.
- Relay clients supply idempotency keys so transport retries replay safely, but
  the public GraphQL create inputs keep the key optional for backward
  compatibility and generate a one-use server key when an older caller omits it.
- Removal retains audit/moderation state and is never rate-limited.
- Browser writes remain GraphQL over `/api/graphql`.
- Keep moderation operations operator-only and keep raw receipt/counter data
  private.

## Verification

- All discussion context and community GraphQL tests.
- Schema snapshot and Relay generation/validation.
- Community route-data and panel Vitest suites.
- `cd assets && bun run check`
- `mix typecheck`
- `mix format --check-formatted`
- `mix ci`
- `git diff --check`

## Implementation Evidence

- Durable-control RED: the focused schema test initially failed to compile
  because receipt/window persistence did not exist. After the migration and
  schemas landed, the focused migration coverage passed 7 tests.
- Context RED: the lifecycle suite reported 6 failures across 13 tests while
  owner APIs and rate policy were absent. All discussion context coverage then
  passed 25 tests, including idempotent replay/conflict, exact hourly limits,
  edit-to-pending, retained removal, and accepted-answer cleanup.
- GraphQL RED: the community plus schema-snapshot run reported 7 failures across
  9 tests before lifecycle inputs, mutations, errors, and viewer capabilities
  existed. The same run passed all 9 tests after schema generation.
- Relay/UI RED: the route-data suite reported 6 failures across 31 tests for
  missing idempotency and lifecycle outcomes; the panel suite then failed at
  the absent owner-mutation documents. Both focused suites now pass 36 tests,
  covering transport retry key reuse, terminal key replacement, capability-
  gated controls, edit-to-pending copy, confirmed removal, and row-local typed
  failures.
- The combined discussion and community GraphQL gate passes 34 tests. The full
  frontend gate passes Relay validation, TypeScript, 1,470 tests, client/SSR
  builds, and the 182,120-byte gzip bundle contract.
- The full `mix ci` gate passes queue validation with 7 ready rows, formatting,
  compilation, Credo, the 6/6 clone budget, strict smell analysis, Dialyzer,
  788 backend tests at 83.43% coverage, and the complete frontend gate.
- PR review follow-through added the missing owner path for pending, hidden,
  and rejected submissions while keeping anonymous and public connections
  published-only. Public rows now disappear immediately after edit-to-pending,
  and answer idempotency replays before parent-visibility checks while new
  answers still lock and require a published question.
- Follow-up review coverage keeps published answers manageable when their parent
  question becomes non-public, clears an accepted answer when the question is
  edited for resubmission, and preserves pre-idempotency GraphQL client
  compatibility without weakening explicit-key replay guarantees.
