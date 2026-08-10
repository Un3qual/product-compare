defmodule ProductCompareSchemas.Catalog.ComparisonSnapshot.Ranking do
  use ProductCompareSchemas.Schema, :relational

  alias ProductCompareSchemas.Reference.CurrencyCode
  alias ProductCompareSchemas.Schema

  @type t :: %__MODULE__{}

  schema "comparison_snapshot_rankings" do
    field :rank, :integer
    field :product_id, :integer
    field :product_name, :string
    field :landed_price, :decimal
    field :currency, CurrencyCode, source: :currency_id
    field :price_point_id, :integer
    field :merchant_product_id, :integer
    field :claim_ids, {:array, :integer}, default: []
    field :reasons, {:array, :string}, default: []

    belongs_to :snapshot_recommendation,
               ProductCompareSchemas.Catalog.ComparisonSnapshot.Recommendation
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(ranking, attrs) do
    attrs = Schema.normalize_non_finite_decimals(attrs, [:landed_price])

    ranking
    |> cast(attrs, [
      :snapshot_recommendation_id,
      :rank,
      :product_id,
      :product_name,
      :landed_price,
      :currency,
      :price_point_id,
      :merchant_product_id,
      :claim_ids,
      :reasons
    ])
    |> validate_required([
      :snapshot_recommendation_id,
      :rank,
      :product_id,
      :product_name,
      :landed_price,
      :currency,
      :price_point_id,
      :merchant_product_id,
      :claim_ids,
      :reasons
    ])
    |> validate_number(:rank, greater_than: 0)
    |> validate_number(:landed_price, greater_than_or_equal_to: 0)
    |> unique_constraint([:snapshot_recommendation_id, :rank],
      name: :snapshot_rankings_recommendation_rank_uq
    )
    |> foreign_key_constraint(:snapshot_recommendation_id)
    |> foreign_key_constraint(:currency, name: :comparison_snapshot_rankings_currency_id_fkey)
    |> check_constraint(:rank, name: :comparison_snapshot_rankings_rank)
    |> check_constraint(:landed_price,
      name: :comparison_snapshot_rankings_landed_price_non_negative
    )
  end
end
