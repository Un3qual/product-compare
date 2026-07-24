defmodule ProductCompare.Specs.Reads.Artifacts do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Repo
  alias ProductCompareSchemas.Specs.SourceArtifact

  @max_bigint_id 9_223_372_036_854_775_807

  @spec get(pos_integer()) :: SourceArtifact.t() | nil
  def get(id) do
    [id]
    |> get_many()
    |> Map.fetch!(id)
  end

  @spec get_many([term()]) :: %{optional(pos_integer()) => SourceArtifact.t() | nil}
  def get_many(ids) do
    ids = ids |> Enum.filter(&valid_id?/1) |> Enum.uniq()

    artifacts =
      case ids do
        [] ->
          %{}

        _ ->
          SourceArtifact
          |> where([artifact], artifact.id in ^ids)
          |> preload(:source)
          |> Repo.all()
          |> Map.new(&{&1.id, &1})
      end

    Map.new(ids, &{&1, Map.get(artifacts, &1)})
  end

  defp valid_id?(id), do: is_integer(id) and id > 0 and id <= @max_bigint_id
end
