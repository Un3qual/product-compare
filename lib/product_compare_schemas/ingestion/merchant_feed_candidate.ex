defmodule ProductCompareSchemas.Ingestion.MerchantFeedCandidate do
  use ProductCompareSchemas.Schema, :relational

  alias ProductCompareSchemas.Ingestion.ProviderFeedType
  alias ProductCompareSchemas.Reference.{Country, CurrencyCode, Language, ReferenceCode}

  @type t :: %__MODULE__{}

  schema "merchant_feed_candidates" do
    field :entropy_id, Ecto.UUID
    field :provider, :string, virtual: true
    field :provider_feed_id, :string
    field :advertiser_id, :string
    field :advertiser_name, :string

    field :advertiser_country, ReferenceCode,
      codes: Country.codes(),
      normalization: :upper,
      source: :advertiser_country_id

    field :source_feed_type, ReferenceCode,
      codes: ProviderFeedType.codes(),
      normalization: :upper,
      source: :provider_feed_type_id

    field :currency, CurrencyCode, source: :currency_id

    field :language, ReferenceCode,
      codes: Language.codes(),
      normalization: :upper,
      source: :language_id

    field :feed_name, :string
    field :product_count, :integer
    field :provider_last_updated_at, :utc_datetime_usec
    field :raw_metadata, :map, default: %{}
    field :last_seen_at, :utc_datetime_usec

    belongs_to :source, ProductCompareSchemas.Specs.Source
    belongs_to :cj_program, ProductCompareSchemas.Ingestion.CJProgram

    timestamps()
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(candidate, attrs) do
    candidate
    |> cast(attrs, [
      :source_id,
      :provider,
      :provider_feed_id,
      :advertiser_id,
      :advertiser_name,
      :advertiser_country,
      :source_feed_type,
      :currency,
      :language,
      :feed_name,
      :product_count,
      :provider_last_updated_at,
      :raw_metadata,
      :last_seen_at,
      :cj_program_id
    ])
    |> validate_required([:source_id, :provider_feed_id, :last_seen_at])
    |> validate_number(:product_count, greater_than_or_equal_to: 0)
    |> unique_constraint([:source_id, :provider_feed_id],
      name: :merchant_feed_candidates_source_feed_uq
    )
    |> foreign_key_constraint(:source_id)
    |> foreign_key_constraint(:cj_program_id)
    |> foreign_key_constraint(:advertiser_country,
      name: :merchant_feed_candidates_advertiser_country_id_fkey
    )
    |> foreign_key_constraint(:source_feed_type,
      name: :merchant_feed_candidates_provider_feed_type_id_fkey
    )
    |> foreign_key_constraint(:currency, name: :merchant_feed_candidates_currency_id_fkey)
    |> foreign_key_constraint(:language, name: :merchant_feed_candidates_language_id_fkey)
    |> check_constraint(:product_count,
      name: :merchant_feed_candidates_product_count_non_negative
    )
  end
end
