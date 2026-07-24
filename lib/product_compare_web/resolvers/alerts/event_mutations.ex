defmodule ProductCompareWeb.Resolvers.Alerts.EventMutations do
  @moduledoc false

  alias ProductCompare.Alerts
  alias ProductCompareWeb.GraphQL.Errors, as: GraphQLErrors
  alias ProductCompareWeb.GraphQL.GlobalId

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

  defp decode_uuid(type, value) do
    case GlobalId.decode_uuid(value, type) do
      {:ok, id} -> {:ok, id}
      :error -> {:error, :invalid_id}
    end
  end

  defp event_error_payload(code, message, field),
    do: event_error_payload(GraphQLErrors.mutation_error(code, message, field))

  defp event_error_payload(error), do: %{event: nil, errors: [error]}
end
