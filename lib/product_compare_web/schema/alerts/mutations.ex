defmodule ProductCompareWeb.Schema.Alerts.Mutations do
  use Absinthe.Schema.Notation

  alias ProductCompareWeb.Resolvers.Alerts.EventMutations
  alias ProductCompareWeb.Resolvers.Alerts.WatchMutations

  object :alerts_mutations do
    @desc "Creates a product or offer price watch for the current user."
    field :create_price_watch, non_null(:price_watch_payload) do
      arg(:input, non_null(:create_price_watch_input))
      resolve(&WatchMutations.create_price_watch/3)
    end

    @desc "Updates one of the current user's price watches."
    field :update_price_watch, non_null(:price_watch_payload) do
      arg(:input, non_null(:update_price_watch_input))
      resolve(&WatchMutations.update_price_watch/3)
    end

    @desc "Deletes one of the current user's price watches."
    field :delete_price_watch, non_null(:delete_price_watch_payload) do
      arg(:id, non_null(:id))
      resolve(&WatchMutations.delete_price_watch/3)
    end

    @desc "Marks one of the current user's in-app alert events as read."
    field :mark_alert_read, non_null(:alert_event_payload) do
      arg(:id, non_null(:id))
      resolve(&EventMutations.mark_alert_read/3)
    end
  end
end
