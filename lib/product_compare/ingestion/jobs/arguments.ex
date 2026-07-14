defmodule ProductCompare.Ingestion.Jobs.Arguments do
  @moduledoc false

  alias ProductCompare.Ingestion.OptionNormalization

  @default_currency "USD"
  @default_keywords ["shoe"]
  @default_limit 25
  @default_pages 1
  @default_serviceable_areas ["US"]

  @spec product(keyword() | map() | String.t()) :: map()
  def product(schedule_window) when is_binary(schedule_window),
    do: product(schedule_window: schedule_window)

  def product(opts) do
    %{
      "complete_scope" => boolean_option(opts, :complete_scope, false),
      "currency" => uppercase_option(opts, :currency, @default_currency),
      "cursor" => OptionNormalization.non_negative_integer_option(opts, :cursor, nil),
      "keywords" => string_list_option(opts, :keywords, @default_keywords, & &1),
      "limit" => OptionNormalization.positive_integer_option(opts, :limit, @default_limit),
      "pages" => OptionNormalization.positive_integer_option(opts, :pages, @default_pages),
      "schedule_window" => schedule_window(opts),
      "serviceable_areas" =>
        string_list_option(opts, :serviceable_areas, @default_serviceable_areas, &String.upcase/1)
    }
  end

  @spec feed(keyword() | map() | String.t()) :: map()
  def feed(schedule_window) when is_binary(schedule_window),
    do: feed(schedule_window: schedule_window)

  def feed(opts) do
    %{
      "advertiser_country" => uppercase_option(opts, :advertiser_country, "US"),
      "cursor" => OptionNormalization.non_negative_integer_option(opts, :cursor, nil),
      "limit" => OptionNormalization.positive_integer_option(opts, :limit, @default_limit),
      "pages" => OptionNormalization.positive_integer_option(opts, :pages, @default_pages),
      "schedule_window" => schedule_window(opts)
    }
  end

  @spec product_runner_opts(map()) :: keyword()
  def product_runner_opts(args) do
    [
      complete_scope: args["complete_scope"],
      currency: args["currency"],
      keywords: args["keywords"],
      limit: args["limit"],
      pages: args["pages"],
      serviceable_areas: args["serviceable_areas"],
      cursor: args["cursor"]
    ]
  end

  @spec feed_runner_opts(map()) :: keyword()
  def feed_runner_opts(args) do
    [
      advertiser_country: args["advertiser_country"],
      limit: args["limit"],
      pages: args["pages"],
      cursor: args["cursor"]
    ]
  end

  defp schedule_window(opts) do
    case OptionNormalization.option(opts, :schedule_window, nil) do
      value when is_binary(value) ->
        case String.trim(value) do
          "" -> current_hour()
          trimmed -> trimmed
        end

      _other ->
        current_hour()
    end
  end

  defp current_hour do
    now = DateTime.utc_now()

    now
    |> Map.put(:minute, 0)
    |> Map.put(:second, 0)
    |> Map.put(:microsecond, {0, 6})
    |> DateTime.to_iso8601()
  end

  defp uppercase_option(opts, key, default) do
    case OptionNormalization.option(opts, key, default) do
      value when is_binary(value) ->
        case String.trim(value) do
          "" -> default
          trimmed -> String.upcase(trimmed)
        end

      _other ->
        default
    end
  end

  defp boolean_option(opts, key, default) do
    case OptionNormalization.option(opts, key, default) do
      value when is_boolean(value) -> value
      _other -> default
    end
  end

  defp string_list_option(opts, key, default, mapper) do
    values =
      case OptionNormalization.option(opts, key, default) do
        value when is_binary(value) -> String.split(value, ",", trim: true)
        value when is_list(value) -> value
        _other -> default
      end

    normalized =
      values
      |> Enum.filter(&is_binary/1)
      |> Enum.map(&String.trim/1)
      |> Enum.reject(&(&1 == ""))
      |> Enum.map(mapper)

    if normalized == [], do: default, else: normalized
  end
end
