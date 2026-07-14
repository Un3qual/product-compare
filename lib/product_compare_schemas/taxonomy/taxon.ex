defmodule ProductCompareSchemas.Taxonomy.Taxon do
  use ProductCompareSchemas.Schema, :relational

  @type t :: %__MODULE__{}

  schema "taxons" do
    field :entropy_id, Ecto.UUID
    field :code, :string
    field :name, :string
    field :seo_slug, :string
    field :seo_description, :string
    field :seo_indexable, :boolean, default: false

    belongs_to :taxonomy, ProductCompareSchemas.Taxonomy.Taxonomy
    belongs_to :parent, __MODULE__

    has_many :children, __MODULE__, foreign_key: :parent_id
    has_many :aliases, ProductCompareSchemas.Taxonomy.TaxonAlias

    timestamps()
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(taxon, attrs) do
    taxon
    |> cast(attrs, [
      :taxonomy_id,
      :parent_id,
      :code,
      :name,
      :seo_slug,
      :seo_description,
      :seo_indexable
    ])
    |> preserve_existing_seo_slug(taxon)
    |> validate_required([:taxonomy_id, :code, :name])
    |> validate_format(:seo_slug, ~r/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    |> validate_length(:seo_description, min: 80, max: 500)
    |> require_search_metadata_when_indexable()
    |> unique_constraint([:taxonomy_id, :code], name: :taxons_taxonomy_code_uq)
    |> unique_constraint(:seo_slug)
  end

  defp require_search_metadata_when_indexable(changeset) do
    if get_field(changeset, :seo_indexable) == true do
      validate_required(changeset, [:seo_slug, :seo_description])
    else
      changeset
    end
  end

  defp preserve_existing_seo_slug(changeset, %{id: id, seo_slug: slug})
       when is_integer(id) and is_binary(slug) do
    case fetch_change(changeset, :seo_slug) do
      {:ok, ^slug} -> changeset
      {:ok, _different_slug} -> add_error(changeset, :seo_slug, "is immutable once published")
      :error -> changeset
    end
  end

  defp preserve_existing_seo_slug(changeset, _taxon), do: changeset
end
