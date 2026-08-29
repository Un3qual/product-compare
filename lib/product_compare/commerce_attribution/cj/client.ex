# CJ Commission Detail vocabulary and transport stay isolated from the product-ingestion CJ API.
defmodule ProductCompare.CommerceAttribution.CJ.Client do
  @moduledoc """
  Fetches one bounded page of CJ Commission Detail records.
  """

  @endpoint "https://commissions.api.cj.com/query"
  @default_req_options [
    receive_timeout: 15_000,
    connect_options: [timeout: 5_000],
    redirect: false
  ]

  alias ProductCompare.CommerceAttribution.CJ.CommissionDetail
  alias ProductCompare.CommerceAttribution.CJ.HttpRequest

  @commission_detail_query """
  query CommissionDetail(
    $forPublishers: [String!]!,
    $sincePostingDate: DateTime!,
    $beforePostingDate: DateTime!,
    $sinceCommissionId: String
  ) {
    publisherCommissions(
      forPublishers: $forPublishers,
      sincePostingDate: $sincePostingDate,
      beforePostingDate: $beforePostingDate,
      sinceCommissionId: $sinceCommissionId
    ) {
      records {
        commissionId
        original
        originalActionId
        correctionReason
        actionStatus
        shopperId
        eventDate
        postingDate
        saleAmountUsd
        pubCommissionAmountUsd
      }
      payloadComplete
      maxCommissionId
    }
  }
  """

  @type page_request :: %{
          required(:publisher_ids) => [String.t()],
          required(:from) => DateTime.t(),
          required(:before) => DateTime.t(),
          required(:since_commission_id) => String.t() | nil
        }

  @type page :: %{
          records: [map()],
          payload_complete: boolean(),
          max_commission_id: String.t() | nil
        }

  @spec credential_status(map() | keyword()) :: %{
          ready: boolean(),
          api_token_configured: boolean(),
          publisher_ids_configured: boolean()
        }
  def credential_status(opts \\ []) do
    opts = Map.new(opts)
    token? = present?(option_or_env(opts, :api_token, "CJ_API_TOKEN"))
    publisher_ids? = match?({:ok, [_ | _]}, publisher_ids(opts))

    %{
      ready: token? and publisher_ids?,
      api_token_configured: token?,
      publisher_ids_configured: publisher_ids?
    }
  end

  @spec publisher_ids(map() | keyword()) ::
          {:ok, [String.t()]} | {:error, {:missing_env, String.t()}}
  def publisher_ids(opts \\ []) do
    opts = Map.new(opts)

    case normalize_publisher_ids(
           option_or_env(opts, :publisher_ids, "CJ_COMMISSION_PUBLISHER_IDS")
         ) do
      [] ->
        case CommissionDetail.normalize_string(option_or_env(opts, :account_id, "CJ_ACCOUNT_ID")) do
          nil -> {:error, {:missing_env, "CJ_ACCOUNT_ID"}}
          account_id -> {:ok, [account_id]}
        end

      publisher_ids ->
        {:ok, publisher_ids}
    end
  end

  @spec fetch_page(page_request(), map() | keyword()) :: {:ok, page()} | {:error, term()}
  def fetch_page(request, opts \\ [])

  def fetch_page(request, opts) when is_map(request) do
    opts = Map.new(opts)

    with {:ok, publisher_ids} <-
           CommissionDetail.validate_publisher_ids(Map.get(request, :publisher_ids)),
         {:ok, from, before} <-
           CommissionDetail.validate_window(Map.get(request, :from), Map.get(request, :before)),
         {:ok, since_commission_id} <-
           validate_cursor(Map.fetch(request, :since_commission_id)),
         {:ok, api_token} <- api_token(opts),
         {:ok, response} <-
           call_transport(
             request(api_token, publisher_ids, from, before, since_commission_id, opts),
             opts
           ) do
      decode_response(response)
    end
  end

  def fetch_page(_request, _opts), do: {:error, {:invalid_request, :page}}

  defp api_token(opts) do
    case CommissionDetail.normalize_string(option_or_env(opts, :api_token, "CJ_API_TOKEN")) do
      nil -> {:error, {:missing_env, "CJ_API_TOKEN"}}
      token -> {:ok, token}
    end
  end

  defp validate_cursor(:error), do: {:error, {:invalid_request, :since_commission_id}}
  defp validate_cursor({:ok, nil}), do: {:ok, nil}

  defp validate_cursor({:ok, value}) do
    case CommissionDetail.normalize_string(value) do
      nil -> {:error, {:invalid_request, :since_commission_id}}
      cursor -> {:ok, cursor}
    end
  end

  defp request(api_token, publisher_ids, from, before, since_commission_id, opts) do
    body =
      Jason.encode!(%{
        query: @commission_detail_query,
        variables: %{
          forPublishers: publisher_ids,
          sincePostingDate: DateTime.to_iso8601(from),
          beforePostingDate: DateTime.to_iso8601(before),
          sinceCommissionId: since_commission_id
        }
      })

    %HttpRequest{
      method: :post,
      url: @endpoint,
      headers: [
        {"Authorization", "Bearer #{api_token}"},
        {"Content-Type", "application/json"}
      ],
      body: body,
      options: request_options(opts)
    }
  end

  defp request_options(opts) do
    @default_req_options
    |> Keyword.merge(Map.get(opts, :req_options, []))
    |> Keyword.drop([:follow_redirects, :location_trusted, :redirect_trusted, :url])
    |> Keyword.put(:redirect, false)
  end

  defp call_transport(request, opts) do
    case Map.get(opts, :transport, &default_transport/1).(request) do
      {:ok, %{status: status, body: body}} when is_integer(status) and is_binary(body) ->
        {:ok, %{status: status, body: body}}

      {:ok, _response} ->
        {:error, {:invalid_response, :transport}}

      {:error, _reason} ->
        {:error, {:transport_error, :request_failed}}

      _result ->
        {:error, {:transport_error, :request_failed}}
    end
  rescue
    _exception -> {:error, {:transport_error, :request_failed}}
  catch
    _kind, _reason -> {:error, {:transport_error, :request_failed}}
  end

  defp default_transport(%HttpRequest{
         method: :post,
         url: url,
         headers: headers,
         body: body,
         options: options
       }) do
    request =
      url
      |> Req.new(Keyword.merge(options, headers: headers, body: body, decode_body: false))
      |> Map.put(:method, :post)
      |> Map.put(:url, URI.parse(url))
      |> update_in(
        [Access.key!(:options)],
        &(&1
          |> Map.drop([:follow_redirects, :location_trusted, :redirect_trusted])
          |> Map.put(:redirect, false))
      )

    case Req.request(request) do
      {:ok, %{status: status, body: response_body}} ->
        {:ok, %{status: status, body: IO.iodata_to_binary(response_body)}}

      {:error, _reason} ->
        {:error, :request_failed}
    end
  end

  defp decode_response(%{status: status}) when status < 200 or status > 299,
    do: {:error, {:http_error, status}}

  defp decode_response(%{body: body}) do
    with {:ok, decoded} <- Jason.decode(body),
         :ok <- reject_graphql_errors(decoded),
         {:ok, publisher_commissions} <- publisher_commissions(decoded),
         {:ok, records} <- records(publisher_commissions),
         {:ok, payload_complete} <- payload_complete(publisher_commissions),
         {:ok, max_commission_id} <- max_commission_id(publisher_commissions),
         :ok <- require_cursor_when_incomplete(payload_complete, max_commission_id) do
      {:ok,
       %{
         records: records,
         payload_complete: payload_complete,
         max_commission_id: max_commission_id
       }}
    else
      {:error, %Jason.DecodeError{}} -> {:error, {:decode_error, :invalid_json}}
      {:error, reason} -> {:error, reason}
    end
  end

  defp reject_graphql_errors(%{"errors" => errors}) when is_list(errors),
    do: {:error, {:graphql_error, graphql_error_code(errors)}}

  defp reject_graphql_errors(%{"errors" => _errors}),
    do: {:error, {:invalid_response, :graphql_errors}}

  defp reject_graphql_errors(_decoded), do: :ok

  defp publisher_commissions(%{"data" => data}) when is_map(data) do
    case Map.get(data, "publisherCommissions") do
      publisher_commissions when is_map(publisher_commissions) -> {:ok, publisher_commissions}
      _missing -> {:error, {:invalid_response, :publisher_commissions}}
    end
  end

  defp publisher_commissions(_decoded), do: {:error, {:invalid_response, :publisher_commissions}}

  defp records(%{"records" => records}) when is_list(records) do
    if Enum.all?(records, &CommissionDetail.valid_record?/1) do
      {:ok, records}
    else
      {:error, {:invalid_response, :record}}
    end
  end

  defp records(_publisher_commissions), do: {:error, {:invalid_response, :records}}

  defp payload_complete(%{"payloadComplete" => payload_complete})
       when is_boolean(payload_complete),
       do: {:ok, payload_complete}

  defp payload_complete(_publisher_commissions),
    do: {:error, {:invalid_response, :payload_complete}}

  defp max_commission_id(publisher_commissions) do
    case Map.fetch(publisher_commissions, "maxCommissionId") do
      {:ok, nil} ->
        {:ok, nil}

      {:ok, value} ->
        case CommissionDetail.normalize_string(value) do
          nil -> {:error, {:invalid_response, :max_commission_id}}
          cursor -> {:ok, cursor}
        end

      :error ->
        {:error, {:invalid_response, :max_commission_id}}
    end
  end

  defp require_cursor_when_incomplete(false, nil),
    do: {:error, {:invalid_response, :max_commission_id}}

  defp require_cursor_when_incomplete(_payload_complete, _max_commission_id), do: :ok

  defp graphql_error_code([%{"extensions" => %{"code" => code}} | _errors]) when is_binary(code),
    do: code

  defp graphql_error_code([_error | _errors]), do: nil
  defp graphql_error_code([]), do: nil

  defp normalize_publisher_ids(value) when is_binary(value),
    do: value |> String.split(",") |> normalize_ids()

  defp normalize_publisher_ids(value) when is_list(value), do: normalize_ids(value)
  defp normalize_publisher_ids(_value), do: []

  defp normalize_ids(values) do
    values
    |> Enum.map(&CommissionDetail.normalize_string/1)
    |> Enum.reject(&is_nil/1)
  end

  defp option_or_env(opts, option, environment_key) do
    case Map.fetch(opts, option) do
      {:ok, value} -> value
      :error -> System.get_env(environment_key)
    end
  end

  defp present?(value), do: not is_nil(CommissionDetail.normalize_string(value))
end
