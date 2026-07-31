defmodule ProductCompareWeb.Schema.ComparisonSnapshots.Types do
  use Absinthe.Schema.Notation
  use Absinthe.Relay.Schema.Notation, :modern

  alias ProductCompareWeb.GraphQL.GlobalId
  alias ProductCompareWeb.Resolvers.ComparisonSnapshotsResolver
  alias ProductCompareWeb.Resolvers.SeoResolver

  input_object :publish_comparison_snapshot_input do
    field :title, :string
    field :search_indexable, :boolean, default_value: false
    field :product_ids, non_null(list_of(non_null(:id)))
    field :recommendation_profile, non_null(:recommendation_profile)
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

  node object(:comparison_snapshot, id_fetcher: &GlobalId.fetch_entropy_id/2) do
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

  connection node_type: :comparison_snapshot, non_null_edges: true, non_null_edge: true do
    edge do
      field :node, non_null(:comparison_snapshot)
      field :cursor, non_null(:string)
    end
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
end
