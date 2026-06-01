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
