defmodule ProductCompareWeb.Resolvers.CommerceAttribution.Mutations do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Accounts
  alias ProductCompare.CommerceAttribution
  alias ProductCompare.CommerceAttribution.CJ.Client
  alias ProductCompare.CommerceAttribution.CJCommissionSyncJobs
  alias ProductCompare.CommerceAttribution.ConversionSyncSettings
  alias ProductCompare.Repo
  alias ProductCompareWeb.GraphQL.Authorization
  alias ProductCompareWeb.GraphQL.Errors, as: GraphQLErrors
  alias ProductCompareWeb.GraphQL.Input
  alias ProductCompareWeb.Resolvers.CommerceAttribution.Reads
  alias ProductCompareSchemas.CommerceAttribution.ConversionSyncRun
  alias ProductCompareSchemas.CommerceAttribution.ConversionSyncSetting

  @invalid_origin_message "cross-origin request rejected"
  @setting_fields [:enabled, :interval_minutes, :lookback_days, :max_pages]

  @spec update_cj_commission_ingestion_settings(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()}
  def update_cj_commission_ingestion_settings(_parent, args, resolution) do
    with {:ok, operator} <- Authorization.require_operator(resolution) do
      input = Input.fetch_value(args || %{}, :input, %{}) || %{}
      attrs = Input.take(input, @setting_fields)
      now = observed_at(resolution)

      operator_transaction(operator.id, fn settings ->
        with :ok <- require_activation_readiness(settings, attrs),
             {:ok, updated} <-
               ConversionSyncSettings.update_locked(settings, operator.id, attrs, now) do
          {:ok, updated}
        end
      end)
      |> mutation_payload(resolution)
    else
      {:error, reason} -> {:ok, error_payload(reason)}
    end
  end

  @spec run_cj_commission_ingestion_now(any(), map(), Absinthe.Resolution.t()) :: {:ok, map()}
  def run_cj_commission_ingestion_now(_parent, _args, resolution) do
    with {:ok, operator} <- Authorization.require_operator(resolution) do
      now = observed_at(resolution)

      operator_transaction(operator.id, fn settings ->
        CJCommissionSyncJobs.run_now_locked(settings, operator.id, now)
      end)
      |> mutation_payload(resolution)
    else
      {:error, reason} -> {:ok, error_payload(reason)}
    end
  end

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
               anonymous_visitor_entropy_id: resolution.context[:anonymous_visitor_entropy_id],
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

  defp operator_transaction(operator_id, operation) when is_function(operation, 1) do
    Repo.transaction(fn ->
      with {:ok, _operator} <- Accounts.lock_operator(operator_id),
           %ConversionSyncSetting{} = settings <- ConversionSyncSettings.lock_cj(),
           {:ok, result} <- operation.(settings) do
        result
      else
        {:error, reason} -> Repo.rollback(reason)
        nil -> Repo.rollback(:not_found)
      end
    end)
  end

  defp require_activation_readiness(
         %ConversionSyncSetting{enabled: false, affiliate_network_id: affiliate_network_id},
         %{enabled: true}
       ) do
    with %{ready: true} <- Client.credential_status(),
         true <- successful_run_exists?(affiliate_network_id) do
      :ok
    else
      %{ready: false} -> {:error, :credentials_missing}
      false -> {:error, :activation_not_ready}
    end
  end

  defp require_activation_readiness(_settings, _attrs), do: :ok

  defp successful_run_exists?(affiliate_network_id) do
    Repo.exists?(
      from run in ConversionSyncRun,
        where: run.affiliate_network_id == ^affiliate_network_id and run.status == :succeeded
    )
  end

  defp mutation_payload({:ok, _result}, resolution) do
    case Reads.cj_commission_ingestion(nil, %{}, resolution) do
      {:ok, ingestion} -> {:ok, %{ingestion: ingestion, errors: []}}
      {:error, _reason} -> {:ok, error_payload(:ingestion_unavailable)}
    end
  end

  defp mutation_payload({:error, reason}, _resolution), do: {:ok, error_payload(reason)}

  defp error_payload(reason) when reason in [:unauthenticated, :forbidden] do
    %{ingestion: nil, errors: [GraphQLErrors.authorization_mutation_error(reason)]}
  end

  defp error_payload(:credentials_missing) do
    mutation_error_payload(
      "CREDENTIALS_MISSING",
      "CJ commission ingestion credentials are not configured"
    )
  end

  defp error_payload(:activation_not_ready) do
    mutation_error_payload(
      "ACTIVATION_NOT_READY",
      "a successful CJ commission sync is required before enabling ingestion"
    )
  end

  defp error_payload(:ingestion_unavailable) do
    mutation_error_payload(
      "INGESTION_UNAVAILABLE",
      "the change was applied but CJ commission ingestion state could not be read"
    )
  end

  defp error_payload(%Ecto.Changeset{} = changeset) do
    errors =
      changeset
      |> GraphQLErrors.changeset_mutation_errors()
      |> Enum.map(fn error ->
        GraphQLErrors.camelized_mutation_error(error.code, error.message, error.field)
      end)

    %{ingestion: nil, errors: errors}
  end

  defp error_payload(_reason) do
    mutation_error_payload("INVALID_ARGUMENT", "CJ commission ingestion request is invalid")
  end

  defp mutation_error_payload(code, message, field \\ nil) do
    %{
      ingestion: nil,
      errors: [GraphQLErrors.camelized_mutation_error(code, message, field)]
    }
  end

  defp observed_at(%{context: %{graphql_observed_at: %DateTime{} = now}}), do: now
  defp observed_at(_resolution), do: DateTime.utc_now()
end
