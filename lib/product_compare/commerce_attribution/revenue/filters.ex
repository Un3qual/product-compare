defmodule ProductCompare.CommerceAttribution.Revenue.Filters do
  @moduledoc false

  alias ProductCompareSchemas.CommerceAttribution.CommerceLink

  @max_bigint_id 9_223_372_036_854_775_807

  @spec normalize(map() | keyword()) :: map()
  def normalize(opts) do
    %{
      currency: normalize_currency(get(opts, :currency)),
      from: normalize_date(get(opts, :from)),
      merchant_id: normalize_dimension_id(get(opts, :merchant_id), :merchant_id),
      min_conversions: normalize_min_conversions(get(opts, :min_conversions)),
      network: normalize_network(get(opts, :network)),
      product_id: normalize_dimension_id(get(opts, :product_id), :product_id),
      to: normalize_date(get(opts, :to))
    }
  end

  @spec for_dashboard(map()) :: map()
  def for_dashboard(filters) do
    %{
      "currency" => filters.currency,
      "from" => date_string(filters.from),
      "merchant_id" => filters.merchant_id,
      "network" => network_string(filters.network),
      "product_id" => filters.product_id,
      "to" => date_string(filters.to)
    }
  end

  @spec put(map() | keyword() | any(), atom(), any()) :: map() | keyword()
  def put(opts, key, value) when is_list(opts), do: Keyword.put(opts, key, value)
  def put(opts, key, value) when is_map(opts), do: Map.put(opts, key, value)
  def put(_opts, key, value), do: %{key => value}

  @spec start_datetime(Date.t()) :: DateTime.t()
  def start_datetime(%Date{} = date), do: DateTime.new!(date, ~T[00:00:00], "Etc/UTC")

  @spec exclusive_end_datetime(Date.t()) :: DateTime.t()
  def exclusive_end_datetime(%Date{} = date) do
    date
    |> Date.add(1)
    |> DateTime.new!(~T[00:00:00], "Etc/UTC")
  end

  defp get(opts, key) when is_list(opts), do: Keyword.get(opts, key)

  defp get(opts, key) when is_map(opts),
    do: Map.get(opts, key, Map.get(opts, Atom.to_string(key)))

  defp get(_opts, _key), do: nil

  defp normalize_date(nil), do: nil
  defp normalize_date(%Date{} = date), do: date

  defp normalize_date(%DateTime{} = datetime) do
    datetime
    |> DateTime.shift_zone!("Etc/UTC")
    |> DateTime.to_date()
  end

  defp normalize_date(date) when is_binary(date) do
    case Date.from_iso8601(date) do
      {:ok, date} -> date
      {:error, _reason} -> raise ArgumentError, "invalid revenue summary date"
    end
  end

  defp normalize_min_conversions(nil), do: 0
  defp normalize_min_conversions(value) when is_integer(value) and value >= 0, do: value

  defp normalize_min_conversions(value) when is_binary(value) do
    case Integer.parse(value) do
      {integer, ""} when integer >= 0 -> integer
      _invalid -> raise ArgumentError, "invalid revenue summary suppression threshold"
    end
  end

  defp normalize_min_conversions(_value),
    do: raise(ArgumentError, "invalid revenue summary suppression threshold")

  defp normalize_dimension_id(nil, _field), do: nil

  defp normalize_dimension_id(value, _field)
       when is_integer(value) and value > 0 and value <= @max_bigint_id,
       do: value

  defp normalize_dimension_id(value, field) when is_binary(value) do
    case Integer.parse(value) do
      {integer, ""} when integer > 0 and integer <= @max_bigint_id -> integer
      _invalid -> raise_invalid_dimension_id!(field)
    end
  end

  defp normalize_dimension_id(_value, field), do: raise_invalid_dimension_id!(field)

  defp raise_invalid_dimension_id!(field),
    do: raise(ArgumentError, "invalid revenue summary #{field}")

  defp normalize_currency(nil), do: nil

  defp normalize_currency(currency) when is_binary(currency) do
    currency = String.upcase(currency)

    if String.match?(currency, ~r/^[A-Z]{3}$/) do
      currency
    else
      raise ArgumentError, "invalid revenue summary currency"
    end
  end

  defp normalize_currency(_currency), do: raise(ArgumentError, "invalid revenue summary currency")

  defp normalize_network(nil), do: nil

  defp normalize_network(network) when is_atom(network) do
    if network in CommerceLink.networks() do
      network
    else
      raise ArgumentError, "invalid revenue summary network"
    end
  end

  defp normalize_network(network) when is_binary(network) do
    network =
      Enum.find(CommerceLink.networks(), fn supported_network ->
        Atom.to_string(supported_network) == network
      end)

    network || raise ArgumentError, "invalid revenue summary network"
  end

  defp normalize_network(_network), do: raise(ArgumentError, "invalid revenue summary network")

  defp date_string(nil), do: nil
  defp date_string(%Date{} = date), do: Date.to_iso8601(date)

  defp network_string(nil), do: nil
  defp network_string(network), do: Atom.to_string(network)
end
