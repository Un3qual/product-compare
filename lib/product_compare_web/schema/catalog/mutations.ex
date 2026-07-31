defmodule ProductCompareWeb.Schema.Catalog.Mutations do
  use Absinthe.Schema.Notation

  alias ProductCompareWeb.Resolvers.CatalogResolver

  object :catalog_mutations do
    @desc "Creates a private saved comparison set for the current authenticated user."
    field :create_saved_comparison_set, non_null(:saved_comparison_set_payload) do
      arg(:input, non_null(:create_saved_comparison_set_input))
      resolve(&CatalogResolver.create_saved_comparison_set/3)
    end

    @desc "Deletes one of the current authenticated user's saved comparison sets."
    field :delete_saved_comparison_set, non_null(:saved_comparison_set_payload) do
      arg(:saved_comparison_set_id, non_null(:id))
      resolve(&CatalogResolver.delete_saved_comparison_set/3)
    end
  end
end
