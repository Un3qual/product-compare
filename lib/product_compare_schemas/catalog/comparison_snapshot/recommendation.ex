defmodule ProductCompareSchemas.Catalog.ComparisonSnapshot.Recommendation do
  use ProductCompareSchemas.Schema, :relational

  alias ProductCompareSchemas.Reference.{CurrencyCode, ReferenceCode}

  @algorithm_codes %{
    "lowest-current-cost-v1" => 1,
    "best-supported-current-cost-v1" => 2
  }
  @profiles [:lowest_current_cost, :best_value]
  @statuses [:winner, :tie, :insufficient_evidence]
  @type t :: %__MODULE__{}

  schema "comparison_snapshot_recommendations" do
    field :profile, Ecto.Enum, values: @profiles

    field :algorithm_version, ReferenceCode,
      codes: @algorithm_codes,
      normalization: :none,
      source: :recommendation_algorithm_id

    field :evaluated_at, :utc_datetime_usec
    field :status, Ecto.Enum, values: @statuses
    field :winner_product_id, :integer
    field :currency, CurrencyCode, source: :currency_id
    field :missing_inputs, {:array, :string}, default: []

    belongs_to :comparison_snapshot, ProductCompareSchemas.Catalog.ComparisonSnapshot

    has_many :rankings, ProductCompareSchemas.Catalog.ComparisonSnapshot.Ranking,
      foreign_key: :snapshot_recommendation_id
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(recommendation, attrs) do
    recommendation
    |> cast(attrs, [
      :comparison_snapshot_id,
      :profile,
      :algorithm_version,
      :evaluated_at,
      :status,
      :winner_product_id,
      :currency,
      :missing_inputs
    ])
    |> validate_required([
      :comparison_snapshot_id,
      :profile,
      :algorithm_version,
      :evaluated_at,
      :status,
      :missing_inputs
    ])
    |> unique_constraint(:comparison_snapshot_id, name: :snapshot_recommendations_snapshot_uq)
    |> foreign_key_constraint(:comparison_snapshot_id)
    |> foreign_key_constraint(:algorithm_version,
      name: :snapshot_recommendations_algorithm_fkey
    )
    |> foreign_key_constraint(:currency,
      name: :comparison_snapshot_recommendations_currency_id_fkey
    )
  end
end
