defmodule ProductCompareWeb.Resolvers.CommerceAttributionResolver do
  @moduledoc false

  alias ProductCompareWeb.GraphQL.Errors, as: GraphQLErrors
  alias ProductCompareWeb.Resolvers.CommerceAttribution.Mutations
  alias ProductCompareWeb.Resolvers.CommerceAttribution.Reads

  @spec revenue_summary(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()}
          | {:error, String.t() | GraphQLErrors.top_level_error()}
          | Absinthe.Resolution.Helpers.dataloader_tuple()
  def revenue_summary(parent, args, resolution),
    do: Reads.revenue_summary(parent, args, resolution)

  @spec track_commerce_click(any(), %{input: map()}, Absinthe.Resolution.t()) :: {:ok, map()}
  def track_commerce_click(parent, args, resolution),
    do: Mutations.track_commerce_click(parent, args, resolution)
end
