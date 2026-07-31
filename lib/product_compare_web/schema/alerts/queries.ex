defmodule ProductCompareWeb.Schema.Alerts.Queries do
  use Absinthe.Schema.Notation
  use Absinthe.Relay.Schema.Notation, :modern

  alias ProductCompareWeb.Resolvers.Alerts.Reads

  object :alerts_queries do
    @desc "Returns price watches owned by the current authenticated user."
    connection field :my_price_watches, node_type: :price_watch, non_null_connection: true do
      arg(:enabled, :boolean)
      resolve(&Reads.my_price_watches/3)
    end

    @desc "Returns in-app price alert events owned by the current user."
    connection field :my_alert_events, node_type: :alert_event, non_null_connection: true do
      arg(:unread_only, :boolean)
      resolve(&Reads.my_alert_events/3)
    end
  end
end
