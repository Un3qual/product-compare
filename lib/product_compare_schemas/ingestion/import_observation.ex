defmodule ProductCompareSchemas.Ingestion.ImportObservation do
  use ProductCompareSchemas.Schema, :relational

  @type t :: %__MODULE__{}

  schema "ingestion_run_observations" do
    belongs_to :import_run, ProductCompareSchemas.Ingestion.ImportRun
    belongs_to :external_product, ProductCompareSchemas.Specs.ExternalProduct
    belongs_to :merchant_product, ProductCompareSchemas.Pricing.MerchantProduct

    timestamps(updated_at: false)
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(observation, attrs) do
    observation
    |> cast(attrs, [:import_run_id, :external_product_id, :merchant_product_id])
    |> validate_required([:import_run_id, :external_product_id, :merchant_product_id])
    |> unique_constraint([:import_run_id, :external_product_id],
      name: :ingestion_run_observations_run_external_uq
    )
    |> foreign_key_constraint(:import_run_id)
    |> foreign_key_constraint(:external_product_id)
    |> foreign_key_constraint(:merchant_product_id)
  end
end
