defmodule ProductCompare.Taxonomy do
  @moduledoc """
  Taxonomy context for hard type taxonomy and soft use-case tags.
  """

  import Ecto.Query

  alias ProductCompare.Repo
  alias ProductCompare.Taxonomy.Assignments
  alias ProductCompare.Taxonomy.Hierarchy
  alias ProductCompare.Taxonomy.Taxonomies
  alias ProductCompareSchemas.Taxonomy.{ProductTaxon, Taxon, TaxonAlias, Taxonomy}

  @type closure_result :: %{taxon: Taxon.t(), depth: non_neg_integer()}

  @spec seed_default_taxonomies() :: {:ok, [Taxonomy.t()]} | {:error, Ecto.Changeset.t()}
  def seed_default_taxonomies, do: Taxonomies.seed_default_taxonomies()

  @spec upsert_taxonomy(map()) :: {:ok, Taxonomy.t()} | {:error, Ecto.Changeset.t()}
  def upsert_taxonomy(attrs), do: Taxonomies.upsert_taxonomy(attrs)

  @spec create_taxon(map()) :: {:ok, Taxon.t()} | {:error, term()}
  def create_taxon(attrs), do: Hierarchy.create_taxon(attrs)

  @spec update_taxon(Taxon.t(), map()) :: {:ok, Taxon.t()} | {:error, Ecto.Changeset.t()}
  def update_taxon(%Taxon{} = taxon, attrs) when is_map(attrs),
    do: Hierarchy.update_taxon(taxon, attrs)

  @spec get_taxon_by_seo_slug(String.t()) :: Taxon.t() | nil
  def get_taxon_by_seo_slug(slug) when is_binary(slug), do: Taxonomies.get_taxon_by_seo_slug(slug)
  def get_taxon_by_seo_slug(_slug), do: nil

  @spec move_taxon(pos_integer(), pos_integer() | nil) :: {:ok, Taxon.t()} | {:error, term()}
  def move_taxon(taxon_id, new_parent_id), do: Hierarchy.move_taxon(taxon_id, new_parent_id)

  @spec list_descendants(pos_integer()) :: [closure_result()]
  def list_descendants(taxon_id), do: Hierarchy.list_descendants(taxon_id)

  @spec list_ancestors(pos_integer()) :: [closure_result()]
  def list_ancestors(taxon_id), do: Hierarchy.list_ancestors(taxon_id)

  @spec assign_use_case(
          pos_integer(),
          pos_integer(),
          pos_integer() | nil,
          ProductTaxon.source_type(),
          Decimal.t() | float() | nil
        ) ::
          {:ok, ProductTaxon.t()} | {:error, term()}
  def assign_use_case(product_id, use_case_taxon_id, created_by, source_type, confidence \\ nil) do
    Assignments.assign_use_case(
      product_id,
      use_case_taxon_id,
      created_by,
      source_type,
      confidence
    )
  end

  @spec unassign_use_case(pos_integer(), pos_integer()) :: {:ok, non_neg_integer()}
  def unassign_use_case(product_id, use_case_taxon_id),
    do: Assignments.unassign_use_case(product_id, use_case_taxon_id)

  @spec ensure_taxon_in_taxonomy(pos_integer(), String.t()) ::
          {:ok, :use_case | :type} | {:error, :invalid_taxon}
  def ensure_taxon_in_taxonomy(taxon_id, taxonomy_code),
    do: Taxonomies.ensure_taxon_in_taxonomy(taxon_id, taxonomy_code)

  @spec list_taxons_for_taxonomy(String.t()) :: [Taxon.t()]
  def list_taxons_for_taxonomy(taxonomy_code) when is_binary(taxonomy_code) do
    Taxonomies.list_taxons_for_taxonomy(taxonomy_code)
  end

  @spec list_taxon_aliases(pos_integer()) :: [TaxonAlias.t()]
  def list_taxon_aliases(taxon_id) do
    Repo.all(from ta in TaxonAlias, where: ta.taxon_id == ^taxon_id, order_by: [asc: ta.alias])
  end

  @spec normalize_category_path([String.t()] | String.t()) :: String.t() | nil
  def normalize_category_path(path) when is_binary(path) do
    path
    |> String.split(">", trim: true)
    |> normalize_category_path()
  end

  def normalize_category_path(path) when is_list(path) do
    path
    |> Enum.filter(&is_binary/1)
    |> Enum.map(&String.trim/1)
    |> Enum.reject(&(&1 == ""))
    |> Enum.join(" > ")
    |> String.downcase()
    |> case do
      "" -> nil
      normalized -> normalized
    end
  end

  def normalize_category_path(_path), do: nil

  @spec upsert_taxon_alias(pos_integer(), [String.t()] | String.t()) ::
          {:ok, TaxonAlias.t()} | {:error, Ecto.Changeset.t() | :invalid_category_path}
  def upsert_taxon_alias(taxon_id, path) do
    case normalize_category_path(path) do
      nil ->
        {:error, :invalid_category_path}

      normalized_path ->
        %TaxonAlias{}
        |> TaxonAlias.changeset(%{taxon_id: taxon_id, alias: normalized_path})
        |> Repo.insert(
          on_conflict: {:replace, [:taxon_id]},
          conflict_target: [:alias],
          returning: true
        )
    end
  end

  @spec resolve_type_alias([String.t()] | String.t()) :: Taxon.t() | nil
  def resolve_type_alias(path) do
    case normalize_category_path(path) do
      nil ->
        nil

      normalized_path ->
        Repo.one(
          from taxon_alias in TaxonAlias,
            join: taxon in Taxon,
            on: taxon.id == taxon_alias.taxon_id,
            join: taxonomy in Taxonomy,
            on: taxonomy.id == taxon.taxonomy_id,
            where: taxon_alias.alias == ^normalized_path and taxonomy.code == "type",
            select: taxon
        )
    end
  end
end
