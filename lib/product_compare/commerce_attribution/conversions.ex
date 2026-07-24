defmodule ProductCompare.CommerceAttribution.Conversions do
  @moduledoc false

  alias ProductCompare.CommerceAttribution.Conversions.Persistence
  alias ProductCompare.CommerceAttribution.Conversions.PurchaseFacts
  alias ProductCompareSchemas.CommerceAttribution.CommerceConversion
  alias ProductCompareSchemas.CommerceAttribution.PurchasePriceFact

  @spec ingest_conversion(map()) ::
          {:ok, CommerceConversion.t()} | {:error, Ecto.Changeset.t()}
  def ingest_conversion(attrs), do: Persistence.ingest(attrs)

  @spec create_purchase_price_fact(map()) ::
          {:ok, PurchasePriceFact.t()} | {:error, Ecto.Changeset.t()}
  def create_purchase_price_fact(attrs), do: PurchaseFacts.create(attrs)
end
