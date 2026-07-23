defmodule ProductCompareWeb.Schema.Types.Common do
  use Absinthe.Schema.Notation

  alias ProductCompareSchemas.Accounts.ApiToken
  alias ProductCompareSchemas.Affiliate.AffiliateLink
  alias ProductCompareSchemas.Affiliate.AffiliateNetwork
  alias ProductCompareSchemas.Affiliate.AffiliateProgram
  alias ProductCompareSchemas.Affiliate.Coupon
  alias ProductCompareSchemas.Catalog.Brand
  alias ProductCompareSchemas.Catalog.Product
  alias ProductCompareSchemas.Catalog.SavedComparisonSet
  alias ProductCompareSchemas.Pricing.Merchant
  alias ProductCompareSchemas.Pricing.MerchantProduct
  alias ProductCompareSchemas.Pricing.PricePoint
  alias ProductCompareSchemas.Specs.SourceArtifact

  object :mutation_error do
    field :code, non_null(:string)
    field :message, non_null(:string)
    field :field, :string
  end

  object :page_info do
    field :has_next_page, non_null(:boolean)
    field :has_previous_page, non_null(:boolean)
    field :start_cursor, :string
    field :end_cursor, :string
  end

  interface :node do
    field :id, non_null(:id)

    resolve_type(fn
      %Product{}, _ -> :product
      %Brand{}, _ -> :brand
      %Merchant{}, _ -> :merchant
      %MerchantProduct{}, _ -> :merchant_product
      %PricePoint{}, _ -> :price_point
      %SavedComparisonSet{}, _ -> :saved_comparison_set
      %ApiToken{}, _ -> :api_token
      %AffiliateNetwork{}, _ -> :affiliate_network
      %AffiliateProgram{}, _ -> :affiliate_program
      %AffiliateLink{}, _ -> :affiliate_link
      %Coupon{}, _ -> :coupon
      %SourceArtifact{}, _ -> :source_artifact
      _, _ -> nil
    end)
  end

  object :seo_metadata do
    field :title, non_null(:string)
    field :description, non_null(:string)
    field :canonical_path, non_null(:string)
    field :indexable, non_null(:boolean)
    field :image_url, :string
    field :structured_data, :string
  end
end
