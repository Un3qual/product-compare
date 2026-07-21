defmodule ProductCompare.Specs.SourceArtifactChangesetTest do
  use ProductCompare.DataCase, async: true

  import ProductCompare.DatabaseTestHelpers, only: [capture_select_queries: 1]

  alias Ecto.Adapters.SQL
  alias ProductCompare.Specs
  alias ProductCompareSchemas.Specs.Source
  alias ProductCompareSchemas.Specs.SourceArtifact

  describe "SourceArtifact.changeset/2 required fields" do
    test "requires source_id" do
      changeset = SourceArtifact.changeset(%SourceArtifact{}, %{fetched_at: DateTime.utc_now()})

      refute changeset.valid?
      assert "can't be blank" in errors_on(changeset).source_id
    end

    test "requires fetched_at" do
      changeset = SourceArtifact.changeset(%SourceArtifact{}, %{source_id: 1})

      refute changeset.valid?
      assert "can't be blank" in errors_on(changeset).fetched_at
    end
  end

  describe "source_artifacts DB ownership constraints" do
    test "rejects NULL source_id rows" do
      result =
        SQL.query(
          Repo,
          """
          INSERT INTO source_artifacts (entropy_id, source_id, fetched_at, inserted_at)
          VALUES ($1, NULL, now(), now())
          """,
          [Ecto.UUID.dump!(Ecto.UUID.generate())]
        )

      assert {:error,
              %Postgrex.Error{postgres: %{code: :not_null_violation, column: "source_id"}}} =
               result
    end

    test "deletes artifacts when parent source is deleted" do
      source =
        %Source{}
        |> Source.changeset(%{
          kind: "web",
          name: "source-#{System.unique_integer([:positive])}"
        })
        |> Repo.insert!()

      artifact =
        %SourceArtifact{}
        |> SourceArtifact.changeset(%{
          source_id: source.id,
          fetched_at: DateTime.utc_now()
        })
        |> Repo.insert!()

      assert Repo.get(SourceArtifact, artifact.id)

      Repo.delete!(source)

      refute Repo.get(SourceArtifact, artifact.id)
    end
  end

  describe "source artifact public reads" do
    test "returns nil for IDs outside the signed bigint range" do
      refute Specs.get_source_artifact(9_223_372_036_854_775_808)
    end

    test "batch reads preserve source preloads, missing values, and a fixed SELECT budget" do
      first_source =
        %Source{}
        |> Source.changeset(%{kind: "web", name: "source-batch-first"})
        |> Repo.insert!()

      second_source =
        %Source{}
        |> Source.changeset(%{kind: "feed", name: "source-batch-second"})
        |> Repo.insert!()

      first_artifact =
        %SourceArtifact{}
        |> SourceArtifact.changeset(%{
          source_id: first_source.id,
          fetched_at: ~U[2026-07-21 18:00:00Z]
        })
        |> Repo.insert!()

      second_artifact =
        %SourceArtifact{}
        |> SourceArtifact.changeset(%{
          source_id: second_source.id,
          fetched_at: ~U[2026-07-21 19:00:00Z]
        })
        |> Repo.insert!()

      missing_id = max(first_artifact.id, second_artifact.id) + 1_000_000

      {initial, initial_queries} =
        capture_select_queries(fn -> Specs.get_source_artifacts([first_artifact.id]) end)

      {grown, grown_queries} =
        capture_select_queries(fn ->
          Specs.get_source_artifacts([
            first_artifact.id,
            second_artifact.id,
            first_artifact.id,
            missing_id,
            0,
            9_223_372_036_854_775_808,
            "invalid"
          ])
        end)

      assert initial[first_artifact.id].source.id == first_source.id
      assert grown[first_artifact.id].source.id == first_source.id
      assert grown[second_artifact.id].source.id == second_source.id
      assert grown[missing_id] == nil
      refute Map.has_key?(grown, 0)
      refute Map.has_key?(grown, 9_223_372_036_854_775_808)
      refute Map.has_key?(grown, "invalid")
      assert Specs.get_source_artifacts([]) == %{}
      assert length(grown_queries) == length(initial_queries)
    end
  end
end
