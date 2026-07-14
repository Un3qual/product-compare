defmodule ProductCompareWeb.Resolvers.AlertsResolver do
  @moduledoc false

  alias ProductCompare.Alerts
  alias ProductCompare.Repo
  alias ProductCompareWeb.GraphQL.Connection
  alias ProductCompareWeb.GraphQL.Errors, as: GraphQLErrors
  alias ProductCompareWeb.GraphQL.GlobalId
  alias ProductCompareWeb.GraphQL.Input

  @spec my_price_watches(any(), map(), Absinthe.Resolution.t()) :: {:ok, map()} | {:error, term()}
  def my_price_watches(_parent, args, %{context: %{current_user: user}}) do
    user.id
    |> Alerts.list_watch_rules_query(enabled: Input.fetch_value(args, :enabled))
    |> Connection.from_query_result(Input.connection_args(args), Repo)
  end

  def my_price_watches(_parent, _args, _resolution),
    do: {:error, GraphQLErrors.unauthenticated()}

  @spec my_alert_events(any(), map(), Absinthe.Resolution.t()) :: {:ok, map()} | {:error, term()}
  def my_alert_events(_parent, args, %{context: %{current_user: user}}) do
    user.id
    |> Alerts.list_alert_events_query(unread_only: Input.fetch_value(args, :unread_only, false))
    |> Connection.from_query_result(Input.connection_args(args), Repo)
  end

  def my_alert_events(_parent, _args, _resolution),
    do: {:error, GraphQLErrors.unauthenticated()}

  @spec create_price_watch(any(), %{input: map()}, Absinthe.Resolution.t()) :: {:ok, map()}
  def create_price_watch(_parent, %{input: input}, %{context: %{current_user: user}}) do
    with {:ok, product_id} <- decode_integer_id(input, :product_id, :product),
         {:ok, merchant_product_id} <-
           decode_optional_integer_id(input, :merchant_product_id, :merchant_product),
         attrs <-
           input
           |> Input.take([
             :rule_type,
             :currency,
             :target_amount,
             :percentage_drop,
             :cooldown_seconds
           ])
           |> Map.put(:product_id, product_id)
           |> Map.put(:merchant_product_id, merchant_product_id),
         {:ok, watch} <- Alerts.create_watch(user.id, attrs) do
      {:ok, %{watch: watch, errors: []}}
    else
      {:error, {:invalid_id, field}} ->
        {:ok, watch_error_payload("INVALID_ID", "invalid #{field}", field)}

      {:error, :product_not_found} ->
        {:ok, watch_error_payload("NOT_FOUND", "product not found", "productId")}

      {:error, %Ecto.Changeset{} = changeset} ->
        {:ok, %{watch: nil, errors: GraphQLErrors.changeset_mutation_errors(changeset)}}

      {:error, _reason} ->
        {:ok, watch_error_payload("INVALID_ARGUMENT", "invalid price watch")}
    end
  end

  def create_price_watch(_parent, _args, _resolution),
    do: {:ok, watch_error_payload(GraphQLErrors.unauthenticated_mutation_error())}

  @spec update_price_watch(any(), %{input: map()}, Absinthe.Resolution.t()) :: {:ok, map()}
  def update_price_watch(_parent, %{input: input}, %{context: %{current_user: user}}) do
    with {:ok, entropy_id} <- decode_uuid_id(input, :id, :price_watch),
         attrs <-
           Input.take(input, [
             :target_amount,
             :percentage_drop,
             :enabled,
             :cooldown_seconds
           ]),
         {:ok, watch} <- Alerts.update_watch(user.id, entropy_id, attrs) do
      {:ok, %{watch: Repo.preload(watch, [:product, merchant_product: :merchant]), errors: []}}
    else
      {:error, {:invalid_id, field}} ->
        {:ok, watch_error_payload("INVALID_ID", "invalid #{field}", field)}

      {:error, :not_found} ->
        {:ok, watch_error_payload("NOT_FOUND", "price watch not found", "id")}

      {:error, %Ecto.Changeset{} = changeset} ->
        {:ok, %{watch: nil, errors: GraphQLErrors.changeset_mutation_errors(changeset)}}
    end
  end

  def update_price_watch(_parent, _args, _resolution),
    do: {:ok, watch_error_payload(GraphQLErrors.unauthenticated_mutation_error())}

  @spec delete_price_watch(any(), %{id: String.t()}, Absinthe.Resolution.t()) :: {:ok, map()}
  def delete_price_watch(_parent, %{id: id}, %{context: %{current_user: user}}) do
    with {:ok, entropy_id} <- decode_uuid(:price_watch, id),
         {:ok, _watch} <- Alerts.delete_watch(user.id, entropy_id) do
      {:ok, %{deleted_watch_id: id, errors: []}}
    else
      {:error, :invalid_id} ->
        {:ok, delete_error_payload("INVALID_ID", "invalid price watch id", "id")}

      {:error, :not_found} ->
        {:ok, delete_error_payload("NOT_FOUND", "price watch not found", "id")}
    end
  end

  def delete_price_watch(_parent, _args, _resolution),
    do: {:ok, delete_error_payload(GraphQLErrors.unauthenticated_mutation_error())}

  @spec mark_alert_read(any(), %{id: String.t()}, Absinthe.Resolution.t()) :: {:ok, map()}
  def mark_alert_read(_parent, %{id: id}, %{context: %{current_user: user}}) do
    with {:ok, entropy_id} <- decode_uuid(:alert_event, id),
         {:ok, event} <- Alerts.mark_alert_read(user.id, entropy_id) do
      {:ok, %{event: event, errors: []}}
    else
      {:error, :invalid_id} ->
        {:ok, event_error_payload("INVALID_ID", "invalid alert id", "id")}

      {:error, :not_found} ->
        {:ok, event_error_payload("NOT_FOUND", "alert not found", "id")}

      {:error, %Ecto.Changeset{} = changeset} ->
        {:ok, %{event: nil, errors: GraphQLErrors.changeset_mutation_errors(changeset)}}
    end
  end

  def mark_alert_read(_parent, _args, _resolution),
    do: {:ok, event_error_payload(GraphQLErrors.unauthenticated_mutation_error())}

  defp decode_integer_id(input, field, type) do
    case GlobalId.decode_integer(Input.fetch_value(input, field), type) do
      {:ok, id} -> {:ok, id}
      :error -> {:error, {:invalid_id, camelize(field)}}
    end
  end

  defp decode_optional_integer_id(input, field, type) do
    case Input.fetch_value(input, field) do
      nil -> {:ok, nil}
      _value -> decode_integer_id(input, field, type)
    end
  end

  defp decode_uuid_id(input, field, type) do
    case decode_uuid(type, Input.fetch_value(input, field)) do
      {:ok, id} -> {:ok, id}
      {:error, :invalid_id} -> {:error, {:invalid_id, camelize(field)}}
    end
  end

  defp decode_uuid(type, value) do
    case GlobalId.decode_uuid(value, type) do
      {:ok, id} -> {:ok, id}
      :error -> {:error, :invalid_id}
    end
  end

  defp watch_error_payload(code, message, field \\ nil),
    do: watch_error_payload(GraphQLErrors.mutation_error(code, message, field))

  defp watch_error_payload(error), do: %{watch: nil, errors: [error]}

  defp delete_error_payload(code, message, field),
    do: delete_error_payload(GraphQLErrors.mutation_error(code, message, field))

  defp delete_error_payload(error), do: %{deleted_watch_id: nil, errors: [error]}

  defp event_error_payload(code, message, field),
    do: event_error_payload(GraphQLErrors.mutation_error(code, message, field))

  defp event_error_payload(error), do: %{event: nil, errors: [error]}

  defp camelize(field), do: field |> Atom.to_string() |> Absinthe.Utils.camelize(lower: true)
end
