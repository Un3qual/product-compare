defmodule ProductCompareWeb.Resolvers.Pricing.Evidence do
  @moduledoc false

  import Absinthe.Resolution.Helpers, only: [on_load: 2]

  alias ProductCompare.Pricing
  alias ProductCompareSchemas.Specs.SourceArtifact

  @spec source_artifact(map(), map(), Absinthe.Resolution.t()) ::
          {:ok, SourceArtifact.t() | nil} | Absinthe.Resolution.Helpers.dataloader_tuple()
  def source_artifact(%{artifact_id: nil}, _args, _resolution), do: {:ok, nil}

  def source_artifact(%{artifact_id: artifact_id}, _args, %{context: %{loader: loader}})
      when is_integer(artifact_id) do
    loader
    |> Dataloader.load(Pricing, {:one, SourceArtifact}, id: artifact_id)
    |> on_load(fn loader ->
      {:ok, Dataloader.get(loader, Pricing, {:one, SourceArtifact}, id: artifact_id)}
    end)
  end

  def source_artifact(_price_point, _args, _resolution), do: {:ok, nil}
end
