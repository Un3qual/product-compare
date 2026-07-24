defmodule ProductCompareWeb.Resolvers.AlertsResolver do
  @moduledoc false

  alias ProductCompareWeb.Resolvers.Alerts.EventMutations
  alias ProductCompareWeb.Resolvers.Alerts.Reads
  alias ProductCompareWeb.Resolvers.Alerts.WatchMutations

  @spec my_price_watches(any(), map(), Absinthe.Resolution.t()) :: {:ok, map()} | {:error, term()}
  def my_price_watches(parent, args, resolution),
    do: Reads.my_price_watches(parent, args, resolution)

  @spec my_alert_events(any(), map(), Absinthe.Resolution.t()) :: {:ok, map()} | {:error, term()}
  def my_alert_events(parent, args, resolution),
    do: Reads.my_alert_events(parent, args, resolution)

  @spec create_price_watch(any(), %{input: map()}, Absinthe.Resolution.t()) :: {:ok, map()}
  def create_price_watch(parent, args, resolution),
    do: WatchMutations.create_price_watch(parent, args, resolution)

  @spec update_price_watch(any(), %{input: map()}, Absinthe.Resolution.t()) :: {:ok, map()}
  def update_price_watch(parent, args, resolution),
    do: WatchMutations.update_price_watch(parent, args, resolution)

  @spec delete_price_watch(any(), %{id: String.t()}, Absinthe.Resolution.t()) :: {:ok, map()}
  def delete_price_watch(parent, args, resolution),
    do: WatchMutations.delete_price_watch(parent, args, resolution)

  @spec mark_alert_read(any(), %{id: String.t()}, Absinthe.Resolution.t()) :: {:ok, map()}
  def mark_alert_read(parent, args, resolution),
    do: EventMutations.mark_alert_read(parent, args, resolution)
end
