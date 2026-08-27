# CJ Commission Detail vocabulary and transport stay isolated from the product-ingestion CJ API.
defmodule ProductCompare.CommerceAttribution.CJ.Client do
  @moduledoc """
  Fetches one bounded page of CJ Commission Detail records.
  """

  @endpoint "https://commissions.api.cj.com/query"
  @default_req_options [
    receive_timeout: 15_000,
    connect_options: [timeout: 5_000],
    redirect: true
  ]

  @commission_detail_fields ~w(
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
  )

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
          account_id_configured: boolean()
        }
  def credential_status(opts \\ []) do
    opts = Map.new(opts)
    token? = present?(option_or_env(opts, :api_token, "CJ_API_TOKEN"))
    account? = match?({:ok, [_ | _]}, publisher_ids(opts))

    %{
      ready: token? and account?,
      api_token_configured: token?,
      account_id_configured: account?
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
        case normalize_string(option_or_env(opts, :account_id, "CJ_ACCOUNT_ID")) do
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

    with {:ok, publisher_ids} <- validate_publisher_ids(Map.get(request, :publisher_ids)),
         {:ok, from, before} <-
           validate_window(Map.get(request, :from), Map.get(request, :before)),
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
    case normalize_string(option_or_env(opts, :api_token, "CJ_API_TOKEN")) do
      nil -> {:error, {:missing_env, "CJ_API_TOKEN"}}
      token -> {:ok, token}
    end
  end

  defp validate_publisher_ids(publisher_ids) when is_list(publisher_ids) do
    publisher_ids = Enum.map(publisher_ids, &normalize_string/1)

    if publisher_ids != [] and Enum.all?(publisher_ids, &is_binary/1) do
      {:ok, publisher_ids}
    else
      {:error, {:invalid_request, :publisher_ids}}
    end
  end

  defp validate_publisher_ids(_publisher_ids), do: {:error, {:invalid_request, :publisher_ids}}

  defp validate_window(%DateTime{} = from, %DateTime{} = before) do
    if utc?(from) and utc?(before) and DateTime.compare(from, before) == :lt do
      {:ok, from, before}
    else
      {:error, {:invalid_request, :window}}
    end
  end

  defp validate_window(_from, _before), do: {:error, {:invalid_request, :window}}

  defp validate_cursor(:error), do: {:error, {:invalid_request, :since_commission_id}}
  defp validate_cursor({:ok, nil}), do: {:ok, nil}

  defp validate_cursor({:ok, value}) do
    case normalize_string(value) do
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

    %{
      method: :post,
      url: @endpoint,
      headers: [
        {"Authorization", "Bearer #{api_token}"},
        {"Content-Type", "application/json"}
      ],
      body: body,
      options: Keyword.merge(@default_req_options, Map.get(opts, :req_options, []))
    }
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

  defp default_transport(%{
         method: :post,
         url: url,
         headers: headers,
         body: body,
         options: options
       }) do
    case Req.post(url, Keyword.merge(options, headers: headers, body: body, decode_body: false)) do
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
    if Enum.all?(records, &valid_commission_detail_record?/1) do
      {:ok, records}
    else
      {:error, {:invalid_response, :record}}
    end
  end

  defp records(_publisher_commissions), do: {:error, {:invalid_response, :records}}

  defp valid_commission_detail_record?(record) when is_map(record) do
    Enum.all?(@commission_detail_fields, &Map.has_key?(record, &1)) and
      nonblank_string?(record["commissionId"]) and
      is_boolean(record["original"]) and
      nullable_string?(record["originalActionId"]) and
      nullable_string?(record["correctionReason"]) and
      nonblank_string?(record["actionStatus"]) and
      nullable_string?(record["shopperId"]) and
      nonblank_string?(record["eventDate"]) and
      nonblank_string?(record["postingDate"]) and
      nonblank_string?(record["saleAmountUsd"]) and
      nonblank_string?(record["pubCommissionAmountUsd"])
  end

  defp valid_commission_detail_record?(_record), do: false

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
        case normalize_string(value) do
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
    |> Enum.map(&normalize_string/1)
    |> Enum.reject(&is_nil/1)
  end

  defp option_or_env(opts, option, environment_key) do
    case Map.fetch(opts, option) do
      {:ok, value} -> value
      :error -> System.get_env(environment_key)
    end
  end

  defp present?(value), do: not is_nil(normalize_string(value))

  defp normalize_string(value) when is_binary(value) do
    case String.trim(value) do
      "" -> nil
      normalized -> normalized
    end
  end

  defp normalize_string(_value), do: nil

  defp nonblank_string?(value), do: not is_nil(normalize_string(value))
  defp nullable_string?(nil), do: true
  defp nullable_string?(value), do: is_binary(value)

  defp utc?(%DateTime{utc_offset: 0, std_offset: 0}), do: true
  defp utc?(_datetime), do: false
end
