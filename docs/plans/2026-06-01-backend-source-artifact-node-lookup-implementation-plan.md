# Backend Source Artifact Node Lookup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add generic GraphQL `node(id:)` support for the safe `SourceArtifact` object.

**Architecture:** Reuse the completed public-safe `SourceArtifact` object and `ProductCompare.Specs.get_source_artifact/1`. Add `SourceArtifact` to the schema Node interface and resolver type map, then extend `NodeResolver` public lookup to fetch source artifacts without exposing raw payload fields.

**Tech Stack:** Phoenix Absinthe GraphQL, existing `ProductCompare.Specs` context, ExUnit GraphQL tests.

---

## Existing Contract

- `sourceArtifact(id:)` already returns a display-safe `SourceArtifact` shape.
- The `SourceArtifact` GraphQL object intentionally exposes only `id`, `sourceKind`, `sourceName`, `sourceDomain`, `url`, and `fetchedAt`.
- `NodeResolver` currently excludes `:source_artifact` from supported public node types.
- Before Task 1, `test/product_compare_web/graphql/node_query_test.exs` asserted that `source_artifact` IDs were unsupported by `node(id:)`; Task 1 replaces that expectation with a positive node lookup contract.

## File Structure

- Modify `test/product_compare_web/graphql/node_query_test.exs` for RED/GREEN node lookup coverage.
- Modify `lib/product_compare_web/schema.ex` so `:source_artifact` implements `:node` and the Node interface resolves `ProductCompareSchemas.Specs.SourceArtifact`.
- Modify `lib/product_compare_web/resolvers/node_resolver.ex` so public node lookup includes `:source_artifact` and fetches via `ProductCompare.Specs.get_source_artifact/1`.
- Update `docs/work/backend-source-artifact-node-lookup.md` during lane execution, then update coordinator-owned shared docs at the integration boundary.

---

### Task 1: Add SourceArtifact To Generic Node Lookup

**Files:**
- Modify: `test/product_compare_web/graphql/node_query_test.exs`
- Modify: `lib/product_compare_web/schema.ex`
- Modify: `lib/product_compare_web/resolvers/node_resolver.ex`
- Modify after verification: `docs/work/backend-source-artifact-node-lookup.md`
- Modify after verification: `docs/plans/2026-06-01-backend-source-artifact-node-lookup-implementation-plan.md`

- [x] **Step 1: Write the failing node query test**

Replace the unsupported-source-artifact test with positive coverage that creates a source and source artifact, queries `node(id:)`, and asserts the safe object shape:

```elixir
test "node returns a source artifact for a valid source artifact global id", %{conn: conn} do
  source =
    Repo.insert!(%Source{
      kind: "affiliate",
      name: "CJ",
      domain: "cj.example.com"
    })

  artifact =
    %SourceArtifact{}
    |> SourceArtifact.changeset(%{
      source_id: source.id,
      url: "https://merchant.example.com/product",
      fetched_at: ~U[2026-06-01 10:00:00Z],
      content_hash: "hash-1",
      raw_json: %{"secret" => "payload"},
      raw_text: "raw payload"
    })
    |> Repo.insert!()

  assert %{
           "data" => %{
             "node" => %{
               "__typename" => "SourceArtifact",
               "id" => artifact_id,
               "sourceKind" => "affiliate",
               "sourceName" => "CJ",
               "sourceDomain" => "cj.example.com",
               "url" => "https://merchant.example.com/product",
               "fetchedAt" => "2026-06-01T10:00:00Z"
             }
           }
         } = graphql(conn, source_artifact_node_query(), %{"id" => relay_id(:source_artifact, artifact.id)})

  assert artifact_id == relay_id(:source_artifact, artifact.id)
end
```

Add a non-existent source-artifact node assertion returning `node: nil` without errors.

- [x] **Step 2: Run the node test to verify it fails**

Run:

```bash
mix test test/product_compare_web/graphql/node_query_test.exs
```

Expected: FAIL because `source_artifact` IDs are not accepted by `NodeResolver` and `SourceArtifact` does not implement `Node`.

- [x] **Step 3: Add SourceArtifact to the schema Node interface**

In `ProductCompareWeb.Schema`, alias `ProductCompareSchemas.Specs.SourceArtifact`, add `interface(:node)` to `object :source_artifact`, and add a `resolve_type` clause returning `:source_artifact`.

Do not add fields beyond the safe contract already on `object :source_artifact`.

- [x] **Step 4: Add SourceArtifact to NodeResolver public lookup**

In `ProductCompareWeb.Resolvers.NodeResolver`, alias `ProductCompare.Specs`, add `:source_artifact` to `@public_types`, and add:

```elixir
defp fetch_public_node(:source_artifact, id), do: fetch_record(Specs.get_source_artifact(id))
```

- [x] **Step 5: Verify focused backend behavior**

Run:

```bash
mix test test/product_compare_web/graphql/node_query_test.exs test/product_compare_web/graphql/source_artifact_query_test.exs
```

Expected: PASS.

- [x] **Step 6: Update queue docs**

Mark Task 1 complete, record RED/GREEN verification, and advance the current batch to Task 2.

---

### Task 2: Run Backend Verification And Close The Lane

**Lane-owned files:**
- Modify: `docs/work/backend-source-artifact-node-lookup.md`
- Modify: `docs/plans/2026-06-01-backend-source-artifact-node-lookup-implementation-plan.md`

**Coordinator integration files:**
- Modify: `docs/work/index.md`
- Modify: `docs/plans/NOW.md`
- Modify: `docs/plans/INDEX.md`
- Modify: `ARCHITECTURE.md`

- [x] **Step 1: Run focused backend verification**

Run:

```bash
mix test test/product_compare_web/graphql/node_query_test.exs test/product_compare_web/graphql/source_artifact_query_test.exs test/product_compare/specs/source_artifact_changeset_test.exs
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

- [x] **Step 3: Close the lane**

Record final verification, mark the lane completed, and update shared docs at coordinator integration so `SourceArtifact` generic node lookup is listed as delivered.
