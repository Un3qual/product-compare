defmodule ProductCompareWeb.Schema.Home.Types do
  use Absinthe.Schema.Notation
  use Absinthe.Relay.Schema.Notation, :modern

  alias ProductCompareWeb.GraphQL.GlobalId
  alias ProductCompareWeb.Resolvers.HomeResolver

  enum :home_deal_reason_code do
    value(:new_offer)
    value(:trending_below_median)
    value(:watch_target)
    value(:saved_comparison)
    value(:current_comparison)
  end

  enum :home_price_signal_code do
    value(:below_30_day_median)
    value(:at_or_above_30_day_median)
    value(:no_30_day_baseline)
  end

  object :home_workspace do
    connection field :products,
                 node_type: :product,
                 connection: :home_workspace_products,
                 non_null_connection: true,
                 paginate: :forward do
      resolve(&HomeResolver.workspace_products/3)
    end

    field :selected_products, non_null(list_of(non_null(:product)))

    connection field :categories,
                 node_type: :seo_category,
                 connection: :home_category_shortcuts,
                 non_null_connection: true,
                 paginate: :forward do
      resolve(&HomeResolver.workspace_categories/3)
    end
  end

  connection :home_workspace_products,
    node_type: :product,
    non_null_edges: true,
    non_null_edge: true do
    edge do
      field :node, non_null(:product)
      field :cursor, non_null(:string)
      field :highlights, non_null(list_of(non_null(:home_specification_highlight)))
      field :offer, non_null(:home_offer_summary)
    end
  end

  connection :home_category_shortcuts,
    node_type: :seo_category,
    non_null_edges: true,
    non_null_edge: true do
    edge do
      field :node, non_null(:seo_category)
      field :cursor, non_null(:string)
    end
  end

  object :home_specification_highlight do
    field :label, non_null(:string) do
      resolve(fn %{attribute: attribute}, _, _ -> {:ok, attribute.display_name} end)
    end

    field :value, non_null(:string) do
      resolve(fn %{claim: claim}, _, _ ->
        {:ok, ProductCompare.Specs.ClaimValue.format(claim)}
      end)
    end
  end

  object :home_offer_summary do
    field :merchant_product_id, non_null(:id) do
      resolve(fn offer, _, _ ->
        GlobalId.encode_required(:merchant_product, offer.merchant_product_id)
      end)
    end

    field :merchant_name, non_null(:string)
    field :currency, non_null(:string)
    field :landed_price, non_null(:decimal)
    field :active_offer_count, non_null(:integer)
    field :price_signal, non_null(:home_price_signal_code), resolve: &HomeResolver.price_signal/3
    field :observed_at, non_null(:datetime)
  end

  object :home_deals do
    connection field :new,
                 node_type: :product,
                 connection: :home_deals,
                 non_null_connection: true,
                 paginate: :forward do
      resolve(&HomeResolver.new_deals/3)
    end

    connection field :trending,
                 node_type: :product,
                 connection: :home_deals,
                 non_null_connection: true,
                 paginate: :forward do
      resolve(&HomeResolver.trending_deals/3)
    end

    connection field :for_you,
                 node_type: :product,
                 connection: :home_deals,
                 non_null_connection: true,
                 paginate: :forward do
      resolve(&HomeResolver.viewer_deals/3)
    end
  end

  connection :home_deals,
    node_type: :product,
    non_null_edges: true,
    non_null_edge: true do
    edge do
      field :node, non_null(:product)
      field :cursor, non_null(:string)
      field :offer, non_null(:home_offer_summary)
      field :reasons, non_null(list_of(non_null(:home_deal_reason)))
    end
  end

  object :home_deal_reason do
    field :code, non_null(:home_deal_reason_code)
    field :watch_target, :decimal
  end
end
