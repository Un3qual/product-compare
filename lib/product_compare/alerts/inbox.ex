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
    case Repo.transaction(fn ->
           event =
             Repo.one(
               from event in AlertEvent,
                 where: event.user_id == ^user_id and event.entropy_id == ^entropy_id,
                 lock: "FOR UPDATE"
             )

           case event do
             nil ->
               Repo.rollback(:not_found)

             %AlertEvent{read_at: %DateTime{}} ->
               event

             %AlertEvent{} ->
               event
               |> AlertEvent.read_changeset(DateTime.utc_now())
               |> Repo.update()
               |> case do
                 {:ok, read_event} -> read_event
                 {:error, changeset} -> Repo.rollback(changeset)
               end
           end
         end) do
      {:ok, event} -> {:ok, load_alert_event(event)}
      {:error, :not_found} -> {:error, :not_found}
      {:error, %Ecto.Changeset{} = changeset} -> {:error, changeset}
    end
  end

  def mark_alert_read(_user_id, _entropy_id), do: {:error, :not_found}

  defp maybe_filter_unread(query, true), do: where(query, [event], is_nil(event.read_at))
  defp maybe_filter_unread(query, _unread_only), do: query

  defp load_alert_event(event) do
    Repo.preload(event, [
      :triggering_price_point,
      :watch_rule,
      merchant_product: [:merchant, :product]
    ])
  end
end
