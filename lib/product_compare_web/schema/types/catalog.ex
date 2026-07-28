defmodule ProductCompareWeb.Schema.Types.Catalog do
  use Absinthe.Schema.Notation

  import Absinthe.Resolution.Helpers, only: [dataloader: 2]

  alias ProductCompare.Catalog
  alias ProductCompareWeb.GraphQL.GlobalId
  alias ProductCompareWeb.Resolvers.CatalogResolver
  alias ProductCompareWeb.Resolvers.ComparisonSnapshotsResolver
  alias ProductCompareWeb.Resolvers.DiscussionsResolver
  alias ProductCompareWeb.Resolvers.PricingResolver
  alias ProductCompareWeb.Resolvers.SeoResolver

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
    value(:relevance)
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

  input_object :publish_comparison_snapshot_input do
    field :title, :string
    field :search_indexable, :boolean, default_value: false
    field :product_ids, non_null(list_of(non_null(:id)))
    field :recommendation_profile, non_null(:recommendation_profile)
  end

  object :saved_comparison_set_payload do
    field :saved_comparison_set, :saved_comparison_set
    field :errors, non_null(list_of(non_null(:mutation_error)))
  end

  object :publish_comparison_snapshot_payload do
    field :snapshot, :comparison_snapshot
    field :share_path, :string
    field :errors, non_null(list_of(non_null(:mutation_error)))
  end

  object :revoke_comparison_snapshot_payload do
    field :revoked_snapshot_id, :id
    field :errors, non_null(list_of(non_null(:mutation_error)))
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

  object :comparison_snapshot do
    field :id, non_null(:id) do
      resolve(fn snapshot, _, _ ->
        GlobalId.encode_required(:comparison_snapshot, snapshot.entropy_id)
      end)
    end

    field :title, :string
    field :share_path, non_null(:string), resolve: &ComparisonSnapshotsResolver.share_path/3
    field :search_indexable, non_null(:boolean)
    field :seo, non_null(:seo_metadata), resolve: &SeoResolver.snapshot_metadata/3
    field :captured_at, non_null(:datetime), resolve: &ComparisonSnapshotsResolver.captured_at/3
    field :disclaimer, non_null(:string), resolve: &ComparisonSnapshotsResolver.disclaimer/3

    field :products, non_null(list_of(non_null(:comparison_snapshot_product))),
      resolve: &ComparisonSnapshotsResolver.snapshot_products/3

    field :recommendation, non_null(:comparison_recommendation),
      resolve: &ComparisonSnapshotsResolver.recommendation/3
  end

  object :comparison_snapshot_product do
    field :id, non_null(:id) do
      resolve(fn product, _, _ -> GlobalId.encode_required(:product, product.id) end)
    end

    field :name, non_null(:string)
    field :slug, non_null(:string)
    field :description, :string
    field :model_number, :string
    field :brand_name, :string
    field :attributes, non_null(list_of(non_null(:comparison_snapshot_attribute)))
    field :offers, non_null(list_of(non_null(:comparison_snapshot_offer)))
  end

  object :comparison_snapshot_connection do
    field :edges, non_null(list_of(non_null(:comparison_snapshot_edge)))
    field :page_info, non_null(:page_info)
  end

  object :comparison_snapshot_edge do
    field :cursor, non_null(:string)
    field :node, non_null(:comparison_snapshot)
  end

  object :comparison_snapshot_attribute do
    field :attribute_id, non_null(:id) do
      resolve(fn attribute, _, _ ->
        GlobalId.encode_required(:attribute, attribute.attribute_id)
      end)
    end

    field :claim_id, non_null(:id) do
      resolve(fn attribute, _, _ ->
        GlobalId.encode_required(:product_attribute_claim, attribute.claim_id)
      end)
    end

    field :code, non_null(:string)
    field :display_name, non_null(:string)
    field :value_text, non_null(:string)
    field :source_type, non_null(:string)
    field :confidence, :decimal
    field :evidence, non_null(list_of(non_null(:comparison_snapshot_evidence)))
  end

  object :comparison_snapshot_evidence do
    field :artifact_id, non_null(:id) do
      resolve(fn evidence, _, _ ->
        GlobalId.encode_required(:source_artifact, evidence.artifact_id)
      end)
    end

    field :excerpt, :string
    field :source_kind, non_null(:string)
    field :source_name, non_null(:string)
    field :source_domain, :string
    field :url, :string

    field :fetched_at, non_null(:datetime),
      resolve: &ComparisonSnapshotsResolver.evidence_fetched_at/3
  end

  object :comparison_snapshot_offer do
    field :merchant_product_id, non_null(:id) do
      resolve(fn offer, _, _ ->
        GlobalId.encode_required(:merchant_product, offer.merchant_product_id)
      end)
    end

    field :price_point_id, non_null(:id) do
      resolve(fn offer, _, _ -> GlobalId.encode_required(:price_point, offer.price_point_id) end)
    end

    field :merchant_name, non_null(:string)
    field :merchant_domain, :string
    field :currency, non_null(:string)
    field :item_price, non_null(:decimal)
    field :shipping, non_null(:decimal)
    field :landed_price, non_null(:decimal)
    field :freshness, non_null(:string)

    field :observed_at, non_null(:datetime),
      resolve: &ComparisonSnapshotsResolver.offer_observed_at/3
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

  object :brand do
    interface(:node)

    field :id, non_null(:id) do
      resolve(fn brand, _, _ -> GlobalId.encode_required(:brand, brand.id) end)
    end

    field :name, non_null(:string)
  end

  object :seo_category do
    field :id, non_null(:id) do
      resolve(fn category, _, _ -> GlobalId.encode_required(:taxon, category.id) end)
    end

    field :name, non_null(:string)
    field :slug, non_null(:string)
    field :description, non_null(:string)
    field :qualified_product_count, non_null(:integer)
    field :indexable, non_null(:boolean)
    field :seo, non_null(:seo_metadata), resolve: &SeoResolver.category_metadata/3

    field :products, non_null(:product_connection) do
      arg(:first, :integer)
      arg(:after, :string)
      resolve(&SeoResolver.category_products/3)
    end
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
    field :seo, non_null(:seo_metadata), resolve: &SeoResolver.product_metadata/3

    field :media, non_null(list_of(non_null(:product_media))),
      resolve: dataloader(Catalog, use_parent: true)

    field :current_attributes, non_null(list_of(non_null(:product_attribute_value))) do
      resolve(&CatalogResolver.current_attributes/3)
    end

    field :offer_truth, non_null(:product_offer_truth) do
      resolve(&PricingResolver.product_offer_truth/3)
    end

    field :review_summary, non_null(:product_review_summary),
      resolve: &DiscussionsResolver.review_summary/3

    field :reviews, non_null(:product_review_connection) do
      arg(:first, :integer)
      arg(:after, :string)
      resolve(&DiscussionsResolver.reviews/3)
    end

    field :questions, non_null(:product_question_connection) do
      arg(:first, :integer)
      arg(:after, :string)
      resolve(&DiscussionsResolver.questions/3)
    end

    field :viewer_community_submissions, non_null(:viewer_community_submissions),
      resolve: &DiscussionsResolver.viewer_community_submissions/3

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
    field :source_artifact, :source_artifact
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

  object :product_connection do
    field :edges, non_null(list_of(non_null(:product_edge)))
    field :page_info, non_null(:page_info)
  end

  object :product_edge do
    field :cursor, non_null(:string)
    field :node, non_null(:product)
  end
end
