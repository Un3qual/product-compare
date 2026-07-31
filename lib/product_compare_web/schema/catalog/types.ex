defmodule ProductCompareWeb.Schema.Catalog.Types do
  use Absinthe.Schema.Notation
  use Absinthe.Relay.Schema.Notation, :modern

  import Absinthe.Resolution.Helpers, only: [dataloader: 2]

  alias ProductCompare.Catalog
  alias ProductCompareWeb.GraphQL.GlobalId
  alias ProductCompareWeb.Resolvers.Catalog.CurrentAttributes
  alias ProductCompareWeb.Resolvers.Discussions.Reads, as: DiscussionReads
  alias ProductCompareWeb.Resolvers.Pricing.Offers
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

  object :saved_comparison_set_payload do
    field :saved_comparison_set, :saved_comparison_set
    field :errors, non_null(list_of(non_null(:mutation_error)))
  end

  node object(:saved_comparison_set, id_fetcher: &GlobalId.fetch_entropy_id/2) do
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

  connection node_type: :saved_comparison_set, non_null_edges: true, non_null_edge: true do
    edge do
      field :node, non_null(:saved_comparison_set)
      field :cursor, non_null(:string)
    end
  end

  node object(:brand) do
    field :name, non_null(:string)
  end

  node object(:product) do
    field :name, non_null(:string)
    field :slug, non_null(:string)
    field :model_number, :string
    field :description, :string
    field :brand, :brand, resolve: dataloader(Catalog, use_parent: true)
    field :seo, non_null(:seo_metadata), resolve: &SeoResolver.product_metadata/3

    field :media, non_null(list_of(non_null(:product_media))),
      resolve: dataloader(Catalog, use_parent: true)

    field :current_attributes, non_null(list_of(non_null(:product_attribute_value))) do
      resolve(&CurrentAttributes.current_attributes/3)
    end

    field :offer_truth, non_null(:product_offer_truth) do
      resolve(&Offers.product_offer_truth/3)
    end

    field :review_summary, non_null(:product_review_summary),
      resolve: &DiscussionReads.review_summary/3

    connection field :reviews,
                 node_type: :product_review,
                 non_null_connection: true,
                 paginate: :forward do
      resolve(&DiscussionReads.reviews/3)
    end

    connection field :questions,
                 node_type: :product_question,
                 non_null_connection: true,
                 paginate: :forward do
      resolve(&DiscussionReads.questions/3)
    end

    field :viewer_community_submissions, non_null(:viewer_community_submissions),
      resolve: &DiscussionReads.viewer_community_submissions/3

    connection field :merchant_products, node_type: :merchant_product, paginate: :forward do
      arg(:merchant_id, :id)
      arg(:active_only, :boolean)

      resolve(&Offers.product_merchant_products/3)
    end
  end

  object :product_media do
    field :url, non_null(:string)

    field :role, non_null(:string),
      resolve: fn media, _, _ -> {:ok, Atom.to_string(media.role)} end

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

  connection node_type: :product, non_null_edges: true, non_null_edge: true do
    edge do
      field :node, non_null(:product)
      field :cursor, non_null(:string)
    end
  end
end
