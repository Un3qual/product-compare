defmodule ProductCompare.Taxonomy.Taxonomies do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Input
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Taxonomy.{Taxon, Taxonomy}

  def seed_default_taxonomies do
    with {:ok, type} <- upsert_taxonomy(%{code: "type", name: "Type"}),
         {:ok, use_case} <- upsert_taxonomy(%{code: "use_case", name: "Use Case"}) do
      {:ok, [type, use_case]}
    end
  end

  def upsert_taxonomy(attrs) do
    now = DateTime.utc_now()
    changeset = Taxonomy.changeset(%Taxonomy{}, attrs)
    code = Input.fetch_attr(attrs, :code)

    if changeset.valid? do
      update_fields =
        changeset.changes
        |> Map.drop([:code])
        |> Map.to_list()

      Repo.insert(
        changeset,
        on_conflict: [set: update_fields ++ [updated_at: now]],
        conflict_target: [:code],
        returning: true
      )
    else
      fetch_existing_taxonomy_for_code_only_attrs(attrs, code, changeset)
    end
  end

  def get_taxon_by_seo_slug(slug) when is_binary(slug), do: Repo.get_by(Taxon, seo_slug: slug)
  def get_taxon_by_seo_slug(_slug), do: nil

  def ensure_taxon_in_taxonomy(taxon_id, taxonomy_code) do
    query =
      from t in Taxon,
        join: tx in Taxonomy,
        on: tx.id == t.taxonomy_id,
        where: t.id == ^taxon_id and tx.code == ^taxonomy_code,
        select: tx.code

    case Repo.one(query) do
      nil -> {:error, :invalid_taxon}
      "use_case" -> {:ok, :use_case}
      "type" -> {:ok, :type}
      _ -> {:error, :invalid_taxon}
    end
  end

  @spec list_taxons_for_taxonomy(String.t()) :: [Taxon.t()]
  def list_taxons_for_taxonomy(taxonomy_code) do
    Repo.all(
      from taxon in Taxon,
        join: taxonomy in Taxonomy,
        on: taxonomy.id == taxon.taxonomy_id,
        where: taxonomy.code == ^taxonomy_code,
        order_by: [asc: taxon.name, asc: taxon.code, asc: taxon.id]
    )
  end

  defp fetch_existing_taxonomy_for_code_only_attrs(attrs, code, changeset) do
    if present?(code) and not provided?(attrs, :name) do
      case Repo.get_by(Taxonomy, code: code) do
        %Taxonomy{} = taxonomy -> {:ok, taxonomy}
        nil -> {:error, changeset}
      end
    else
      {:error, changeset}
    end
  end

  defp provided?(attrs, key), do: Input.attr_key_present?(attrs, key)

  defp present?(value) when is_binary(value), do: String.trim(value) != ""
  defp present?(_value), do: false
end
