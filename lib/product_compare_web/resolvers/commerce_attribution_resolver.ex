defmodule ProductCompareWeb.Resolvers.CommerceAttributionResolver do
  @moduledoc false

  import Absinthe.Resolution.Helpers, only: [on_load: 2]

  alias ProductCompare.CommerceAttribution
  alias ProductCompareWeb.GraphQL.Errors, as: GraphQLErrors
  alias ProductCompareWeb.GraphQL.Authorization
  alias ProductCompareWeb.GraphQL.Input
  alias ProductCompareWeb.GraphQL.GlobalId
  alias ProductCompareWeb.GraphQL.Loader
  alias ProductCompareSchemas.CommerceAttribution.CommerceLink

  @invalid_filters_error "invalid revenue summary filters"
  @invalid_origin_message "cross-origin request rejected"
  @public_min_conversions 2

  @spec revenue_summary(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()}
          | {:error, String.t() | GraphQLErrors.top_level_error()}
          | Absinthe.Resolution.Helpers.dataloader_tuple()
  def revenue_summary(
        _parent,
        args,
        %{context: %{loader: %Dataloader{} = loader}} = resolution
      ) do
    input = Input.fetch_value(args || %{}, :input, %{}) || %{}

    with {:ok, operator} <- Authorization.require_operator(resolution),
         {:ok, filters} <- normalize_revenue_summary_input(input) do
      source = Loader.operator_reporting_source()
      connection_args = %{}
      batch_key = {:revenue_summary, operator.id, filters, connection_args}

      loader
      |> Dataloader.load(source, batch_key, :root)
      |> on_load(fn loader ->
        loader
        |> Dataloader.get(source, batch_key, :root)
        |> revenue_summary_result()
      end)
    else
      {:error, reason} when reason in [:unauthenticated, :forbidden] ->
        {:error, GraphQLErrors.authorization_error(reason)}

      {:error, _reason} ->
        {:error, @invalid_filters_error}
    end
  end

  def revenue_summary(_parent, args, resolution) do
    input = Input.fetch_value(args || %{}, :input, %{}) || %{}

    with {:ok, _user} <- Authorization.require_operator(resolution),
         {:ok, filters} <- normalize_revenue_summary_input(input),
         {:ok, summary} <-
           filters
           |> CommerceAttribution.dashboard_revenue_summary()
           |> graphql_summary() do
      {:ok, summary}
    else
      {:error, reason} when reason in [:unauthenticated, :forbidden] ->
        {:error, GraphQLErrors.authorization_error(reason)}

      {:error, _reason} ->
        {:error, @invalid_filters_error}
    end
  rescue
    ArgumentError -> {:error, @invalid_filters_error}
  end

  @spec track_commerce_click(any(), %{input: map()}, Absinthe.Resolution.t()) :: {:ok, map()}
  def track_commerce_click(_parent, %{input: input}, resolution) do
    with :ok <- require_trusted_request_origin(resolution),
         {:ok, merchant_product_id} <- decode_merchant_product_id(input),
         {:ok, tracked_click} <-
           CommerceAttribution.track_outbound_click(%{
             merchant_product_id: merchant_product_id,
             source_surface: :web,
             user_id: current_user_id(resolution)
           }) do
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

  defp normalize_revenue_summary_input(input) when is_map(input) do
    with {:ok, input} <-
           Input.decode_optional_integer_id_field(input, :merchant_id, :merchant, "merchant"),
         {:ok, input} <-
           Input.decode_optional_integer_id_field(input, :product_id, :product, "product"),
         {:ok, currency} <- normalize_revenue_currency(Input.fetch_value(input, :currency)),
         {:ok, from} <- normalize_revenue_date(Input.fetch_value(input, :from)),
         {:ok, network} <- normalize_revenue_network(Input.fetch_value(input, :network)),
         {:ok, to} <- normalize_revenue_date(Input.fetch_value(input, :to)) do
      filters =
        %{
          currency: currency,
          from: from,
          merchant_id: Input.fetch_value(input, :merchant_id),
          min_conversions: @public_min_conversions,
          network: network,
          product_id: Input.fetch_value(input, :product_id),
          to: to
        }
        |> drop_nil_values()

      {:ok, filters}
    else
      {:error, _reason} -> {:error, :invalid_id}
    end
  end

  defp normalize_revenue_summary_input(_input), do: {:error, :invalid_input}

  defp normalize_revenue_currency(nil), do: {:ok, nil}

  defp normalize_revenue_currency(currency) when is_binary(currency) do
    currency = String.upcase(currency)

    if String.match?(currency, ~r/^[A-Z]{3}$/),
      do: {:ok, currency},
      else: {:error, :invalid_currency}
  end

  defp normalize_revenue_currency(_currency), do: {:error, :invalid_currency}

  defp normalize_revenue_date(nil), do: {:ok, nil}
  defp normalize_revenue_date(%Date{} = date), do: {:ok, date}

  defp normalize_revenue_date(%DateTime{} = datetime) do
    {:ok, datetime |> DateTime.shift_zone!("Etc/UTC") |> DateTime.to_date()}
  end

  defp normalize_revenue_date(date) when is_binary(date), do: Date.from_iso8601(date)
  defp normalize_revenue_date(_date), do: {:error, :invalid_date}

  defp normalize_revenue_network(nil), do: {:ok, nil}

  defp normalize_revenue_network(network) when is_atom(network) do
    if network in CommerceLink.networks(),
      do: {:ok, network},
      else: {:error, :invalid_network}
  end

  defp normalize_revenue_network(network) when is_binary(network) do
    case Enum.find(CommerceLink.networks(), &(Atom.to_string(&1) == network)) do
      nil -> {:error, :invalid_network}
      network -> {:ok, network}
    end
  end

  defp normalize_revenue_network(_network), do: {:error, :invalid_network}

  defp revenue_summary_result({:ok, summary}), do: graphql_summary(summary)
  defp revenue_summary_result({:error, _reason}), do: {:error, @invalid_filters_error}
  defp revenue_summary_result(_result), do: {:error, @invalid_filters_error}

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

  defp require_trusted_request_origin(%{context: %{trusted_request_origin?: true}}), do: :ok
  defp require_trusted_request_origin(_resolution), do: {:error, :invalid_origin}

  defp graphql_summary(%{
         "filters" => filters,
         "metrics" => metrics,
         "suppression" => suppression
       }) do
    {:ok,
     %{
       filters: %{
         currency: filters["currency"],
         from: filters["from"],
         merchant_id: GlobalId.encode_optional_value(:merchant, filters["merchant_id"]),
         network: filters["network"],
         product_id: GlobalId.encode_optional_value(:product, filters["product_id"]),
         to: filters["to"]
       },
       metrics: %{
         average_paid_price: metrics["average_paid_price"],
         clicks: metrics["clicks"],
         commission_revenue: metrics["commission_revenue"],
         conversions: metrics["conversions"],
         currency: metrics["currency"],
         gross_order_value: metrics["gross_order_value"]
       },
       suppression: %{
         suppressed: suppression["suppressed"],
         threshold: suppression["threshold"]
       }
     }}
  end

  defp graphql_summary(_summary), do: {:error, :invalid_summary}

  defp commerce_click_error_payload(code, message, field \\ nil) do
    %{
      redirect_path: nil,
      errors: [GraphQLErrors.camelized_mutation_error(code, message, field)]
    }
  end

  defp drop_nil_values(map) do
    Map.reject(map, fn {_key, value} -> is_nil(value) end)
  end
end
