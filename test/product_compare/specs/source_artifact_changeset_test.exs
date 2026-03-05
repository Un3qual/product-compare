defmodule ProductCompare.Specs.SourceArtifactChangesetTest do
  use ProductCompare.DataCase, async: true

  alias Ecto.Adapters.SQL
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
end
