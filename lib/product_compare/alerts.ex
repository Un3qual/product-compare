defmodule ProductCompare.Alerts do
  @moduledoc """
  Owner-scoped price watches, durable evaluation, and in-app alert events.
  """

  alias ProductCompare.Alerts.Evaluation
  alias ProductCompare.Alerts.Inbox
  alias ProductCompare.Alerts.WatchRules
  alias ProductCompareSchemas.Alerts.AlertEvent
  alias ProductCompareSchemas.Alerts.PriceWatchRule

  @max_bigint_id 9_223_372_036_854_775_807
  defguardp valid_id(id) when is_integer(id) and id > 0 and id <= @max_bigint_id

  @spec create_watch(pos_integer(), map()) ::
          {:ok, PriceWatchRule.t()} | {:error, Ecto.Changeset.t() | atom()}
  def create_watch(user_id, attrs) when valid_id(user_id) and is_map(attrs) do
    WatchRules.create_watch(user_id, attrs)
  end

  def create_watch(_user_id, _attrs), do: {:error, :invalid_argument}

  @spec list_watch_rules_query(pos_integer(), keyword()) :: Ecto.Query.t()
  def list_watch_rules_query(user_id, opts \\ []) do
    WatchRules.list_watch_rules_query(user_id, opts)
  end

  @spec list_alert_events_query(pos_integer(), keyword()) :: Ecto.Query.t()
  def list_alert_events_query(user_id, opts \\ []) do
    Inbox.list_alert_events_query(user_id, opts)
  end

  @spec update_watch(pos_integer(), Ecto.UUID.t(), map()) ::
          {:ok, PriceWatchRule.t()} | {:error, :not_found | Ecto.Changeset.t()}
  def update_watch(user_id, entropy_id, attrs) when valid_id(user_id) and is_binary(entropy_id) do
    WatchRules.update_watch(user_id, entropy_id, attrs)
  end

  def update_watch(_user_id, _entropy_id, _attrs), do: {:error, :not_found}

  @spec delete_watch(pos_integer(), Ecto.UUID.t()) ::
          {:ok, PriceWatchRule.t()} | {:error, :not_found}
  def delete_watch(user_id, entropy_id) when valid_id(user_id) and is_binary(entropy_id) do
    WatchRules.delete_watch(user_id, entropy_id)
  end

  def delete_watch(_user_id, _entropy_id), do: {:error, :not_found}

  @spec mark_alert_read(pos_integer(), Ecto.UUID.t()) ::
          {:ok, AlertEvent.t()} | {:error, :not_found | Ecto.Changeset.t()}
  def mark_alert_read(user_id, entropy_id) when valid_id(user_id) and is_binary(entropy_id) do
    Inbox.mark_alert_read(user_id, entropy_id)
  end

  def mark_alert_read(_user_id, _entropy_id), do: {:error, :not_found}

  @spec evaluate_price_point(pos_integer(), keyword()) ::
          {:ok, %{evaluated: non_neg_integer(), events_created: non_neg_integer()}}
          | {:error,
             :price_point_not_found
             | {:watch_evaluations_failed, [pos_integer()],
                %{
                  evaluated: non_neg_integer(),
                  events_created: non_neg_integer()
                }}}
  def evaluate_price_point(price_point_id, opts \\ [])

  def evaluate_price_point(price_point_id, opts) when valid_id(price_point_id) do
    Evaluation.evaluate_price_point(price_point_id, opts)
  end

  def evaluate_price_point(_price_point_id, _opts), do: {:error, :price_point_not_found}
end
