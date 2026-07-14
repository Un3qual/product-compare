defmodule ProductCompare.Ingestion.NormalizedListing do
  @moduledoc """
  Source-agnostic listing contract produced by ingestion source parsers.
  """

  @enforce_keys [
    :source,
    :external_product_id,
    :merchant_identifier,
    :product_title,
    :listing_url,
    :currency,
    :amount,
    :availability,
    :observed_at,
    :raw_payload
  ]
  defstruct [
    :source,
    :external_product_id,
    :merchant_identifier,
    :product_title,
    :model_number,
    :description,
    :brand_name,
    :gtin,
    :merchant_name,
    :merchant_domain,
    :listing_url,
    :currency,
    :amount,
    :availability,
    :observed_at,
    :raw_payload,
    manufacturer_category_path: [],
    media: [],
    specifications: []
  ]

  @type availability :: :in_stock | :out_of_stock | :unknown

  @type t :: %__MODULE__{
          source: atom(),
          external_product_id: String.t(),
          merchant_identifier: String.t(),
          product_title: String.t(),
          model_number: String.t() | nil,
          description: String.t() | nil,
          brand_name: String.t() | nil,
          gtin: String.t() | nil,
          merchant_name: String.t() | nil,
          merchant_domain: String.t() | nil,
          listing_url: String.t(),
          currency: String.t(),
          amount: Decimal.t(),
          availability: availability(),
          observed_at: DateTime.t(),
          raw_payload: map(),
          manufacturer_category_path: [String.t()],
          media: [ProductCompare.Ingestion.MediaObservation.t()],
          specifications: [ProductCompare.Ingestion.SpecificationObservation.t()]
        }
end
