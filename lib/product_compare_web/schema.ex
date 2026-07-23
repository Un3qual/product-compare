defmodule ProductCompareWeb.Schema do
  use Absinthe.Schema

  import_types(Absinthe.Type.Custom)
  import_types(ProductCompareWeb.Schema.Types.Catalog, only: [:product_connection, :product_edge])

  import_types(ProductCompareWeb.Schema.Types.Commerce,
    only: [
      :merchant_product,
      :price_point,
      :product_offer_truth,
      :offer_currency_summary,
      :current_offer,
      :offer_stock_status,
      :offer_freshness,
      :price_point_connection,
      :price_point_edge,
      :merchant_product_connection,
      :merchant_product_edge
    ]
  )

  import_types(ProductCompareWeb.Schema.Types.Trust,
    only: [
      :specification_correction_status,
      :specification_correction,
      :specification_correction_connection,
      :specification_correction_edge,
      :price_watch,
      :price_watch_connection,
      :price_watch_edge,
      :alert_event,
      :alert_event_connection,
      :alert_event_edge,
      :product_attribute_evidence
    ]
  )

  import_types(ProductCompareWeb.Schema.Types.Catalog,
    only: [:product_media, :product_attribute_value]
  )

  import_types(ProductCompareWeb.Schema.Types.Trust,
    only: [
      :product_review_summary,
      :viewer_community_submissions,
      :product_review,
      :product_review_connection,
      :product_review_edge,
      :product_question,
      :product_question_connection,
      :product_question_edge,
      :product_answer,
      :product_answer_connection,
      :product_answer_edge
    ]
  )

  import_types(ProductCompareWeb.Schema.Types.Catalog, only: [:product])

  import_types(ProductCompareWeb.Schema.Types.Commerce,
    only: [
      :merchant_connection,
      :merchant_edge,
      :merchant_feed_candidate,
      :merchant_feed_candidate_connection,
      :merchant_feed_candidate_edge,
      :merchant_feed_candidate_review_status,
      :merchant_feed_candidate_sort
    ]
  )

  import_types(ProductCompareWeb.Schema.Types.Catalog, only: [:seo_category])
  import_types(ProductCompareWeb.Schema.Types.Common, only: [:seo_metadata])

  import_types(ProductCompareWeb.Schema.Types.Commerce,
    only: [:merchant, :merchant_detail_summary]
  )

  import_types(ProductCompareWeb.Schema.Types.Catalog, only: [:brand])
  import_types(ProductCompareWeb.Schema.Types.Common, only: [:page_info, :node])

  import_types(ProductCompareWeb.Schema.Types.Accounts,
    only: [:api_token_edge, :api_token_status_filter]
  )

  import_types(ProductCompareWeb.Schema.Types.Catalog,
    only: [
      :saved_comparison_set,
      :comparison_snapshot,
      :comparison_snapshot_product,
      :comparison_snapshot_connection,
      :comparison_snapshot_edge,
      :comparison_snapshot_attribute,
      :comparison_snapshot_evidence,
      :comparison_snapshot_offer,
      :saved_comparison_item,
      :saved_comparison_set_connection,
      :saved_comparison_set_edge
    ]
  )

  import_types(ProductCompareWeb.Schema.Types.Accounts,
    only: [:user, :api_token, :api_token_connection]
  )

  import_types(ProductCompareWeb.Schema.Types.Common, only: [:mutation_error])

  import_types(ProductCompareWeb.Schema.Types.Commerce,
    only: [:review_merchant_feed_candidate_payload]
  )

  import_types(ProductCompareWeb.Schema.Types.Accounts,
    only: [
      :create_api_token_payload,
      :auth_session_payload,
      :logout_payload,
      :auth_action_payload,
      :revoke_api_token_payload
    ]
  )

  import_types(ProductCompareWeb.Schema.Types.Commerce,
    only: [
      :coupon_connection,
      :coupon_edge,
      :active_coupon,
      :active_coupon_connection,
      :active_coupon_edge,
      :coupon_discount_type
    ]
  )

  import_types(ProductCompareWeb.Schema.Types.Trust, only: [:source_artifact])

  import_types(ProductCompareWeb.Schema.Types.Commerce,
    only: [
      :track_commerce_click_payload,
      :active_coupons_payload,
      :affiliate_network,
      :affiliate_program,
      :affiliate_link,
      :coupon
    ]
  )

  import_types(ProductCompareWeb.Schema.Types.Trust,
    only: [
      :product_review_payload,
      :remove_community_content_payload,
      :product_question_payload,
      :product_answer_payload,
      :community_report_payload,
      :community_moderation_payload,
      :specification_correction_payload,
      :price_watch_payload,
      :delete_price_watch_payload,
      :alert_event_payload
    ]
  )

  import_types(ProductCompareWeb.Schema.Types.Catalog,
    only: [
      :saved_comparison_set_payload,
      :publish_comparison_snapshot_payload,
      :revoke_comparison_snapshot_payload
    ]
  )

  import_types(ProductCompareWeb.Schema.Types.Commerce,
    only: [
      :upsert_affiliate_network_payload,
      :upsert_affiliate_program_payload,
      :upsert_affiliate_link_payload,
      :create_coupon_payload
    ]
  )

  import_types(ProductCompareWeb.Schema.Types.Trust,
    only: [
      :submit_product_review_input,
      :ask_product_question_input,
      :answer_product_question_input,
      :update_product_review_input,
      :update_product_question_input,
      :update_product_answer_input,
      :remove_community_content_input,
      :community_content_type,
      :community_moderation_status,
      :report_community_content_input,
      :moderate_community_content_input
    ]
  )

  import_types(ProductCompareWeb.Schema.Types.Catalog,
    only: [
      :product_numeric_filter_input,
      :product_boolean_filter_input,
      :product_enum_filter_input,
      :product_sort,
      :recommendation_profile,
      :recommendation_status,
      :comparison_recommendation,
      :recommendation_ranking,
      :product_filters_input,
      :product_filter_metadata,
      :product_filter_option,
      :product_numeric_filter_metadata,
      :product_boolean_filter_metadata,
      :product_enum_filter_metadata,
      :create_saved_comparison_set_input,
      :publish_comparison_snapshot_input
    ]
  )

  import_types(ProductCompareWeb.Schema.Types.Commerce,
    only: [:merchant_products_input, :review_merchant_feed_candidate_input]
  )

  import_types(ProductCompareWeb.Schema.Types.Trust,
    only: [
      :specification_correction_value_input,
      :propose_specification_correction_input,
      :moderate_specification_correction_input,
      :price_watch_rule_type,
      :create_price_watch_input,
      :update_price_watch_input
    ]
  )

  import_types(ProductCompareWeb.Schema.Types.Commerce,
    only: [
      :upsert_affiliate_network_input,
      :track_commerce_click_input,
      :revenue_summary_input,
      :revenue_summary,
      :revenue_summary_filters,
      :revenue_summary_metrics,
      :revenue_summary_suppression,
      :upsert_affiliate_program_input,
      :upsert_affiliate_link_input,
      :create_coupon_input,
      :active_coupons_input
    ]
  )

  alias ProductCompareWeb.GraphQL.Loader
  alias ProductCompareWeb.Resolvers.AffiliateResolver
  alias ProductCompareWeb.Resolvers.AlertsResolver
  alias ProductCompareWeb.Resolvers.AuthResolver
  alias ProductCompareWeb.Resolvers.CatalogResolver
  alias ProductCompareWeb.Resolvers.CommerceAttributionResolver
  alias ProductCompareWeb.Resolvers.ComparisonSnapshotsResolver
  alias ProductCompareWeb.Resolvers.DiscussionsResolver
  alias ProductCompareWeb.Resolvers.IngestionResolver
  alias ProductCompareWeb.Resolvers.NodeResolver
  alias ProductCompareWeb.Resolvers.PricingResolver
  alias ProductCompareWeb.Resolvers.RecommendationsResolver
  alias ProductCompareWeb.Resolvers.SeoResolver
  alias ProductCompareWeb.Resolvers.SpecsResolver

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

    @desc "Returns a published product question by global ID."
    field :product_question, :product_question do
      arg(:id, non_null(:id))
      resolve(&DiscussionsResolver.question/3)
    end

    @desc "Returns deterministic source-backed guidance for two or three products."
    field :comparison_recommendation, non_null(:comparison_recommendation) do
      arg(:slugs, non_null(list_of(non_null(:string))))
      arg(:profile, non_null(:recommendation_profile))
      resolve(&RecommendationsResolver.comparison_recommendation/3)
    end

    @desc "Returns a published, non-revoked immutable comparison snapshot."
    field :comparison_snapshot, :comparison_snapshot do
      arg(:token, non_null(:string))
      resolve(&ComparisonSnapshotsResolver.comparison_snapshot/3)
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

    @desc "Returns one merchant by canonical slug."
    field :merchant, :merchant do
      arg(:slug, non_null(:string))
      resolve(&PricingResolver.merchant/3)
    end

    @desc "Returns a curated public product category by canonical search slug."
    field :category, :seo_category do
      arg(:slug, non_null(:string))
      resolve(&SeoResolver.category/3)
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

    @desc "Publishes an immutable comparison snapshot for the current user."
    field :publish_comparison_snapshot, non_null(:publish_comparison_snapshot_payload) do
      arg(:input, non_null(:publish_comparison_snapshot_input))
      resolve(&ComparisonSnapshotsResolver.publish/3)
    end

    @desc "Revokes one of the current user's public comparison snapshots."
    field :revoke_comparison_snapshot, non_null(:revoke_comparison_snapshot_payload) do
      arg(:snapshot_id, non_null(:id))
      resolve(&ComparisonSnapshotsResolver.revoke/3)
    end

    @desc "Submits one authenticated product review for moderation."
    field :submit_product_review, non_null(:product_review_payload) do
      arg(:input, non_null(:submit_product_review_input))
      resolve(&DiscussionsResolver.submit_review/3)
    end

    @desc "Submits an authenticated product question for moderation."
    field :ask_product_question, non_null(:product_question_payload) do
      arg(:input, non_null(:ask_product_question_input))
      resolve(&DiscussionsResolver.ask_question/3)
    end

    @desc "Submits an authenticated answer to a published question."
    field :answer_product_question, non_null(:product_answer_payload) do
      arg(:input, non_null(:answer_product_question_input))
      resolve(&DiscussionsResolver.answer_question/3)
    end

    @desc "Updates one review owned by the current user and resubmits it for moderation."
    field :update_product_review, non_null(:product_review_payload) do
      arg(:input, non_null(:update_product_review_input))
      resolve(&DiscussionsResolver.update_review/3)
    end

    @desc "Updates one question owned by the current user and resubmits it for moderation."
    field :update_product_question, non_null(:product_question_payload) do
      arg(:input, non_null(:update_product_question_input))
      resolve(&DiscussionsResolver.update_question/3)
    end

    @desc "Updates one answer owned by the current user and resubmits it for moderation."
    field :update_product_answer, non_null(:product_answer_payload) do
      arg(:input, non_null(:update_product_answer_input))
      resolve(&DiscussionsResolver.update_answer/3)
    end

    @desc "Soft-removes review or Q&A content owned by the current user."
    field :remove_community_content, non_null(:remove_community_content_payload) do
      arg(:input, non_null(:remove_community_content_input))
      resolve(&DiscussionsResolver.remove/3)
    end

    @desc "Marks one published answer as accepted by the question owner."
    field :accept_product_answer, non_null(:product_question_payload) do
      arg(:question_id, non_null(:id))
      arg(:answer_id, non_null(:id))
      resolve(&DiscussionsResolver.accept_answer/3)
    end

    @desc "Reports review or Q&A content for operator moderation."
    field :report_community_content, non_null(:community_report_payload) do
      arg(:input, non_null(:report_community_content_input))
      resolve(&DiscussionsResolver.report/3)
    end

    @desc "Publishes, hides, or rejects community content as an operator."
    field :moderate_community_content, non_null(:community_moderation_payload) do
      arg(:input, non_null(:moderate_community_content_input))
      resolve(&DiscussionsResolver.moderate/3)
    end
  end
end
