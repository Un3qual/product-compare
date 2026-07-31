defmodule ProductCompareWeb.Schema.Alerts.Types do
  use Absinthe.Schema.Notation
  use Absinthe.Relay.Schema.Notation, :modern

  alias ProductCompareWeb.GraphQL.GlobalId

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

  connection node_type: :price_watch, non_null_edges: true, non_null_edge: true do
    edge do
      field :node, non_null(:price_watch)
      field :cursor, non_null(:string)
    end
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

  connection node_type: :alert_event, non_null_edges: true, non_null_edge: true do
    edge do
      field :node, non_null(:alert_event)
      field :cursor, non_null(:string)
    end
  end
end
