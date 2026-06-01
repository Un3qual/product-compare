defmodule ProductCompareWeb.GraphQL.SourceArtifactQueryTest do
  use ProductCompareWeb.ConnCase, async: false

  alias ProductCompare.Repo
  alias ProductCompareSchemas.Specs.Source
  alias ProductCompareSchemas.Specs.SourceArtifact

  describe "/api/graphql sourceArtifact query" do
    test "sourceArtifact returns safe metadata for a source artifact global id", %{conn: conn} do
      source =
        %Source{}
        |> Source.changeset(%{
          kind: "affiliate",
          name: "CJ",
          domain: "cj.example.com"
        })
        |> Repo.insert!()

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
                   "fetchedAt" => fetched_at_value
                 }
               }
             } =
               graphql(conn, source_artifact_query(), %{
                 "id" => relay_id(:source_artifact, artifact.id)
               })

      assert artifact_id == relay_id(:source_artifact, artifact.id)
      assert {:ok, parsed_fetched_at, 0} = DateTime.from_iso8601(fetched_at_value)
      assert DateTime.compare(parsed_fetched_at, fetched_at) == :eq
    end

    test "SourceArtifact introspection exposes only safe metadata fields", %{conn: conn} do
      assert %{
               "data" => %{
                 "__type" => %{
                   "fields" => fields
                 }
               }
             } = graphql(conn, source_artifact_introspection_query(), %{})

      field_names = MapSet.new(fields, & &1["name"])

      assert MapSet.subset?(
               MapSet.new([
                 "id",
                 "sourceKind",
                 "sourceName",
                 "sourceDomain",
                 "url",
                 "fetchedAt"
               ]),
               field_names
             )

      refute MapSet.member?(field_names, "contentHash")
      refute MapSet.member?(field_names, "rawJson")
      refute MapSet.member?(field_names, "rawText")
    end

    test "sourceArtifact rejects invalid ids", %{conn: conn} do
      assert %{
               "data" => %{"sourceArtifact" => nil},
               "errors" => [
                 %{"message" => "invalid source artifact id", "path" => ["sourceArtifact"]} | _
               ]
             } =
               graphql(conn, source_artifact_query(), %{
                 "id" => relay_id(:product, 123)
               })
    end

    test "sourceArtifact returns nil for a valid non-existent source artifact id", %{conn: conn} do
      response =
        graphql(conn, source_artifact_query(), %{
          "id" => relay_id(:source_artifact, 2_147_483_647)
        })

      assert %{"data" => %{"sourceArtifact" => nil}} = response
      refute Map.has_key?(response, "errors")
    end
  end

  defp source_artifact_query do
    """
    query SourceArtifact($id: ID!) {
      sourceArtifact(id: $id) {
        id
        sourceKind
        sourceName
        sourceDomain
        url
        fetchedAt
      }
    }
    """
  end

  defp source_artifact_introspection_query do
    """
    query SourceArtifactIntrospection {
      __type(name: "SourceArtifact") {
        fields {
          name
        }
      }
    }
    """
  end

  defp graphql(conn, query, variables) do
    conn
    |> post("/api/graphql", %{query: query, variables: variables})
    |> json_response(200)
  end
end
