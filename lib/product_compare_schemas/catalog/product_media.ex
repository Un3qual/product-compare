defmodule ProductCompareSchemas.Catalog.ProductMedia do
  use ProductCompareSchemas.Schema, :relational

  @type t :: %__MODULE__{}

  schema "product_media" do
    field :entropy_id, Ecto.UUID
    field :url, :string
    field :role, Ecto.Enum, values: [:primary, :gallery]
    field :position, :integer, default: 0
    field :alt_text, :string
    field :observed_at, :utc_datetime_usec

    belongs_to :product, ProductCompareSchemas.Catalog.Product
    belongs_to :source_artifact, ProductCompareSchemas.Specs.SourceArtifact

    timestamps()
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(media, attrs) do
    media
    |> cast(attrs, [
      :product_id,
      :source_artifact_id,
      :url,
      :role,
      :position,
      :alt_text,
      :observed_at
    ])
    |> validate_required([:product_id, :url, :role, :position, :observed_at])
    |> validate_number(:position, greater_than_or_equal_to: 0)
    |> validate_length(:alt_text, max: 300)
    |> validate_change(:url, &validate_http_url/2)
    |> unique_constraint([:product_id, :url], name: :product_media_product_url_uq)
    |> foreign_key_constraint(:product_id)
    |> foreign_key_constraint(:source_artifact_id)
  end

  defp validate_http_url(:url, url) do
    case URI.parse(url) do
      %URI{scheme: scheme, host: host} when scheme in ["http", "https"] and is_binary(host) -> []
      _invalid -> [url: "must be an absolute HTTP(S) URL"]
    end
  end
end
