defmodule Mix.Tasks.ProductCompare.CommerceAttribution.CjCommissions.Options do
  @moduledoc false

  alias ProductCompareSchemas.CommerceAttribution.ConversionSyncSetting

  @spec parse_argv([String.t()]) :: keyword()
  def parse_argv(argv) do
    {opts, args, invalid} =
      OptionParser.parse(argv,
        strict: [
          from: :string,
          before: :string,
          lookback_days: :integer,
          max_pages: :integer,
          check_credentials: :boolean,
          require_ready: :boolean
        ]
      )

    validate_argv!(args, invalid)

    from = parse_optional_datetime!(opts, :from)
    before = parse_optional_datetime!(opts, :before)
    lookback_days = validate_optional_range!(opts, :lookback_days, 1..90)
    max_pages = validate_optional_range!(opts, :max_pages, 1..100)
    validate_window_options!(from, before, lookback_days)

    []
    |> maybe_put(:from, from)
    |> maybe_put(:before, before)
    |> maybe_put(:lookback_days, lookback_days)
    |> maybe_put(:max_pages, max_pages)
    |> Kernel.++(check_credentials: Keyword.get(opts, :check_credentials, false))
    |> Kernel.++(require_ready: Keyword.get(opts, :require_ready, false))
  end

  @spec import_request(keyword(), ConversionSyncSetting.t(), [String.t()], DateTime.t()) ::
          {:ok, map()} | {:error, term()}
  def import_request(opts, %ConversionSyncSetting{} = settings, publisher_ids, %DateTime{} = now) do
    with true <- utc?(now),
         {:ok, from, before} <- resolve_window(opts, settings.lookback_days, now),
         max_pages when max_pages in 1..100 <- Keyword.get(opts, :max_pages, settings.max_pages) do
      {:ok,
       %{
         publisher_ids: publisher_ids,
         from: from,
         before: before,
         max_pages: max_pages,
         trigger: :cli,
         requested_by_user_id: nil
       }}
    else
      _invalid -> {:error, {:invalid_request, :options}}
    end
  end

  defp resolve_window(opts, lookback_days, now) do
    case {Keyword.get(opts, :from), Keyword.get(opts, :before)} do
      {%DateTime{} = from, %DateTime{} = before} ->
        if utc?(from) and utc?(before) and DateTime.compare(from, before) == :lt do
          {:ok, from, before}
        else
          {:error, :invalid_window}
        end

      {nil, nil} ->
        days = Keyword.get(opts, :lookback_days, lookback_days)

        if days in 1..90 do
          {:ok, DateTime.add(now, -days * 86_400, :second), now}
        else
          {:error, :invalid_lookback}
        end

      _incomplete ->
        {:error, :incomplete_window}
    end
  end

  defp validate_argv!([argument | _rest], _invalid),
    do: Mix.raise("unexpected argument: #{argument}")

  defp validate_argv!([], [{option, _value} | _rest]),
    do: Mix.raise("unsupported option: #{option}")

  defp validate_argv!([], []), do: :ok

  defp parse_optional_datetime!(opts, key) do
    case Keyword.fetch(opts, key) do
      :error ->
        nil

      {:ok, value} ->
        case DateTime.from_iso8601(value) do
          {:ok, datetime, 0} ->
            DateTime.truncate(datetime, :second)

          _invalid ->
            Mix.raise("invalid --#{option_name(key)}: expected a UTC ISO 8601 timestamp")
        end
    end
  end

  defp validate_optional_range!(opts, key, range) do
    case Keyword.fetch(opts, key) do
      :error ->
        nil

      {:ok, value} when is_integer(value) ->
        if value in range do
          value
        else
          Mix.raise("invalid --#{option_name(key)}: expected #{range.first}..#{range.last}")
        end
    end
  end

  defp validate_window_options!(nil, nil, _lookback_days), do: :ok

  defp validate_window_options!(%DateTime{}, %DateTime{}, lookback_days)
       when not is_nil(lookback_days),
       do: Mix.raise("explicit --from/--before cannot be combined with --lookback-days")

  defp validate_window_options!(%DateTime{} = from, %DateTime{} = before, nil) do
    if DateTime.compare(from, before) == :lt do
      :ok
    else
      Mix.raise("invalid commission window: --from must be before --before")
    end
  end

  defp validate_window_options!(_from, _before, _lookback_days),
    do: Mix.raise("--from and --before must be provided together")

  defp maybe_put(opts, _key, nil), do: opts
  defp maybe_put(opts, key, value), do: opts ++ [{key, value}]

  defp option_name(key), do: key |> Atom.to_string() |> String.replace("_", "-")
  defp utc?(%DateTime{utc_offset: 0, std_offset: 0}), do: true
  defp utc?(_datetime), do: false
end
