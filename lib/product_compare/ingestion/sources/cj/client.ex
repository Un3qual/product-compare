defmodule ProductCompare.Ingestion.Sources.CJ.Client do
  @moduledoc """
  Minimal CJ GraphQL client for manual product ingestion.
  """

  alias ProductCompare.Ingestion.Sources.CJ.IdNormalizer

  @endpoint "https://ads.api.cj.com/query"

  @product_query """
  query(
    $companyId: ID!,
    $adIds: [ID!],
    $keywords: [String!],
    $partnerIds: [ID!],
    $limit: Int!,
    $offset: Int!,
    $currency: String,
    $serviceableAreas: [String!]
  ) {
    shoppingProducts(
      companyId: $companyId,
      adIds: $adIds,
      keywords: $keywords,
      partnerIds: $partnerIds,
      partnerStatus: JOINED,
      limit: $limit,
      offset: $offset,
      currency: $currency,
      serviceableAreas: $serviceableAreas
    ) {
      totalCount
      count
      limit
      resultList {
        adId
        advertiserId
        advertiserName
        title
        brand
        gtin
        link
        price {
          amount
          currency
        }
        availability
        lastUpdated
        targetCountry
        serviceableAreas
        catalogName
      }
    }
  }
  """

  @feed_query """
  query(
    $companyId: ID!,
    $limit: Int!,
    $offset: Int!,
    $advertiserCountry: String
  ) {
    shoppingProductFeeds(
      companyId: $companyId,
      limit: $limit,
      offset: $offset,
      advertiserCountry: $advertiserCountry
    ) {
      totalCount
      count
      limit
      resultList {
        adId
        advertiserId
        advertiserName
        advertiserCountry
        sourceFeedType
        currency
        language
        feedName
        lastUpdated
        productCount
      }
    }
  }
  """

  @type request :: %{
          required(:method) => :post,
          required(:url) => String.t(),
          required(:headers) => [{String.t(), String.t()}],
          required(:body) => String.t()
        }

  @type response :: %{required(:status) => pos_integer(), required(:body) => String.t()}

  @spec fetch_batch(term(), map() | keyword()) ::
          {:ok, [map()], non_neg_integer() | nil} | {:error, term()}
  def fetch_batch(cursor, opts) do
    opts = Map.new(opts)

    with {:ok, config} <- config_from_env(opts),
         {:ok, request, offset, limit} <- build_product_request(cursor, opts, config),
         {:ok, response} <- transport(opts).(request),
         {:ok, records, next_cursor} <- decode_response(response, offset, limit) do
      {:ok, records, next_cursor}
    end
  end

  @spec fetch_feeds(term(), map() | keyword()) ::
          {:ok, [map()], non_neg_integer() | nil} | {:error, term()}
  def fetch_feeds(cursor, opts) do
    opts = Map.new(opts)

    with {:ok, config} <- config_from_env(opts),
         {:ok, request, offset, limit} <- build_feed_request(cursor, opts, config),
         {:ok, response} <- transport(opts).(request),
         {:ok, records, next_cursor} <-
           decode_response(response, offset, limit, "shoppingProductFeeds") do
      {:ok, records, next_cursor}
    end
  end

  defp config_from_env(opts) do
    with {:ok, api_token} <- required_config(opts, :api_token, "CJ_API_TOKEN"),
         {:ok, company_id} <- required_config(opts, :company_id, "CJ_ACCOUNT_ID") do
      {:ok, %{api_token: api_token, company_id: company_id}}
    end
  end

  defp required_config(opts, option_key, env_key) do
    opts
    |> Map.get(option_key)
    |> IdNormalizer.blank_to_nil()
    |> case do
      nil ->
        env_key
        |> System.get_env()
        |> IdNormalizer.blank_to_nil()
        |> case do
          nil -> {:error, {:missing_env, env_key}}
          value -> {:ok, value}
        end

      value ->
        {:ok, value}
    end
  end

  defp build_product_request(cursor, opts, %{api_token: api_token, company_id: company_id}) do
    offset = cursor || Map.get(opts, :offset, 0)
    limit = Map.get(opts, :limit, 25)

    body =
      Jason.encode!(%{
        query: @product_query,
        variables: %{
          adIds: ad_ids(opts),
          companyId: company_id,
          keywords: Map.get(opts, :keywords, ["shoe"]),
          limit: limit,
          offset: offset,
          partnerIds: partner_ids(opts),
          currency: Map.get(opts, :currency, "USD"),
          serviceableAreas: serviceable_areas(opts)
        }
      })

    request = %{
      method: :post,
      url: @endpoint,
      headers: [
        {"Authorization", "Bearer #{api_token}"},
        {"Content-Type", "application/json"}
      ],
      body: body
    }

    {:ok, request, offset, limit}
  end

  defp build_feed_request(cursor, opts, %{api_token: api_token, company_id: company_id}) do
    offset = cursor || Map.get(opts, :offset, 0)
    limit = Map.get(opts, :limit, 25)

    body =
      Jason.encode!(%{
        query: @feed_query,
        variables: %{
          companyId: company_id,
          limit: limit,
          offset: offset,
          advertiserCountry: Map.get(opts, :advertiser_country, "US")
        }
      })

    request = %{
      method: :post,
      url: @endpoint,
      headers: [
        {"Authorization", "Bearer #{api_token}"},
        {"Content-Type", "application/json"}
      ],
      body: body
    }

    {:ok, request, offset, limit}
  end

  defp transport(opts), do: Map.get(opts, :transport, &default_transport/1)

  defp default_transport(%{method: :post, url: url, headers: headers, body: body}) do
    with {:ok, _started} <- Application.ensure_all_started(:inets),
         {:ok, _started} <- Application.ensure_all_started(:ssl) do
      http_headers =
        Enum.map(headers, fn {key, value} ->
          {String.to_charlist(key), String.to_charlist(value)}
        end)

      request = {
        String.to_charlist(url),
        http_headers,
        ~c"application/json",
        String.to_charlist(body)
      }

      case :httpc.request(:post, request, [{:autoredirect, true}], body_format: :binary) do
        {:ok, {{_http_version, status, _reason}, _response_headers, response_body}} ->
          {:ok, %{status: status, body: IO.iodata_to_binary(response_body)}}

        {:error, reason} ->
          {:error, {:transport_error, reason}}
      end
    end
  end

  defp decode_response(response, offset, limit),
    do: decode_response(response, offset, limit, "shoppingProducts")

  defp decode_response(%{status: status, body: body}, _offset, _limit, _field)
       when status < 200 or status > 299 do
    {:error, {:http_error, status, body}}
  end

  defp decode_response(%{status: _status, body: body}, offset, limit, field) do
    with {:ok, decoded} <- Jason.decode(body),
         :ok <- reject_graphql_errors(decoded),
         {:ok, result_set} <- result_set(decoded, field) do
      records = Map.get(result_set, "resultList", [])
      count = Map.get(result_set, "count", length(records))
      total_count = Map.get(result_set, "totalCount", offset + count)
      effective_limit = Map.get(result_set, "limit", limit)
      next_cursor = next_cursor(offset, count, total_count, effective_limit)

      {:ok, records, next_cursor}
    else
      {:error, %Jason.DecodeError{} = reason} -> {:error, {:decode_error, reason}}
      {:error, reason} -> {:error, reason}
    end
  end

  defp reject_graphql_errors(%{"errors" => errors}) when is_list(errors),
    do: {:error, {:graphql_errors, errors}}

  defp reject_graphql_errors(_decoded), do: :ok

  defp result_set(%{"data" => data}, field) when is_map(data) do
    case Map.get(data, field) do
      result_set when is_map(result_set) -> {:ok, result_set}
      _missing -> {:error, {:missing_result_set, field}}
    end
  end

  defp result_set(_decoded, field), do: {:error, {:missing_result_set, field}}

  defp next_cursor(offset, count, total_count, limit)
       when count == limit and offset + count < total_count do
    offset + count
  end

  defp next_cursor(_offset, _count, _total_count, _limit), do: nil

  defp serviceable_areas(opts) do
    opts
    |> Map.get(:serviceable_areas, ["US"])
    |> case do
      nil -> ["US"]
      value when is_binary(value) -> [value]
      value when is_list(value) -> value
    end
    |> Enum.map(&String.trim/1)
    |> Enum.reject(&(&1 == ""))
    |> case do
      [] -> ["US"]
      areas -> areas
    end
  end

  defp ad_ids(opts) do
    opts
    |> Map.get(:ad_ids)
    |> IdNormalizer.normalize_ids()
  end

  defp partner_ids(opts) do
    opts
    |> Map.get(:partner_ids, Map.get(opts, :advertiser_ids))
    |> IdNormalizer.normalize_ids()
  end
end
