defmodule ProductCompareSchemas.Specs.Source do
  use ProductCompareSchemas.Schema, :relational

  alias ProductCompareSchemas.Reference.ReferenceCode

  @kind_codes %{
    "affiliate_feed" => 1,
    "merchant_feed" => 2,
    "manufacturer" => 3,
    "web" => 4,
    "feed" => 5,
    "affiliate" => 6
  }
  @provider_codes %{"cj" => 1, "awin" => 2, "impact" => 3, "shopify" => 4}
  @type t :: %__MODULE__{}

  schema "sources" do
    field :entropy_id, Ecto.UUID

    field :kind, ReferenceCode,
      codes: @kind_codes,
      normalization: :lower,
      source: :source_kind_id

    field :provider, ReferenceCode,
      codes: @provider_codes,
      normalization: :lower,
      source: :provider_id

    field :name, :string
    field :domain, :string

    has_many :artifacts, ProductCompareSchemas.Specs.SourceArtifact

    timestamps()
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(source, attrs) do
    source
    |> cast(attrs, [:kind, :provider, :name, :domain])
    |> validate_required([:kind, :name])
    |> unique_constraint([:kind, :name], name: :sources_kind_name_uq)
    |> foreign_key_constraint(:kind, name: :sources_source_kind_id_fkey)
    |> foreign_key_constraint(:provider, name: :sources_provider_id_fkey)
  end

  @spec kind_codes() :: %{String.t() => pos_integer()}
  def kind_codes, do: @kind_codes

  @spec normalize_provider(term()) :: String.t() | nil
  def normalize_provider(value), do: ReferenceCode.normalize(value, @provider_codes, :lower)
end
