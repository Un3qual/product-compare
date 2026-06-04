defmodule ProductCompareSchemas.Ingestion.MerchantFeedCandidate do
  use ProductCompareSchemas.Schema, :relational

  @type t :: %__MODULE__{}
  @review_statuses ~w(pending shortlisted dismissed)

  schema "merchant_feed_candidates" do
    field :entropy_id, Ecto.UUID
    field :provider, :string
    field :provider_feed_id, :string
    field :advertiser_id, :string
    field :advertiser_name, :string
    field :advertiser_country, :string
    field :source_feed_type, :string
    field :currency, :string
    field :language, :string
    field :feed_name, :string
    field :product_count, :integer
    field :provider_last_updated_at, :utc_datetime_usec
    field :raw_metadata, :map, default: %{}
    field :last_seen_at, :utc_datetime_usec
    field :review_status, :string, default: "pending"
    field :review_note, :string
    field :reviewed_at, :utc_datetime_usec

    belongs_to :source, ProductCompareSchemas.Specs.Source

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
      :review_status,
      :review_note,
      :reviewed_at
    ])
    |> validate_required([:source_id, :provider, :provider_feed_id, :last_seen_at])
    |> validate_inclusion(:review_status, @review_statuses)
    |> validate_number(:product_count, greater_than_or_equal_to: 0)
    |> unique_constraint([:source_id, :provider_feed_id],
      name: :merchant_feed_candidates_source_feed_uq
    )
    |> foreign_key_constraint(:source_id)
    |> check_constraint(:product_count,
      name: :merchant_feed_candidates_product_count_non_negative
    )
    |> check_constraint(:review_status,
      name: :merchant_feed_candidates_review_status_chk
    )
  end

  @spec review_changeset(t(), map()) :: Ecto.Changeset.t()
  def review_changeset(candidate, attrs) do
    candidate
    |> cast(attrs, [:review_status, :review_note, :reviewed_at])
    |> validate_required([:review_status, :reviewed_at])
    |> validate_inclusion(:review_status, @review_statuses)
    |> check_constraint(:review_status,
      name: :merchant_feed_candidates_review_status_chk
    )
  end
end
