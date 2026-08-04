defmodule ProductCompareWeb.Resolvers.CommerceAttribution.Mutations do
  @moduledoc false

  alias ProductCompare.CommerceAttribution
  alias ProductCompareWeb.GraphQL.Errors, as: GraphQLErrors
  alias ProductCompareWeb.GraphQL.Input

  @invalid_origin_message "cross-origin request rejected"

  @spec track_commerce_click(any(), %{input: map()}, Absinthe.Resolution.t()) :: {:ok, map()}
  def track_commerce_click(_parent, %{input: input}, resolution) do
    with :ok <- require_trusted_request_origin(resolution),
         {:ok, merchant_product_id} <- decode_merchant_product_id(input),
         {:ok, tracked_click} <-
           CommerceAttribution.track_outbound_click(
             resolution
             |> request_diagnostics()
             |> Map.merge(%{
               merchant_product_id: merchant_product_id,
               source_surface: :web,
               user_id: current_user_id(resolution)
             })
           ) do
      {:ok, %{redirect_path: tracked_click.redirect_path, errors: []}}
    else
      {:error, :invalid_origin} ->
        {:ok, commerce_click_error_payload("INVALID_ORIGIN", @invalid_origin_message)}

      {:error, :invalid_id} ->
        {:ok,
         commerce_click_error_payload(
           "INVALID_ID",
           "invalid merchant product id",
           :merchant_product_id
         )}

      {:error, :merchant_product_not_found} ->
        {:ok,
         commerce_click_error_payload(
           "NOT_FOUND",
           "merchant product not found",
           :merchant_product_id
         )}

      {:error, %Ecto.Changeset{} = changeset} ->
        {field, message} = GraphQLErrors.changeset_first_error(changeset)
        {:ok, commerce_click_error_payload("INVALID_ARGUMENT", message, field)}
    end
  end

  defp decode_merchant_product_id(input) when is_map(input) do
    input
    |> Input.fetch_value(:merchant_product_id)
    |> Input.decode_required_integer_id(:merchant_product, "merchant product")
    |> case do
      {:ok, merchant_product_id} -> {:ok, merchant_product_id}
      {:error, _message} -> {:error, :invalid_id}
    end
  end

  defp decode_merchant_product_id(_input), do: {:error, :invalid_id}

  defp current_user_id(%{context: %{current_user: %{id: id}}}) when is_integer(id), do: id
  defp current_user_id(_resolution), do: nil

  defp request_diagnostics(%{context: %{request_diagnostics: diagnostics}})
       when is_map(diagnostics),
       do: diagnostics

  defp request_diagnostics(_resolution), do: %{}

  defp require_trusted_request_origin(%{context: %{trusted_request_origin?: true}}), do: :ok
  defp require_trusted_request_origin(_resolution), do: {:error, :invalid_origin}

  defp commerce_click_error_payload(code, message, field \\ nil) do
    %{
      redirect_path: nil,
      errors: [GraphQLErrors.camelized_mutation_error(code, message, field)]
    }
  end
end
