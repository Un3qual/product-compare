defmodule ProductCompareWeb.Schema do
  use Absinthe.Schema
  use Absinthe.Relay.Schema, :modern

  import_types(Absinthe.Type.Custom)
  import_types(ProductCompareWeb.Schema.Accounts.Types)
  import_types(ProductCompareWeb.Schema.Affiliate.Types)
  import_types(ProductCompareWeb.Schema.Alerts.Types)
  import_types(ProductCompareWeb.Schema.Catalog.Types)
  import_types(ProductCompareWeb.Schema.ComparisonSnapshots.Types)
  import_types(ProductCompareWeb.Schema.CommerceAttribution.Types)
  import_types(ProductCompareWeb.Schema.Discussions.Types)
  import_types(ProductCompareWeb.Schema.Ingestion.Types)
  import_types(ProductCompareWeb.Schema.Pricing.Types)
  import_types(ProductCompareWeb.Schema.Seo.Types)
  import_types(ProductCompareWeb.Schema.Specs.Types)

  import_types(ProductCompareWeb.Schema.Accounts.Queries)
  import_types(ProductCompareWeb.Schema.Affiliate.Queries)
  import_types(ProductCompareWeb.Schema.Alerts.Queries)
  import_types(ProductCompareWeb.Schema.Catalog.Queries)
  import_types(ProductCompareWeb.Schema.CommerceAttribution.Queries)
  import_types(ProductCompareWeb.Schema.ComparisonSnapshots.Queries)
  import_types(ProductCompareWeb.Schema.Discussions.Queries)
  import_types(ProductCompareWeb.Schema.Ingestion.Queries)
  import_types(ProductCompareWeb.Schema.Pricing.Queries)
  import_types(ProductCompareWeb.Schema.Seo.Queries)
  import_types(ProductCompareWeb.Schema.Specs.Queries)

  import_types(ProductCompareWeb.Schema.Accounts.Mutations)
  import_types(ProductCompareWeb.Schema.Affiliate.Mutations)
  import_types(ProductCompareWeb.Schema.Alerts.Mutations)
  import_types(ProductCompareWeb.Schema.Catalog.Mutations)
  import_types(ProductCompareWeb.Schema.CommerceAttribution.Mutations)
  import_types(ProductCompareWeb.Schema.ComparisonSnapshots.Mutations)
  import_types(ProductCompareWeb.Schema.Discussions.Mutations)
  import_types(ProductCompareWeb.Schema.Ingestion.Mutations)
  import_types(ProductCompareWeb.Schema.Specs.Mutations)

  alias ProductCompareWeb.GraphQL.Loader
  alias ProductCompareWeb.Resolvers.CatalogResolver
  alias ProductCompareWeb.Resolvers.NodeResolver
  alias ProductCompareSchemas.Accounts.{ApiToken, User}
  alias ProductCompareSchemas.Alerts.{AlertEvent, PriceWatchRule}
  alias ProductCompareSchemas.Affiliate.AffiliateLink
  alias ProductCompareSchemas.Affiliate.AffiliateNetwork
  alias ProductCompareSchemas.Affiliate.AffiliateProgram
  alias ProductCompareSchemas.Affiliate.Coupon
  alias ProductCompareSchemas.Catalog.{Brand, ComparisonSnapshot, Product, SavedComparisonSet}
  alias ProductCompareSchemas.Discussions.{ProductReview, ProductThread, ThreadPost}
  alias ProductCompareSchemas.Ingestion.{CJProgram, MerchantFeedCandidate}
  alias ProductCompareSchemas.Pricing.Merchant
  alias ProductCompareSchemas.Pricing.MerchantProduct
  alias ProductCompareSchemas.Pricing.PricePoint
  alias ProductCompareSchemas.Specs.{SourceArtifact, SpecificationCorrection}

  object :mutation_error do
    field :code, non_null(:string)
    field :message, non_null(:string)
    field :field, :string
  end

  object :seo_metadata do
    field :title, non_null(:string)
    field :description, non_null(:string)
    field :canonical_path, non_null(:string)
    field :indexable, non_null(:boolean)
    field :image_url, :string
    field :structured_data, :string
  end

  node interface do
    resolve_type(fn
      %Product{}, _ -> :product
      %Brand{}, _ -> :brand
      %User{}, _ -> :user
      %ComparisonSnapshot{}, _ -> :comparison_snapshot
      %ProductReview{}, _ -> :product_review
      %ProductThread{}, _ -> :product_question
      %ThreadPost{}, _ -> :product_answer
      %CJProgram{}, _ -> :cj_program
      %MerchantFeedCandidate{}, _ -> :merchant_feed_candidate
      %SpecificationCorrection{}, _ -> :specification_correction
      %PriceWatchRule{}, _ -> :price_watch
      %AlertEvent{}, _ -> :alert_event
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

  @impl true
  def context(context) do
    context =
      Map.put_new_lazy(context, :catalog_base_unit_symbol_cache_key, fn ->
        {CatalogResolver, :base_unit_symbols_by_dimension, make_ref()}
      end)

    context = Map.put_new_lazy(context, :graphql_observed_at, &DateTime.utc_now/0)

    Map.put_new_lazy(context, :loader, fn -> Loader.new(context) end)
  end

  @impl true
  def plugins do
    [Absinthe.Middleware.Dataloader] ++ Absinthe.Plugin.defaults()
  end

  query do
    import_fields(:accounts_queries)
    import_fields(:affiliate_queries)
    import_fields(:alerts_queries)
    import_fields(:catalog_queries)
    import_fields(:commerce_attribution_queries)
    import_fields(:comparison_snapshots_queries)
    import_fields(:discussions_queries)
    import_fields(:ingestion_queries)
    import_fields(:pricing_queries)
    import_fields(:seo_queries)
    import_fields(:specs_queries)

    @desc "Returns a supported node by global ID."
    node field do
      resolve(&NodeResolver.relay_node/2)
    end
  end

  mutation do
    import_fields(:accounts_mutations)
    import_fields(:affiliate_mutations)
    import_fields(:alerts_mutations)
    import_fields(:catalog_mutations)
    import_fields(:commerce_attribution_mutations)
    import_fields(:comparison_snapshots_mutations)
    import_fields(:discussions_mutations)
    import_fields(:ingestion_mutations)
    import_fields(:specs_mutations)
  end
end
