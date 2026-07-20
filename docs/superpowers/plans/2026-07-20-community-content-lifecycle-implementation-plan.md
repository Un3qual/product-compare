# Community Content Lifecycle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete authenticated review and Q&A ownership, moderation,
idempotency, rate-limit, GraphQL, and frontend lifecycle contracts.

**Architecture:** PostgreSQL owns durable write receipts and UTC-hour counters.
The Discussions context performs owner checks and lifecycle transitions inside
transactions. Absinthe exposes typed mutations and viewer capabilities; Relay
drives owner controls and retains one UUID across transport retries.

**Tech Stack:** Elixir, Ecto, PostgreSQL, Absinthe GraphQL, React 19, Relay 20,
TypeScript, ExUnit, Vitest.

## Global Constraints

- Public reads continue returning only `published` content.
- Removal is a retained `removed` moderation state, never a hard delete.
- Create idempotency keys are 16-128 printable ASCII characters.
- Default UTC-hour limits are 5 review creates/updates, 10 question
  creates/updates, 30 answer creates/updates, and 30 reports per user.
- Removal is not rate-limited; rejected writes and idempotent replay do not
  consume another unit.
- Browser mutations remain GraphQL over `/api/graphql` and return typed payload
  errors.
- Use behavior tests and verify RED before production changes.

---

### Task 1: Durable Community Write Controls

**Files:**

- Create: `priv/repo/migrations/20260720120000_add_community_write_controls.exs`
- Create: `lib/product_compare_schemas/discussions/community_write_receipt.ex`
- Create: `lib/product_compare_schemas/discussions/community_write_window.ex`
- Modify: `lib/product_compare_schemas/discussions/product_review.ex`
- Modify: `lib/product_compare_schemas/discussions/product_thread.ex`
- Modify: `lib/product_compare_schemas/discussions/thread_post.ex`
- Modify: `test/product_compare/discussions/community_trust_test.exs`

**Interfaces:**

```elixir
CommunityWriteReceipt
|> unique_constraint([:user_id, :mutation_kind, :idempotency_key])

CommunityWriteWindow
|> unique_constraint([:user_id, :action_kind, :window_started_at])
```

Receipts store `payload_digest`, `content_type`, and `content_entropy_id`.
Windows store the UTC-hour start and committed count. All three content schemas
accept `:removed` as a moderation status, while operator publication targets
remain `published`, `hidden`, or `rejected`.

- [ ] Add failing schema/context tests for the removed state, receipt uniqueness,
  hourly-window uniqueness, and database constraints.
- [ ] Run `mix test test/product_compare/discussions/community_trust_test.exs`
  and confirm the new tables and status are absent.
- [ ] Create the migration, schemas, indexes, and check-constraint replacement;
  keep receipt keys and payload digests out of public GraphQL objects.
- [ ] Run `mix ecto.migrate` in test and re-run the focused context file.
- [ ] Commit migration, schemas, and tests with message
  `feat: add durable community write controls`.

### Task 2: Owner Lifecycle, Idempotency, And Limits

**Files:**

- Modify: `lib/product_compare/discussions.ex`
- Modify: `config/config.exs`
- Modify: `config/test.exs`
- Modify: `test/product_compare/discussions/community_trust_test.exs`

**Interfaces:**

```elixir
Discussions.submit_review(user_id, product_id, attrs)
Discussions.submit_review(user_id, product_id, attrs, idempotency_key)
Discussions.ask_question(user_id, product_id, attrs)
Discussions.ask_question(user_id, product_id, attrs, idempotency_key)
Discussions.answer_question(user_id, question_entropy_id, body)
Discussions.answer_question(user_id, question_entropy_id, body, idempotency_key)
Discussions.update_owned(user_id, type, entropy_id, attrs)
Discussions.remove_owned(user_id, type, entropy_id)
Discussions.report(reporter_id, type, entropy_id, reason)
```

Existing three-argument create calls remain internal convenience wrappers that
generate a fresh UUID and delegate to the four-argument contract. Public
GraphQL resolvers always use the client key. Create calls return the original content for a matching replay and
`{:error, :idempotency_conflict}` for a reused key with a different digest.
Rate rejection returns `{:error, :rate_limited}`. Owner update/remove return
`:forbidden`, `:not_found`, or `:invalid_lifecycle` as applicable.
Limits live under
`config :product_compare, ProductCompare.Discussions, community_write_limits:`
with keys `:review`, `:question`, `:answer`, and `:report`.

- [ ] Add failing tests for matching replay, conflicting replay, exact limit and
  limit-plus-one boundaries, independent action windows, and configuration
  overrides.
- [ ] Add failing owner tests for each content type, non-owner rejection,
  published/hidden/rejected edit-to-pending, removed edit rejection, audit
  retention, and accepted-answer cleanup on answer edit/removal.
- [ ] Run the focused context file and confirm the lifecycle and durable-control
  APIs are missing.
- [ ] Implement transaction-scoped receipt lookup/insert, `FOR UPDATE` window
  increments, owner locking, moderation reset, soft removal, and accepted-answer
  cleanup. Digest decoded target IDs and changeset-cast content values.
- [ ] Re-run all discussion context tests, including thread CRUD, post
  validation, and review immutability.
- [ ] Commit with message `feat: complete community owner lifecycle`.

### Task 3: Typed GraphQL Lifecycle Contract

**Files:**

- Modify: `lib/product_compare_web/schema.ex`
- Modify: `lib/product_compare_web/resolvers/discussions_resolver.ex`
- Modify: `lib/product_compare_web/graphql/errors.ex`
- Modify: `test/product_compare_web/graphql/community_content_test.exs`
- Modify: `test/product_compare_web/graphql/schema_snapshot_test.exs`
- Modify: `assets/schema.graphql`

**Interfaces:** Add required `idempotencyKey` to the three create inputs; add
typed owner update inputs and `updateProductReview`, `updateProductQuestion`,
`updateProductAnswer`, and `removeCommunityContent` mutations. Review,
question, and answer objects expose non-null `viewerCanEdit` and
`viewerCanRemove` booleans resolved from the current viewer. Payload errors use
`IDEMPOTENCY_CONFLICT`, `RATE_LIMITED`, `FORBIDDEN`, `NOT_FOUND`, or
`INVALID_LIFECYCLE`.

- [ ] Add failing GraphQL tests for create replay/conflict, every owner update,
  generic removal, viewer capability booleans, non-owner access, rate-limit
  payloads, accepted-answer cleanup, and unauthenticated requests.
- [ ] Run the focused GraphQL file and schema snapshot test; confirm the new
  inputs, fields, and mutations are absent.
- [ ] Implement resolver decoding and typed payload mapping without exposing
  user identity, receipt data, counter data, or moderation notes publicly.
- [ ] Run
  `mix absinthe.schema.sdl --schema ProductCompareWeb.Schema assets/schema.graphql`
  and re-run the focused GraphQL and snapshot tests.
- [ ] Commit with message `feat: expose community lifecycle mutations`.

### Task 4: Relay Idempotency And Owner Controls

**Files:**

- Create: `assets/src/routes/products/queries/UpdateProductReviewMutation.ts`
- Create: `assets/src/routes/products/queries/UpdateProductQuestionMutation.ts`
- Create: `assets/src/routes/products/queries/UpdateProductAnswerMutation.ts`
- Create: `assets/src/routes/products/queries/RemoveCommunityContentMutation.ts`
- Modify: `assets/src/routes/products/queries/SubmitProductReviewMutation.ts`
- Modify: `assets/src/routes/products/queries/AskProductQuestionMutation.ts`
- Modify: `assets/src/routes/products/queries/AnswerProductQuestionMutation.ts`
- Modify: `assets/src/routes/products/queries/ProductCommunityQuery.ts`
- Modify: `assets/src/routes/products/queries/ProductQuestionAnswersQuery.ts`
- Modify: `assets/src/routes/products/product-community-data.ts`
- Modify: `assets/src/routes/products/ProductCommunityPanel.tsx`
- Modify: `assets/test/routes/products/product-community-data.test.ts`
- Modify: `assets/test/routes/products/product-community-panel.test.tsx`
- Regenerate: `assets/src/__generated__/*.graphql.ts`

**Interfaces:** `buildProductReviewInput`, `buildProductQuestionInput`, and
`buildProductAnswerInput` accept an explicit `idempotencyKey`. The panel creates
one `crypto.randomUUID()` value when a submit attempt begins, reuses it for a
transport retry, and clears it after a terminal payload. Owner edit/remove
controls render only when the corresponding viewer capability is true and keep
pending/errors row-scoped.

- [ ] Add failing pure tests for idempotency-key inclusion and typed lifecycle
  messages; add component tests for retry reuse, terminal-key replacement,
  owner-only controls, edit-to-pending copy, remove confirmation, row-local
  pending state, and typed limit/conflict errors.
- [ ] Run the two focused frontend test files and confirm the new inputs,
  mutations, and controls are absent.
- [ ] Add Relay documents, mutation orchestration, framework-free input/message
  policy, and accessible owner controls without exposing author identity.
- [ ] Run `cd assets && bun run relay`, the focused tests,
  `cd assets && bun run typecheck`, and `cd assets && bun run relay:check`.
- [ ] Commit with message `feat: add community owner controls`.

### Task 5: Cross-Stack Batch Gate

**Files:**

- Modify: `docs/work/community-content-lifecycle.md`

- [ ] Record migration, context, GraphQL, Relay, and UI RED/GREEN evidence in
  the lane doc without changing coordinator-owned queue state.
- [ ] Run all discussion context and community GraphQL tests.
- [ ] Run focused community frontend tests followed by
  `cd assets && bun run check`.
- [ ] Run `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate`, `mix ci`, and `git diff --check`.
- [ ] Include lane evidence in the final code/test milestone commit.
