defmodule ProductCompare.Fixtures.TaxonomyFixtures do
  alias ProductCompare.Repo
  alias ProductCompare.Taxonomy
  alias ProductCompareSchemas.Taxonomy.Taxonomy, as: TaxonomySchema

  @spec taxonomy_fixture(String.t(), String.t()) :: TaxonomySchema.t()
  def taxonomy_fixture(code \\ "type", name \\ "Type") do
    {:ok, taxonomy} = Taxonomy.upsert_taxonomy(%{code: code, name: name})
    taxonomy
  end

  @spec taxon_fixture(map()) :: ProductCompareSchemas.Taxonomy.Taxon.t()
  def taxon_fixture(attrs) do
    attrs = atomize_keys(attrs)
    taxonomy_id = Map.get(attrs, :taxonomy_id) || taxonomy_fixture().id

    params =
      attrs
      |> Map.put_new(:taxonomy_id, taxonomy_id)
      |> Map.put_new(:code, "taxon-#{System.unique_integer([:positive])}")
      |> Map.put_new(:name, "Taxon")

    {:ok, taxon} = Taxonomy.create_taxon(params)
    taxon
  end

  @spec taxonomy_by_code!(String.t()) :: TaxonomySchema.t()
  def taxonomy_by_code!(code), do: Repo.get_by!(TaxonomySchema, code: code)

  defp atomize_keys(attrs) do
    Enum.reduce(attrs, %{}, fn
      {key, value}, acc when is_atom(key) -> Map.put(acc, key, value)
      {key, value}, acc when is_binary(key) -> Map.put(acc, String.to_atom(key), value)
    end)
  end
end
