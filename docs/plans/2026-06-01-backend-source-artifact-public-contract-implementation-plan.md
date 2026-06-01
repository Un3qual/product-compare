# Backend Source Artifact Public Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a narrow GraphQL contract for safe source-artifact metadata without exposing raw provider payloads.

**Architecture:** Add a dedicated `sourceArtifact(id:)` query and a `SourceArtifact` object that returns only global ID, source display metadata, source URL, and fetch timestamp. Generic `node(id:)` support for `SourceArtifact` is handled by the completed backend source-artifact node lookup follow-up, using this slice's field-visibility policy.

**Tech Stack:** Phoenix Absinthe GraphQL, Ecto, existing `ProductCompare.Specs` context, ExUnit GraphQL tests.

---

## Existing Contract

- `ProductCompareWeb.GraphQL.GlobalId` already maps `:source_artifact` to `SourceArtifact`.
- `ProductCompareWeb.Resolvers.NodeResolver` now includes `:source_artifact` in public node lookup via the completed backend source-artifact node lookup follow-up.
- `test/product_compare_web/graphql/node_query_test.exs` now expects a `source_artifact` global ID passed to `node(id:)` to resolve safe metadata fields.
- `ProductCompareSchemas.Specs.SourceArtifact` stores `url`, `fetched_at`, `content_hash`, `raw_json`, and `raw_text`, so the GraphQL object must explicitly omit `content_hash`, `raw_json`, and `raw_text`.

## File Structure

- Modify `lib/product_compare/specs.ex` with `get_source_artifact/1` that preloads `:source`.
- Create `lib/product_compare_web/resolvers/specs_resolver.ex` for source-artifact GraphQL decoding/fetching.
- Modify `lib/product_compare_web/schema.ex` to add the `sourceArtifact(id:)` query and display-only `SourceArtifact` object.
- Create `test/product_compare_web/graphql/source_artifact_query_test.exs` for the new contract.
- `test/product_compare_web/graphql/node_query_test.exs` was updated by the follow-up node lookup plan after this public contract landed; `SourceArtifact` now implements `Node` with the same safe metadata fields.
- Update `docs/work/backend-source-artifact-public-contract.md`, `docs/work/index.md`, `docs/plans/NOW.md`, `docs/plans/INDEX.md`, and `ARCHITECTURE.md` at the closing milestone.

---

### Task 1: Add A Public-Safe Source-Artifact Query And Object

**Files:**
- Modify: `lib/product_compare/specs.ex`
- Create: `lib/product_compare_web/resolvers/specs_resolver.ex`
- Modify: `lib/product_compare_web/schema.ex`
- Create: `test/product_compare_web/graphql/source_artifact_query_test.exs`
- Modify if needed: `test/product_compare_web/graphql/node_query_test.exs`
- Modify after verification: `docs/work/backend-source-artifact-public-contract.md`
- Modify after verification: `docs/plans/2026-06-01-backend-source-artifact-public-contract-implementation-plan.md`
- Deferred by lane policy: coordinator-owned docs, including `docs/plans/NOW.md`

- [x] **Step 1: Write failing GraphQL contract tests**

Create `test/product_compare_web/graphql/source_artifact_query_test.exs` with tests that insert a source and source artifact, query by source-artifact global ID, and assert only safe fields are available:

```elixir
test "sourceArtifact returns safe metadata for a source artifact global id", %{conn: conn} do
  source =
    Repo.insert!(%Source{
      kind: "affiliate",
      name: "CJ",
      domain: "cj.example.com"
    })

  fetched_at = ~U[2026-06-01 10:00:00Z]

  artifact =
    %SourceArtifact{}
    |> SourceArtifact.changeset(%{
      source_id: source.id,
      url: "https://merchant.example.com/product",
      fetched_at: fetched_at,
      content_hash: "hash-1",
      raw_json: %{"secret" => "payload"},
      raw_text: "raw payload"
    })
    |> Repo.insert!()

  assert %{
           "data" => %{
             "sourceArtifact" => %{
               "id" => artifact_id,
               "sourceKind" => "affiliate",
               "sourceName" => "CJ",
               "sourceDomain" => "cj.example.com",
               "url" => "https://merchant.example.com/product",
               "fetchedAt" => "2026-06-01T10:00:00Z"
             }
           }
         } = graphql(conn, source_artifact_query(), %{"id" => relay_id(:source_artifact, artifact.id)})

  assert artifact_id == relay_id(:source_artifact, artifact.id)
end
```

Add an introspection test asserting `SourceArtifact` fields do not include `contentHash`, `rawJson`, or `rawText`, plus invalid-id and missing-record tests.

- [x] **Step 2: Run the new test to verify it fails**

Run:

```bash
mix test test/product_compare_web/graphql/source_artifact_query_test.exs
```

Expected: FAIL because `sourceArtifact` and the `SourceArtifact` GraphQL object do not exist yet.

- [x] **Step 3: Add the context fetch function**

In `ProductCompare.Specs`, alias `ProductCompareSchemas.Specs.SourceArtifact` and add:

```elixir
@spec get_source_artifact(pos_integer()) :: SourceArtifact.t() | nil
def get_source_artifact(id) when is_integer(id) and id > 0 do
  SourceArtifact
  |> Repo.get(id)
  |> Repo.preload(:source)
end
```

- [x] **Step 4: Add the resolver**

Create `ProductCompareWeb.Resolvers.SpecsResolver`:

```elixir
defmodule ProductCompareWeb.Resolvers.SpecsResolver do
  @moduledoc false

  alias ProductCompare.Specs
  alias ProductCompareWeb.GraphQL.GlobalId

  @spec source_artifact(any(), %{id: String.t()}, Absinthe.Resolution.t()) ::
          {:ok, term() | nil} | {:error, String.t()}
  def source_artifact(_parent, %{id: id}, _resolution) do
    case GlobalId.decode_integer(id, :source_artifact) do
      {:ok, artifact_id} -> {:ok, Specs.get_source_artifact(artifact_id)}
      :error -> {:error, "invalid source artifact id"}
    end
  end
end
```

- [x] **Step 5: Add the schema object and query**

In `ProductCompareWeb.Schema`, alias `SpecsResolver` and add:

```elixir
@desc "Returns safe display metadata for a source artifact."
field :source_artifact, :source_artifact do
  arg(:id, non_null(:id))

  resolve(&SpecsResolver.source_artifact/3)
end
```

Add the object without implementing `:node`:

```elixir
object :source_artifact do
  field :id, non_null(:id) do
    resolve(fn artifact, _, _ -> GlobalId.encode_required(:source_artifact, artifact.id) end)
  end

  field :source_kind, non_null(:string) do
    resolve(fn %{source: %{kind: kind}}, _, _ -> {:ok, kind} end)
  end

  field :source_name, non_null(:string) do
    resolve(fn %{source: %{name: name}}, _, _ -> {:ok, name} end)
  end

  field :source_domain, :string do
    resolve(fn %{source: source}, _, _ -> {:ok, source.domain} end)
  end

  field :url, :string
  field :fetched_at, non_null(:datetime)
end
```

Do not expose `content_hash`, `raw_json`, or `raw_text`.

- [x] **Step 6: Verify the source-artifact contract and node behavior**

Run:

```bash
mix test test/product_compare_web/graphql/source_artifact_query_test.exs test/product_compare_web/graphql/node_query_test.exs
```

Expected for this public-contract task at the time: PASS, with node lookup still deferred to a follow-up lane.

- [x] **Step 7: Update queue docs**

Mark Task 1 complete, record RED/GREEN verification, and advance the current batch to Task 2.

**Task 1 Result, 2026-06-01**

- RED: `mix test test/product_compare_web/graphql/source_artifact_query_test.exs` failed with 4 tests / 4 failures because `sourceArtifact` and `SourceArtifact` were not yet defined.
- GREEN: `mix test test/product_compare_web/graphql/source_artifact_query_test.exs test/product_compare_web/graphql/node_query_test.exs` passed with 25 tests / 0 failures.
- The Task 1 `SourceArtifact` object exposed only `id`, `sourceKind`, `sourceName`, `sourceDomain`, `url`, and `fetchedAt`; the later node lookup lane made the same safe object implement `Node`.
- Introspection coverage verifies `contentHash`, `rawJson`, and `rawText` are absent.
- `node(id:)` support for `source_artifact` global IDs was deferred from this task and later completed by the backend source-artifact node lookup lane.
- Backend lane current batch advanced to Task 2 in `docs/work/backend-source-artifact-public-contract.md`. Coordinator-owned docs were not updated in this backend-worker batch.

---

### Task 2: Run Backend Verification And Close Or Advance The Lane

**Files:**
- Modify: `docs/work/backend-source-artifact-public-contract.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/NOW.md`
- Modify: `docs/plans/INDEX.md`
- Modify: `ARCHITECTURE.md`

- [x] **Step 1: Run focused backend verification**

Run:

```bash
mix test test/product_compare_web/graphql/source_artifact_query_test.exs test/product_compare_web/graphql/node_query_test.exs test/product_compare/specs/source_artifact_changeset_test.exs
```

Expected: PASS.

- [x] **Step 2: Run broader backend checks**

Run:

```bash
mix test test/product_compare_web/graphql
mix typecheck
git diff --check
```

Expected: PASS.

- [x] **Step 3: Close or advance the lane**

If the safe source-artifact contract is complete and verified, close this lane and update `docs/plans/INDEX.md` to list `SourceArtifact` generic `node(id:)` support as the next backend decision. Do not add node support in this lane unless a follow-up plan explicitly selects it.
