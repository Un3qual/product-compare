defmodule ProductCompare.Taxonomy.Aliases do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Repo
  alias ProductCompareSchemas.Taxonomy.{Taxon, TaxonAlias, Taxonomy}

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

  @spec resolve_type_alias_for_write([String.t()] | String.t()) :: Taxon.t() | nil
  def resolve_type_alias_for_write(path) do
    if Repo.in_transaction?() do
      case normalize_category_path(path) do
        nil ->
          nil

        normalized_path ->
          case Repo.one(
                 from taxon_alias in TaxonAlias,
                   where: taxon_alias.alias == ^normalized_path,
                   lock: "FOR SHARE"
               ) do
            nil -> nil
            %TaxonAlias{taxon_id: taxon_id} -> get_type_taxon(taxon_id)
          end
      end
    else
      raise ArgumentError, "resolve_type_alias_for_write/1 requires a database transaction"
    end
  end

  defp get_type_taxon(taxon_id) do
    Repo.one(
      from taxon in Taxon,
        join: taxonomy in Taxonomy,
        on: taxonomy.id == taxon.taxonomy_id,
        where: taxon.id == ^taxon_id and taxonomy.code == "type",
        select: taxon
    )
  end
end
