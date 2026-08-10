defmodule ProductCompareWeb.Schema.Home.Queries do
  use Absinthe.Schema.Notation

  alias ProductCompareWeb.Resolvers.HomeResolver

  object :home_queries do
    @desc "Returns the essential public homepage workspace."
    field :home_workspace, non_null(:home_workspace) do
      arg(:selected_slugs, non_null(list_of(non_null(:string))))
      resolve(&HomeResolver.home_workspace/3)
    end

    @desc "Returns independent public and viewer-scoped homepage deals."
    field :home_deals, non_null(:home_deals) do
      arg(:selected_slugs, non_null(list_of(non_null(:string))))
      resolve(&HomeResolver.home_deals/3)
    end
  end
end
