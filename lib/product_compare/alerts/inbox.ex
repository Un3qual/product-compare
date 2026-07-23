defmodule ProductCompare.Alerts.Inbox do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Repo
  alias ProductCompareSchemas.Alerts.AlertEvent

  @max_bigint_id 9_223_372_036_854_775_807
  defguardp valid_id(id) when is_integer(id) and id > 0 and id <= @max_bigint_id

  @spec list_alert_events_query(pos_integer(), keyword()) :: Ecto.Query.t()
  def list_alert_events_query(user_id, opts \\ []) do
    AlertEvent
    |> where([event], event.user_id == ^user_id)
    |> maybe_filter_unread(Keyword.get(opts, :unread_only, false))
    |> order_by([event], desc: event.inserted_at, desc: event.id)
    |> preload([:triggering_price_point, :watch_rule, merchant_product: [:merchant, :product]])
  end

  @spec mark_alert_read(pos_integer(), Ecto.UUID.t()) ::
          {:ok, AlertEvent.t()} | {:error, :not_found | Ecto.Changeset.t()}
  def mark_alert_read(user_id, entropy_id) when valid_id(user_id) and is_binary(entropy_id) do
    case Repo.get_by(AlertEvent, user_id: user_id, entropy_id: entropy_id) do
      nil ->
        {:error, :not_found}

      %AlertEvent{read_at: %DateTime{}} = event ->
        {:ok, load_alert_event(event)}

      event ->
        event
        |> AlertEvent.read_changeset(DateTime.utc_now())
        |> Repo.update()
        |> load_alert_event()
    end
  end

  def mark_alert_read(_user_id, _entropy_id), do: {:error, :not_found}

  defp maybe_filter_unread(query, true), do: where(query, [event], is_nil(event.read_at))
  defp maybe_filter_unread(query, _unread_only), do: query

  defp load_alert_event({:ok, event}), do: {:ok, load_alert_event(event)}
  defp load_alert_event({:error, _reason} = error), do: error

  defp load_alert_event(event) do
    Repo.preload(event, [
      :triggering_price_point,
      :watch_rule,
      merchant_product: [:merchant, :product]
    ])
  end
end
