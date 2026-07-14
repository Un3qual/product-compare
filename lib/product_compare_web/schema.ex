defmodule ProductCompareWeb.Schema do
  use Absinthe.Schema

  import Absinthe.Resolution.Helpers, only: [dataloader: 2]
  import_types(Absinthe.Type.Custom)

  alias ProductCompare.Catalog
  alias ProductCompare.Pricing
  alias ProductCompareWeb.GraphQL.GlobalId
  alias ProductCompareWeb.GraphQL.Loader
  alias ProductCompareWeb.Resolvers.AffiliateResolver
  alias ProductCompareWeb.Resolvers.AlertsResolver
  alias ProductCompareWeb.Resolvers.AuthResolver
  alias ProductCompareWeb.Resolvers.CatalogResolver
  alias ProductCompareWeb.Resolvers.CommerceAttributionResolver
  alias ProductCompareWeb.Resolvers.IngestionResolver
  alias ProductCompareWeb.Resolvers.NodeResolver
  alias ProductCompareWeb.Resolvers.PricingResolver
  alias ProductCompareWeb.Resolvers.RecommendationsResolver
  alias ProductCompareWeb.Resolvers.SpecsResolver
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

  @impl true
  def context(context) do
    context =
      Map.put_new_lazy(context, :catalog_base_unit_symbol_cache_key, fn ->
        {CatalogResolver, :base_unit_symbols_by_dimension, make_ref()}
      end)

    Map.put_new_lazy(context, :loader, fn -> Loader.new(context) end)
  end

  @impl true
  def plugins do
    [Absinthe.Middleware.Dataloader] ++ Absinthe.Plugin.defaults()
  end

  query do
    @desc "Returns the current authenticated user, if any."
    field :viewer, :user do
      resolve(&AuthResolver.viewer/3)
    end

    @desc "Returns a supported node by global ID."
    field :node, :node do
      arg(:id, non_null(:id))

      resolve(&NodeResolver.node/3)
    end

    @desc "Returns safe display metadata for a source artifact."
    field :source_artifact, :source_artifact do
      arg(:id, non_null(:id))

      resolve(&SpecsResolver.source_artifact/3)
    end

    @desc "Returns specification corrections submitted by the current user."
    field :my_specification_corrections, non_null(:specification_correction_connection) do
      arg(:first, :integer)
      arg(:after, :string)
      arg(:status, :specification_correction_status)

      resolve(&SpecsResolver.my_specification_corrections/3)
    end

    @desc "Returns price watches owned by the current authenticated user."
    field :my_price_watches, non_null(:price_watch_connection) do
      arg(:first, :integer)
      arg(:after, :string)
      arg(:enabled, :boolean)

      resolve(&AlertsResolver.my_price_watches/3)
    end

    @desc "Returns in-app price alert events owned by the current user."
    field :my_alert_events, non_null(:alert_event_connection) do
      arg(:first, :integer)
      arg(:after, :string)
      arg(:unread_only, :boolean)

      resolve(&AlertsResolver.my_alert_events/3)
    end

    @desc "Returns the operator-only specification correction moderation queue."
    field :specification_correction_moderation_queue,
          non_null(:specification_correction_connection) do
      arg(:first, :integer)
      arg(:after, :string)
      arg(:status, :specification_correction_status)

      resolve(&SpecsResolver.specification_correction_moderation_queue/3)
    end

    @desc "Returns API tokens owned by the current authenticated user."
    field :my_api_tokens, non_null(:api_token_connection) do
      arg(:first, :integer)
      arg(:after, :string)
      arg(:status, :api_token_status_filter)

      resolve(&AuthResolver.my_api_tokens/3)
    end

    @desc "Returns active coupons for a merchant at a specific timestamp (or now by default)."
    field :active_coupons, :active_coupons_payload do
      arg(:input, non_null(:active_coupons_input))

      resolve(&AffiliateResolver.active_coupons/3)
    end

    @desc "Returns aggregate commerce revenue metrics with public-safe suppression metadata."
    field :revenue_summary, :revenue_summary do
      arg(:input, :revenue_summary_input)

      resolve(&CommerceAttributionResolver.revenue_summary/3)
    end

    @desc "Returns a single product by slug."
    field :product, :product do
      arg(:slug, non_null(:string))

      resolve(&CatalogResolver.product/3)
    end

    @desc "Returns one product or null for each requested comparison slug, in requested order."
    field :comparison_products, non_null(list_of(:product)) do
      arg(:slugs, non_null(list_of(non_null(:string))))

      resolve(&CatalogResolver.comparison_products/3)
    end

    @desc "Returns deterministic source-backed guidance for two or three products."
    field :comparison_recommendation, non_null(:comparison_recommendation) do
      arg(:slugs, non_null(list_of(non_null(:string))))
      arg(:profile, non_null(:recommendation_profile))
      resolve(&RecommendationsResolver.comparison_recommendation/3)
    end

    @desc "Returns products in a deterministic requested order with cursor pagination."
    field :products, :product_connection do
      arg(:first, :integer)
      arg(:after, :string)
      arg(:filters, :product_filters_input)

      resolve(&CatalogResolver.products/3)
    end

    @desc "Returns display-safe metadata for product filter controls."
    field :product_filter_metadata, non_null(:product_filter_metadata) do
      arg(:filters, :product_filters_input)

      resolve(&CatalogResolver.product_filter_metadata/3)
    end

    @desc "Returns the current authenticated user's saved comparison sets."
    field :my_saved_comparison_sets, :saved_comparison_set_connection do
      arg(:first, :integer)
      arg(:after, :string)

      resolve(&CatalogResolver.my_saved_comparison_sets/3)
    end

    @desc "Returns merchants ordered by primary key with cursor pagination."
    field :merchants, :merchant_connection do
      arg(:first, :integer)
      arg(:after, :string)

      resolve(&PricingResolver.merchants/3)
    end

    @desc "Returns captured merchant feed candidates with review-safe metadata."
    field :merchant_feed_candidates, :merchant_feed_candidate_connection do
      arg(:first, :integer)
      arg(:after, :string)
      arg(:review_status, :merchant_feed_candidate_review_status)
      arg(:sort, :merchant_feed_candidate_sort)

      resolve(&IngestionResolver.merchant_feed_candidates/3)
    end

    @desc "Returns merchant products for a product with optional merchant and active filters."
    field :merchant_products, :merchant_product_connection do
      arg(:input, non_null(:merchant_products_input))

      resolve(&PricingResolver.merchant_products/3)
    end
  end

  mutation do
    @desc "Creates a new user session by registering an email/password account."
    field :register, non_null(:auth_session_payload) do
      arg(:email, non_null(:string))
      arg(:password, non_null(:string))

      resolve(&AuthResolver.register/3)
    end

    @desc "Creates a new user session from email/password credentials."
    field :login, non_null(:auth_session_payload) do
      arg(:email, non_null(:string))
      arg(:password, non_null(:string))

      resolve(&AuthResolver.login/3)
    end

    @desc "Deletes the current browser session."
    field :logout, non_null(:logout_payload) do
      resolve(&AuthResolver.logout/3)
    end

    @desc "Requests a password reset email for an existing account."
    field :forgot_password, non_null(:auth_action_payload) do
      arg(:email, non_null(:string))

      resolve(&AuthResolver.forgot_password/3)
    end

    @desc "Resets an account password using a previously issued reset token."
    field :reset_password, non_null(:auth_action_payload) do
      arg(:token, non_null(:string))
      arg(:password, non_null(:string))

      resolve(&AuthResolver.reset_password/3)
    end

    @desc "Confirms an account email using a previously issued verification token."
    field :verify_email, non_null(:auth_action_payload) do
      arg(:token, non_null(:string))

      resolve(&AuthResolver.verify_email/3)
    end

    @desc "Creates a new API token for the current authenticated user."
    field :create_api_token, non_null(:create_api_token_payload) do
      arg(:label, :string)
      arg(:expires_at, :datetime)

      resolve(&AuthResolver.create_api_token/3)
    end

    @desc "Revokes one of the current authenticated user's API tokens."
    field :revoke_api_token, non_null(:revoke_api_token_payload) do
      arg(:token_id, non_null(:id))

      resolve(&AuthResolver.revoke_api_token/3)
    end

    @desc "Rotates one of the current authenticated user's API tokens."
    field :rotate_api_token, non_null(:create_api_token_payload) do
      arg(:token_id, non_null(:id))
      arg(:label, :string)
      arg(:expires_at, :datetime)

      resolve(&AuthResolver.rotate_api_token/3)
    end

    @desc "Creates a first-party tracked outbound commerce click."
    field :track_commerce_click, non_null(:track_commerce_click_payload) do
      arg(:input, non_null(:track_commerce_click_input))

      resolve(&CommerceAttributionResolver.track_commerce_click/3)
    end

    @desc "Proposes an authenticated, typed replacement for a product specification."
    field :propose_specification_correction,
          non_null(:specification_correction_payload) do
      arg(:input, non_null(:propose_specification_correction_input))

      resolve(&SpecsResolver.propose_specification_correction/3)
    end

    @desc "Accepts or rejects a specification correction as an operator."
    field :moderate_specification_correction,
          non_null(:specification_correction_payload) do
      arg(:input, non_null(:moderate_specification_correction_input))

      resolve(&SpecsResolver.moderate_specification_correction/3)
    end

    @desc "Creates a product or offer price watch for the current user."
    field :create_price_watch, non_null(:price_watch_payload) do
      arg(:input, non_null(:create_price_watch_input))
      resolve(&AlertsResolver.create_price_watch/3)
    end

    @desc "Updates one of the current user's price watches."
    field :update_price_watch, non_null(:price_watch_payload) do
      arg(:input, non_null(:update_price_watch_input))
      resolve(&AlertsResolver.update_price_watch/3)
    end

    @desc "Deletes one of the current user's price watches."
    field :delete_price_watch, non_null(:delete_price_watch_payload) do
      arg(:id, non_null(:id))
      resolve(&AlertsResolver.delete_price_watch/3)
    end

    @desc "Marks one of the current user's in-app alert events as read."
    field :mark_alert_read, non_null(:alert_event_payload) do
      arg(:id, non_null(:id))
      resolve(&AlertsResolver.mark_alert_read/3)
    end

    @desc "Upserts an affiliate network by name."
    field :upsert_affiliate_network, :upsert_affiliate_network_payload do
      arg(:input, non_null(:upsert_affiliate_network_input))

      resolve(&AffiliateResolver.upsert_affiliate_network/3)
    end

    @desc "Upserts an affiliate program by affiliate network and merchant."
    field :upsert_affiliate_program, :upsert_affiliate_program_payload do
      arg(:input, non_null(:upsert_affiliate_program_input))

      resolve(&AffiliateResolver.upsert_affiliate_program/3)
    end

    @desc "Upserts an affiliate link by merchant product."
    field :upsert_affiliate_link, :upsert_affiliate_link_payload do
      arg(:input, non_null(:upsert_affiliate_link_input))

      resolve(&AffiliateResolver.upsert_affiliate_link/3)
    end

    @desc "Creates a coupon for a merchant."
    field :create_coupon, :create_coupon_payload do
      arg(:input, non_null(:create_coupon_input))

      resolve(&AffiliateResolver.create_coupon/3)
    end

    @desc "Updates review status for a captured merchant feed candidate."
    field :review_merchant_feed_candidate, non_null(:review_merchant_feed_candidate_payload) do
      arg(:input, non_null(:review_merchant_feed_candidate_input))

      resolve(&IngestionResolver.review_merchant_feed_candidate/3)
    end

    @desc "Creates a private saved comparison set for the current authenticated user."
    field :create_saved_comparison_set, non_null(:saved_comparison_set_payload) do
      arg(:input, non_null(:create_saved_comparison_set_input))

      resolve(&CatalogResolver.create_saved_comparison_set/3)
    end

    @desc "Deletes one of the current authenticated user's saved comparison sets."
    field :delete_saved_comparison_set, non_null(:saved_comparison_set_payload) do
      arg(:saved_comparison_set_id, non_null(:id))

      resolve(&CatalogResolver.delete_saved_comparison_set/3)
    end
  end

  input_object :upsert_affiliate_network_input do
    field :name, non_null(:string)
  end

  input_object :track_commerce_click_input do
    field :merchant_product_id, non_null(:id)
  end

  input_object :revenue_summary_input do
    field :merchant_id, :id
    field :product_id, :id
    field :network, :string
    field :currency, :string
    field :from, :string
    field :to, :string
  end

  object :revenue_summary do
    field :filters, non_null(:revenue_summary_filters)
    field :metrics, non_null(:revenue_summary_metrics)
    field :suppression, non_null(:revenue_summary_suppression)
  end

  object :revenue_summary_filters do
    field :currency, :string
    field :from, :string
    field :merchant_id, :id
    field :network, :string
    field :product_id, :id
    field :to, :string
  end

  object :revenue_summary_metrics do
    field :average_paid_price, :string
    field :clicks, :integer
    field :commission_revenue, :string
    field :conversions, :integer
    field :currency, :string
    field :gross_order_value, :string
  end

  object :revenue_summary_suppression do
    field :suppressed, non_null(:boolean)
    field :threshold, non_null(:integer)
  end

  input_object :upsert_affiliate_program_input do
    field :affiliate_network_id, non_null(:id)
    field :merchant_id, non_null(:id)
    field :program_code, :string
    field :status, :string
  end

  input_object :upsert_affiliate_link_input do
    field :merchant_product_id, non_null(:id)
    field :affiliate_network_id, :id
    field :original_url, non_null(:string)
    field :affiliate_url, non_null(:string)
    field :last_verified_at, :datetime
  end

  input_object :create_coupon_input do
    field :merchant_id, non_null(:id)
    field :affiliate_network_id, :id
    field :artifact_id, :id
    field :code, non_null(:string)
    field :description, :string
    field :discount_type, non_null(:coupon_discount_type)
    field :discount_value, :decimal
    field :currency, :string
    field :valid_from, :datetime
    field :valid_to, :datetime
    field :terms, :string
  end

  input_object :active_coupons_input do
    field :merchant_id, non_null(:id)
    field :at, :datetime
    field :first, :integer
    field :after, :string
  end

  input_object :specification_correction_value_input do
    field :value_bool, :boolean
    field :value_int, :integer
    field :value_num, :decimal
    field :value_text, :string
    field :value_date, :date
    field :value_timestamp, :datetime
    field :unit_id, :id
    field :enum_option_id, :id
  end

  input_object :propose_specification_correction_input do
    field :product_id, non_null(:id)
    field :attribute_id, non_null(:id)
    field :value, non_null(:specification_correction_value_input)
    field :reason, non_null(:string)
    field :source_url, :string
    field :explanation, :string
  end

  input_object :moderate_specification_correction_input do
    field :id, non_null(:id)
    field :decision, non_null(:specification_correction_status)
    field :moderation_note, :string
  end

  enum :price_watch_rule_type do
    value(:target_price)
    value(:percentage_drop)
    value(:back_in_stock)
    value(:newly_available)
  end

  input_object :create_price_watch_input do
    field :product_id, non_null(:id)
    field :merchant_product_id, :id
    field :rule_type, non_null(:price_watch_rule_type)
    field :currency, non_null(:string)
    field :target_amount, :decimal
    field :percentage_drop, :decimal
    field :cooldown_seconds, :integer
  end

  input_object :update_price_watch_input do
    field :id, non_null(:id)
    field :target_amount, :decimal
    field :percentage_drop, :decimal
    field :enabled, :boolean
    field :cooldown_seconds, :integer
  end

  input_object :merchant_products_input do
    field :product_id, non_null(:id)
    field :merchant_id, :id
    field :active_only, :boolean
    field :first, :integer
    field :after, :string
  end

  input_object :review_merchant_feed_candidate_input do
    field :id, non_null(:id)
    field :status, non_null(:merchant_feed_candidate_review_status)
    field :note, :string
  end

  input_object :product_numeric_filter_input do
    field :attribute_id, non_null(:id)
    field :min, :decimal
    field :max, :decimal
  end

  input_object :product_boolean_filter_input do
    field :attribute_id, non_null(:id)
    field :value, non_null(:boolean)
  end

  input_object :product_enum_filter_input do
    field :attribute_id, non_null(:id)
    field :enum_option_id, non_null(:id)
  end

  enum :product_sort do
    value(:id_asc)
    value(:name_asc)
    value(:brand_name_asc)
    value(:newest)
  end

  enum :recommendation_profile do
    value(:lowest_current_cost)
    value(:best_value)
  end

  enum :recommendation_status do
    value(:winner)
    value(:tie)
    value(:insufficient_evidence)
  end

  object :comparison_recommendation do
    field :profile, non_null(:recommendation_profile)
    field :algorithm_version, non_null(:string)
    field :evaluated_at, non_null(:datetime)
    field :status, non_null(:recommendation_status)
    field :currency, :string
    field :missing_inputs, non_null(list_of(non_null(:string)))

    field :winner_product_id, :id do
      resolve(fn recommendation, _, _ ->
        GlobalId.encode_optional(:product, recommendation.winner_product_id)
      end)
    end

    field :rankings, non_null(list_of(non_null(:recommendation_ranking)))
  end

  object :recommendation_ranking do
    field :rank, non_null(:integer)
    field :product_name, non_null(:string)
    field :landed_price, non_null(:decimal)
    field :currency, non_null(:string)
    field :reasons, non_null(list_of(non_null(:string)))

    field :product_id, non_null(:id) do
      resolve(fn ranking, _, _ -> GlobalId.encode_required(:product, ranking.product_id) end)
    end

    field :price_point_id, non_null(:id) do
      resolve(fn ranking, _, _ ->
        GlobalId.encode_required(:price_point, ranking.price_point_id)
      end)
    end

    field :merchant_product_id, non_null(:id) do
      resolve(fn ranking, _, _ ->
        GlobalId.encode_required(:merchant_product, ranking.merchant_product_id)
      end)
    end

    field :claim_ids, non_null(list_of(non_null(:id))) do
      resolve(fn ranking, _, _ ->
        {:ok, Enum.map(ranking.claim_ids, &GlobalId.encode(:product_attribute_claim, &1))}
      end)
    end
  end

  input_object :product_filters_input do
    field :query, :string
    field :sort, :product_sort
    field :primary_type_taxon_id, :id
    field :include_type_descendants, :boolean
    field :numeric, list_of(non_null(:product_numeric_filter_input))
    field :booleans, list_of(non_null(:product_boolean_filter_input))
    field :enums, list_of(non_null(:product_enum_filter_input))
    field :use_case_taxon_ids, list_of(non_null(:id))
  end

  object :product_filter_metadata do
    field :result_count, non_null(:integer)
    field :type_options, non_null(list_of(non_null(:product_filter_option)))
    field :use_case_options, non_null(list_of(non_null(:product_filter_option)))
    field :numeric_filters, non_null(list_of(non_null(:product_numeric_filter_metadata)))
    field :boolean_filters, non_null(list_of(non_null(:product_boolean_filter_metadata)))
    field :enum_filters, non_null(list_of(non_null(:product_enum_filter_metadata)))
  end

  object :product_filter_option do
    field :id, non_null(:id) do
      resolve(fn option, _, _ -> GlobalId.encode_required(option.id_type, option.id) end)
    end

    field :label, non_null(:string)
    field :count, non_null(:integer)
    field :selected, non_null(:boolean)
    field :disabled, non_null(:boolean)
  end

  object :product_numeric_filter_metadata do
    field :attribute_id, non_null(:id) do
      resolve(fn metadata, _, _ ->
        GlobalId.encode_required(:attribute, metadata.attribute_id)
      end)
    end

    field :code, non_null(:string)
    field :display_name, non_null(:string)
    field :unit_symbol, :string
    field :min, :decimal
    field :max, :decimal
    field :selected_min, :decimal
    field :selected_max, :decimal
  end

  object :product_boolean_filter_metadata do
    field :attribute_id, non_null(:id) do
      resolve(fn metadata, _, _ ->
        GlobalId.encode_required(:attribute, metadata.attribute_id)
      end)
    end

    field :code, non_null(:string)
    field :display_name, non_null(:string)
    field :true_count, non_null(:integer)
    field :false_count, non_null(:integer)
    field :selected_value, :boolean
  end

  object :product_enum_filter_metadata do
    field :attribute_id, non_null(:id) do
      resolve(fn metadata, _, _ ->
        GlobalId.encode_required(:attribute, metadata.attribute_id)
      end)
    end

    field :code, non_null(:string)
    field :display_name, non_null(:string)
    field :options, non_null(list_of(non_null(:product_filter_option)))
  end

  input_object :create_saved_comparison_set_input do
    field :name, non_null(:string)
    field :product_ids, non_null(list_of(non_null(:id)))
  end

  object :upsert_affiliate_network_payload do
    field :network, :affiliate_network
    field :errors, non_null(list_of(non_null(:mutation_error)))
  end

  object :upsert_affiliate_program_payload do
    field :program, :affiliate_program
    field :errors, non_null(list_of(non_null(:mutation_error)))
  end

  object :upsert_affiliate_link_payload do
    field :link, :affiliate_link
    field :errors, non_null(list_of(non_null(:mutation_error)))
  end

  object :create_coupon_payload do
    field :coupon, :coupon
    field :errors, non_null(list_of(non_null(:mutation_error)))
  end

  object :saved_comparison_set_payload do
    field :saved_comparison_set, :saved_comparison_set
    field :errors, non_null(list_of(non_null(:mutation_error)))
  end

  object :specification_correction_payload do
    field :correction, :specification_correction
    field :errors, non_null(list_of(non_null(:mutation_error)))
  end

  object :price_watch_payload do
    field :watch, :price_watch
    field :errors, non_null(list_of(non_null(:mutation_error)))
  end

  object :delete_price_watch_payload do
    field :deleted_watch_id, :id
    field :errors, non_null(list_of(non_null(:mutation_error)))
  end

  object :alert_event_payload do
    field :event, :alert_event
    field :errors, non_null(list_of(non_null(:mutation_error)))
  end

  object :track_commerce_click_payload do
    field :redirect_path, :string
    field :errors, non_null(list_of(non_null(:mutation_error)))
  end

  object :active_coupons_payload do
    field :coupons, non_null(:coupon_connection)
  end

  object :affiliate_network do
    interface(:node)

    field :id, non_null(:id) do
      resolve(fn network, _, _ -> GlobalId.encode_required(:affiliate_network, network.id) end)
    end

    field :name, non_null(:string)
    field :inserted_at, non_null(:datetime)
    field :updated_at, non_null(:datetime)
  end

  object :affiliate_program do
    interface(:node)

    field :id, non_null(:id) do
      resolve(fn program, _, _ -> GlobalId.encode_required(:affiliate_program, program.id) end)
    end

    field :affiliate_network_id, non_null(:id) do
      resolve(fn program, _, _ ->
        GlobalId.encode_required(:affiliate_network, program.affiliate_network_id)
      end)
    end

    field :merchant_id, non_null(:id) do
      resolve(fn program, _, _ -> GlobalId.encode_required(:merchant, program.merchant_id) end)
    end

    field :program_code, :string
    field :status, :string
    field :inserted_at, non_null(:datetime)
    field :updated_at, non_null(:datetime)
  end

  object :affiliate_link do
    interface(:node)

    field :id, non_null(:id) do
      resolve(fn link, _, _ -> GlobalId.encode_required(:affiliate_link, link.id) end)
    end

    field :merchant_product_id, non_null(:id) do
      resolve(fn link, _, _ ->
        GlobalId.encode_required(:merchant_product, link.merchant_product_id)
      end)
    end

    field :affiliate_network_id, :id do
      resolve(fn link, _, _ ->
        GlobalId.encode_optional(:affiliate_network, link.affiliate_network_id)
      end)
    end

    field :original_url, non_null(:string)
    field :affiliate_url, non_null(:string)
    field :last_verified_at, :datetime
    field :inserted_at, non_null(:datetime)
    field :updated_at, non_null(:datetime)
  end

  object :coupon do
    interface(:node)

    field :id, non_null(:id) do
      resolve(fn coupon, _, _ -> GlobalId.encode_required(:coupon, coupon.id) end)
    end

    field :merchant_id, non_null(:id) do
      resolve(fn coupon, _, _ -> GlobalId.encode_required(:merchant, coupon.merchant_id) end)
    end

    field :affiliate_network_id, :id do
      resolve(fn coupon, _, _ ->
        GlobalId.encode_optional(:affiliate_network, coupon.affiliate_network_id)
      end)
    end

    field :artifact_id, :id do
      resolve(fn coupon, _, _ ->
        GlobalId.encode_optional(:source_artifact, coupon.artifact_id)
      end)
    end

    field :code, non_null(:string)
    field :description, :string
    field :discount_type, non_null(:coupon_discount_type)
    field :discount_value, :decimal
    field :currency, :string
    field :valid_from, :datetime
    field :valid_to, :datetime
    field :terms, :string
    field :inserted_at, non_null(:datetime)
    field :updated_at, non_null(:datetime)
  end

  object :source_artifact do
    interface(:node)

    field :id, non_null(:id) do
      resolve(fn artifact, _, _ -> GlobalId.encode_required(:source_artifact, artifact.id) end)
    end

    field :source_kind, non_null(:string) do
      resolve(fn %{source: %{kind: kind}}, _, _ -> {:ok, kind} end)
    end

    field :source_name, non_null(:string) do
      resolve(fn %{source: %{name: name}}, _, _ -> {:ok, name} end)
    end

    field :source_domain, :string do
      resolve(fn %{source: source}, _, _ -> {:ok, source.domain} end)
    end

    field :url, :string
    field :fetched_at, non_null(:datetime)
  end

  object :coupon_connection do
    field :edges, non_null(list_of(non_null(:coupon_edge)))
    field :page_info, non_null(:page_info)
  end

  object :coupon_edge do
    field :cursor, non_null(:string)
    field :node, non_null(:coupon)
  end

  object :active_coupon do
    field :code, non_null(:string)
    field :description, :string
    field :discount_type, non_null(:coupon_discount_type)
    field :discount_value, :decimal
    field :currency, :string
    field :valid_to, :datetime
    field :terms, :string
  end

  object :active_coupon_connection do
    field :edges, non_null(list_of(non_null(:active_coupon_edge)))
    field :page_info, non_null(:page_info)
  end

  object :active_coupon_edge do
    field :cursor, non_null(:string)
    field :node, non_null(:active_coupon)
  end

  enum :coupon_discount_type do
    value(:percent)
    value(:amount)
    value(:free_shipping)
    value(:other)
  end

  object :create_api_token_payload do
    field :plain_text_token, :string
    field :api_token, :api_token
    field :errors, non_null(list_of(non_null(:mutation_error)))
  end

  object :auth_session_payload do
    field :viewer, :user
    field :errors, non_null(list_of(non_null(:mutation_error)))
  end

  object :logout_payload do
    field :ok, non_null(:boolean)
    field :errors, non_null(list_of(non_null(:mutation_error)))
  end

  object :auth_action_payload do
    field :ok, non_null(:boolean)
    field :errors, non_null(list_of(non_null(:mutation_error)))
  end

  object :revoke_api_token_payload do
    field :api_token, :api_token
    field :errors, non_null(list_of(non_null(:mutation_error)))
  end

  object :review_merchant_feed_candidate_payload do
    field :candidate, :merchant_feed_candidate
    field :errors, non_null(list_of(non_null(:mutation_error)))
  end

  object :mutation_error do
    field :code, non_null(:string)
    field :message, non_null(:string)
    field :field, :string
  end

  object :user do
    field :id, non_null(:id) do
      resolve(fn user, _, _ -> {:ok, GlobalId.encode(:user, user.entropy_id)} end)
    end

    field :email, non_null(:string)
    field :is_operator, non_null(:boolean)
  end

  object :api_token do
    interface(:node)

    field :id, non_null(:id) do
      resolve(fn api_token, _, _ -> {:ok, GlobalId.encode(:api_token, api_token.entropy_id)} end)
    end

    field :label, :string
    field :token_prefix, non_null(:string)
    field :last_used_at, :datetime
    field :expires_at, :datetime
    field :revoked_at, :datetime
    field :inserted_at, non_null(:datetime)
  end

  object :api_token_connection do
    field :edges, non_null(list_of(non_null(:api_token_edge)))
    field :page_info, non_null(:page_info)
  end

  object :saved_comparison_set do
    interface(:node)

    field :id, non_null(:id) do
      resolve(fn saved_comparison_set, _, _ ->
        GlobalId.encode_required(:saved_comparison_set, saved_comparison_set.entropy_id)
      end)
    end

    field :name, non_null(:string)

    field :items, non_null(list_of(non_null(:saved_comparison_item))),
      resolve: dataloader(Catalog, use_parent: true)

    field :inserted_at, non_null(:datetime)
    field :updated_at, non_null(:datetime)
  end

  object :saved_comparison_item do
    field :position, non_null(:integer)
    field :product, non_null(:product), resolve: dataloader(Catalog, use_parent: true)
    field :inserted_at, non_null(:datetime)
  end

  object :saved_comparison_set_connection do
    field :edges, non_null(list_of(non_null(:saved_comparison_set_edge)))
    field :page_info, non_null(:page_info)
  end

  object :saved_comparison_set_edge do
    field :cursor, non_null(:string)
    field :node, non_null(:saved_comparison_set)
  end

  object :api_token_edge do
    field :cursor, non_null(:string)
    field :node, non_null(:api_token)
  end

  enum :api_token_status_filter do
    value(:active)
    value(:revoked)
    value(:all)
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

  object :brand do
    interface(:node)

    field :id, non_null(:id) do
      resolve(fn brand, _, _ -> GlobalId.encode_required(:brand, brand.id) end)
    end

    field :name, non_null(:string)
  end

  object :merchant do
    interface(:node)

    field :id, non_null(:id) do
      resolve(fn merchant, _, _ -> GlobalId.encode_required(:merchant, merchant.id) end)
    end

    field :name, non_null(:string)
    field :domain, non_null(:string)
    field :inserted_at, non_null(:datetime)
    field :updated_at, non_null(:datetime)
  end

  object :merchant_connection do
    field :edges, non_null(list_of(non_null(:merchant_edge)))
    field :page_info, non_null(:page_info)
  end

  object :merchant_edge do
    field :cursor, non_null(:string)
    field :node, non_null(:merchant)
  end

  object :merchant_feed_candidate do
    field :id, non_null(:id) do
      resolve(fn candidate, _, _ ->
        GlobalId.encode_required(:merchant_feed_candidate, candidate.id)
      end)
    end

    field :provider, non_null(:string)
    field :provider_feed_id, non_null(:string)
    field :advertiser_id, :string
    field :advertiser_name, :string
    field :advertiser_country, :string
    field :source_feed_type, :string
    field :currency, :string
    field :language, :string
    field :feed_name, :string
    field :product_count, :integer
    field :provider_last_updated_at, :datetime
    field :last_seen_at, non_null(:datetime)
    field :review_status, non_null(:merchant_feed_candidate_review_status)
    field :review_note, :string
    field :reviewed_at, :datetime
  end

  object :merchant_feed_candidate_connection do
    field :edges, non_null(list_of(non_null(:merchant_feed_candidate_edge)))
    field :page_info, non_null(:page_info)
  end

  object :merchant_feed_candidate_edge do
    field :cursor, non_null(:string)
    field :node, non_null(:merchant_feed_candidate)
  end

  enum :merchant_feed_candidate_review_status do
    value(:pending, as: "pending")
    value(:shortlisted, as: "shortlisted")
    value(:dismissed, as: "dismissed")
  end

  enum :merchant_feed_candidate_sort do
    value(:name_asc, as: :name_asc)
    value(:product_count_desc, as: :product_count_desc)
    value(:last_seen_desc, as: :last_seen_desc)
    value(:fit_score_desc, as: :fit_score_desc)
  end

  object :product do
    interface(:node)

    field :id, non_null(:id) do
      resolve(fn product, _, _ -> GlobalId.encode_required(:product, product.id) end)
    end

    field :name, non_null(:string)
    field :slug, non_null(:string)
    field :model_number, :string
    field :description, :string
    field :brand, :brand, resolve: dataloader(Catalog, use_parent: true)

    field :media, non_null(list_of(non_null(:product_media))),
      resolve: dataloader(Catalog, use_parent: true)

    field :current_attributes, non_null(list_of(non_null(:product_attribute_value))) do
      resolve(&CatalogResolver.current_attributes/3)
    end

    field :offer_truth, non_null(:product_offer_truth) do
      resolve(&PricingResolver.product_offer_truth/3)
    end

    field :merchant_products, :merchant_product_connection do
      arg(:first, :integer)
      arg(:after, :string)
      arg(:merchant_id, :id)
      arg(:active_only, :boolean)

      resolve(&PricingResolver.product_merchant_products/3)
    end
  end

  object :product_media do
    field :url, non_null(:string)
    field :role, non_null(:string)
    field :position, non_null(:integer)
    field :alt_text, :string
    field :observed_at, non_null(:datetime)
    field :source_artifact, non_null(:source_artifact)
  end

  object :product_attribute_value do
    field :attribute_id, non_null(:id)
    field :code, non_null(:string)
    field :display_name, non_null(:string)
    field :data_type, non_null(:string)
    field :value_text, non_null(:string)
    field :sort_order, :integer
    field :group_label, :string
    field :is_required, non_null(:boolean)
    field :numeric_value, :decimal
    field :boolean_value, :boolean
    field :enum_option_id, :id
    field :unit_symbol, :string
    field :claim_id, non_null(:id)
    field :claim_status, non_null(:string)
    field :source_type, non_null(:string)
    field :confidence, :decimal
    field :pending_correction_count, non_null(:integer)
    field :accepted_correction_count, non_null(:integer)
    field :evidence, non_null(list_of(non_null(:product_attribute_evidence)))
  end

  enum :specification_correction_status do
    value(:pending)
    value(:accepted)
    value(:rejected)
  end

  object :specification_correction do
    field :id, non_null(:id) do
      resolve(fn correction, _, _ ->
        GlobalId.encode_required(:specification_correction, correction.id)
      end)
    end

    field :product_id, non_null(:id) do
      resolve(fn correction, _, _ ->
        GlobalId.encode_required(:product, correction.product_id)
      end)
    end

    field :attribute_id, non_null(:id) do
      resolve(fn correction, _, _ ->
        GlobalId.encode_required(:attribute, correction.attribute_id)
      end)
    end

    field :claim_id, non_null(:id) do
      resolve(fn correction, _, _ ->
        GlobalId.encode_required(:product_attribute_claim, correction.claim_id)
      end)
    end

    field :status, non_null(:specification_correction_status)
    field :reason, non_null(:string)
    field :source_url, :string
    field :explanation, :string
    field :value_text, non_null(:string), resolve: &SpecsResolver.correction_value_text/3
    field :moderation_note, :string, resolve: &SpecsResolver.moderation_note/3

    field :submitted_at, non_null(:datetime),
      resolve: fn correction, _, _ -> {:ok, correction.inserted_at} end

    field :reviewed_at, :datetime
  end

  object :specification_correction_connection do
    field :edges, non_null(list_of(non_null(:specification_correction_edge)))
    field :page_info, non_null(:page_info)
  end

  object :specification_correction_edge do
    field :cursor, non_null(:string)
    field :node, non_null(:specification_correction)
  end

  object :price_watch do
    field :id, non_null(:id) do
      resolve(fn watch, _, _ -> GlobalId.encode_required(:price_watch, watch.entropy_id) end)
    end

    field :product_id, non_null(:id) do
      resolve(fn watch, _, _ -> GlobalId.encode_required(:product, watch.product_id) end)
    end

    field :merchant_product_id, :id do
      resolve(fn watch, _, _ ->
        GlobalId.encode_optional(:merchant_product, watch.merchant_product_id)
      end)
    end

    field :product_name, non_null(:string),
      resolve: fn watch, _, _ -> {:ok, watch.product.name} end

    field :product_slug, non_null(:string),
      resolve: fn watch, _, _ -> {:ok, watch.product.slug} end

    field :merchant_name, :string,
      resolve: fn watch, _, _ ->
        {:ok, watch.merchant_product && watch.merchant_product.merchant.name}
      end

    field :rule_type, non_null(:price_watch_rule_type)
    field :currency, non_null(:string)
    field :target_amount, :decimal
    field :percentage_drop, :decimal
    field :baseline_landed_price, :decimal
    field :enabled, non_null(:boolean)
    field :cooldown_seconds, non_null(:integer)
    field :last_evaluated_at, :datetime

    field :created_at, non_null(:datetime),
      resolve: fn watch, _, _ -> {:ok, watch.inserted_at} end
  end

  object :price_watch_connection do
    field :edges, non_null(list_of(non_null(:price_watch_edge)))
    field :page_info, non_null(:page_info)
  end

  object :price_watch_edge do
    field :cursor, non_null(:string)
    field :node, non_null(:price_watch)
  end

  object :alert_event do
    field :id, non_null(:id) do
      resolve(fn event, _, _ -> GlobalId.encode_required(:alert_event, event.entropy_id) end)
    end

    field :rule_type, non_null(:price_watch_rule_type)
    field :currency, non_null(:string)
    field :item_price, non_null(:decimal)
    field :shipping, non_null(:decimal)
    field :landed_price, non_null(:decimal)
    field :observed_at, non_null(:datetime)
    field :read_at, :datetime

    field :created_at, non_null(:datetime),
      resolve: fn event, _, _ -> {:ok, event.inserted_at} end

    field :triggering_price_point_id, non_null(:id) do
      resolve(fn event, _, _ ->
        GlobalId.encode_required(:price_point, event.triggering_price_point_id)
      end)
    end

    field :merchant_product_id, non_null(:id) do
      resolve(fn event, _, _ ->
        GlobalId.encode_required(:merchant_product, event.merchant_product_id)
      end)
    end

    field :product_name, non_null(:string),
      resolve: fn event, _, _ -> {:ok, event.merchant_product.product.name} end

    field :product_slug, non_null(:string),
      resolve: fn event, _, _ -> {:ok, event.merchant_product.product.slug} end

    field :merchant_name, non_null(:string),
      resolve: fn event, _, _ -> {:ok, event.merchant_product.merchant.name} end
  end

  object :alert_event_connection do
    field :edges, non_null(list_of(non_null(:alert_event_edge)))
    field :page_info, non_null(:page_info)
  end

  object :alert_event_edge do
    field :cursor, non_null(:string)
    field :node, non_null(:alert_event)
  end

  object :product_attribute_evidence do
    field :excerpt, :string
    field :source_artifact, non_null(:source_artifact)
  end

  object :merchant_product do
    interface(:node)

    field :id, non_null(:id) do
      resolve(fn merchant_product, _, _ ->
        GlobalId.encode_required(:merchant_product, merchant_product.id)
      end)
    end

    field :merchant_id, non_null(:id) do
      resolve(fn merchant_product, _, _ ->
        GlobalId.encode_required(:merchant, merchant_product.merchant_id)
      end)
    end

    field :product_id, non_null(:id) do
      resolve(fn merchant_product, _, _ ->
        GlobalId.encode_required(:product, merchant_product.product_id)
      end)
    end

    field :external_sku, :string
    field :url, non_null(:string)
    field :currency, non_null(:string)
    field :last_seen_at, :datetime
    field :is_active, non_null(:boolean)
    field :merchant, :merchant, resolve: dataloader(Pricing, use_parent: true)
    field :product, :product, resolve: dataloader(Pricing, use_parent: true)
    field :latest_price, :price_point, resolve: &PricingResolver.latest_price/3

    field :active_coupons, :active_coupon_connection do
      arg(:first, :integer)
      arg(:after, :string)

      resolve(&AffiliateResolver.merchant_product_active_coupons/3)
    end

    field :price_history, :price_point_connection do
      arg(:first, :integer)
      arg(:after, :string)
      arg(:from, :datetime)
      arg(:to, :datetime)

      resolve(&PricingResolver.price_history/3)
    end

    field :inserted_at, non_null(:datetime)
    field :updated_at, non_null(:datetime)
  end

  object :price_point do
    interface(:node)

    field :id, non_null(:id) do
      resolve(fn price_point, _, _ -> GlobalId.encode_required(:price_point, price_point.id) end)
    end

    field :merchant_product_id, non_null(:id) do
      resolve(fn price_point, _, _ ->
        GlobalId.encode_required(:merchant_product, price_point.merchant_product_id)
      end)
    end

    field :observed_at, non_null(:datetime)
    field :price, non_null(:decimal)
    field :shipping, :decimal
    field :in_stock, :boolean

    field :source_artifact, :source_artifact do
      resolve(&PricingResolver.source_artifact/3)
    end

    field :inserted_at, non_null(:datetime)
    field :updated_at, :datetime
  end

  object :product_offer_truth do
    field :as_of, non_null(:datetime)
    field :fresh_for_seconds, non_null(:integer)
    field :stale_after_seconds, non_null(:integer)
    field :offer_count, non_null(:integer)
    field :observed_offer_count, non_null(:integer)
    field :eligible_offer_count, non_null(:integer)
    field :currency_summaries, non_null(list_of(non_null(:offer_currency_summary)))
  end

  object :offer_currency_summary do
    field :currency, non_null(:string)
    field :offer_count, non_null(:integer)
    field :observed_offer_count, non_null(:integer)
    field :eligible_offer_count, non_null(:integer)
    field :best_offer, :current_offer
  end

  object :current_offer do
    field :merchant_product_id, non_null(:id) do
      resolve(fn offer, _, _ ->
        GlobalId.encode_required(:merchant_product, offer.merchant_product_id)
      end)
    end

    field :currency, non_null(:string)
    field :item_price, :decimal
    field :shipping, :decimal
    field :landed_price, :decimal
    field :landed_price_complete, non_null(:boolean)
    field :stock_status, non_null(:offer_stock_status)
    field :freshness, non_null(:offer_freshness)
    field :observed_at, :datetime
    field :eligible, non_null(:boolean)
    field :source_artifact, :source_artifact
  end

  enum :offer_stock_status do
    value(:in_stock)
    value(:out_of_stock)
    value(:unknown)
  end

  enum :offer_freshness do
    value(:fresh)
    value(:aging)
    value(:stale)
    value(:unobserved)
  end

  object :price_point_connection do
    field :edges, non_null(list_of(non_null(:price_point_edge)))
    field :page_info, non_null(:page_info)
  end

  object :price_point_edge do
    field :cursor, non_null(:string)
    field :node, non_null(:price_point)
  end

  object :merchant_product_connection do
    field :edges, non_null(list_of(non_null(:merchant_product_edge)))
    field :page_info, non_null(:page_info)
  end

  object :merchant_product_edge do
    field :cursor, non_null(:string)
    field :node, non_null(:merchant_product)
  end

  object :product_connection do
    field :edges, non_null(list_of(non_null(:product_edge)))
    field :page_info, non_null(:page_info)
  end

  object :product_edge do
    field :cursor, non_null(:string)
    field :node, non_null(:product)
  end
end
