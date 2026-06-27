defmodule Mix.Tasks.ProductCompare.Ingestion.CjFeeds do
  @moduledoc """
  Manually discovers CJ shopping product feeds.
  """

  use Mix.Task

  alias ProductCompare.Ingestion.CJFeedDiscovery

  @shortdoc "Discovers manual CJ shopping product feeds"

  @impl Mix.Task
  def run(argv) do
    opts = parse_argv(argv)

    if Keyword.get(opts, :check_credentials, false) do
      with_quiet_logger(fn ->
        {:ok, report} = credential_preflight(opts)

        print_preflight_report(report)

        if Keyword.get(opts, :require_ready, false) and not report.ready do
          Mix.raise("missing CJ credentials: #{Enum.join(report.missing_required, ",")}")
        end

        :ok
      end)
    else
      Mix.Task.run("app.start")

      with_quiet_logger(fn ->
        opts
        |> runner().()
        |> case do
          {:ok, report} ->
            print_report(report)
            :ok

          {:error, {:row_failures, report} = reason} ->
            print_report(report)
            Mix.raise("CJ feed discovery failed: #{inspect(reason)}")

          {:error, reason} ->
            Mix.raise("CJ feed discovery failed: #{inspect(reason)}")
        end
      end)
    end
  end

  @spec run_discovery(keyword()) :: {:ok, map()} | {:error, term()}
  def run_discovery(opts) do
    with_quiet_logger(fn ->
      if Keyword.get(opts, :check_credentials, false) do
        credential_preflight(opts)
      else
        opts
        |> CJFeedDiscovery.run()
        |> tap(fn
          {:ok, report} -> print_report(report)
          {:error, {:row_failures, report}} -> print_report(report)
          {:error, _reason} -> :ok
        end)
      end
    end)
  end

  defp parse_argv(argv) do
    {opts, _args, _invalid} =
      OptionParser.parse(argv,
        switches: [
          advertiser_country: :string,
          check_credentials: :boolean,
          limit: :integer,
          offset: :integer,
          pages: :integer,
          require_ready: :boolean
        ]
      )

    opts
    |> Keyword.put_new(:advertiser_country, "US")
    |> Keyword.put_new(:check_credentials, false)
    |> Keyword.put_new(:limit, 25)
    |> Keyword.put_new(:pages, 1)
    |> Keyword.put_new(:require_ready, false)
    |> Keyword.put_new(:cursor, Keyword.get(opts, :offset))
  end

  defp credential_preflight(opts) do
    missing_required =
      [
        {"CJ_API_TOKEN", credential_value(opts, :api_token, "CJ_API_TOKEN")},
        {"CJ_ACCOUNT_ID", credential_value(opts, :company_id, "CJ_ACCOUNT_ID")}
      ]
      |> Enum.reject(fn {_name, value} -> present?(value) end)
      |> Enum.map(fn {name, _value} -> name end)

    {:ok,
     %{
       provider: "cj",
       surface: "shoppingProductFeeds",
       ready: missing_required == [],
       missing_required: missing_required
     }}
  end

  defp credential_value(opts, key, env_name) do
    case Keyword.fetch(opts, key) do
      {:ok, value} -> value
      :error -> System.get_env(env_name)
    end
  end

  defp present?(value) when is_binary(value), do: String.trim(value) != ""
  defp present?(nil), do: false
  defp present?(value), do: value |> to_string() |> present?()

  defp print_report(report) do
    IO.puts(
      "feeds_fetched=#{report.feeds_fetched} candidates_persisted=#{report.candidates_persisted} pages_fetched=#{report.pages_fetched} failed=#{report.failed}"
    )
  end

  defp print_preflight_report(report) do
    IO.puts(
      "provider=#{report.provider} surface=#{report.surface} ready=#{report.ready} missing_required=#{Enum.join(report.missing_required, ",")}"
    )
  end

  defp runner do
    Application.get_env(:product_compare, :cj_feed_discovery_runner, &CJFeedDiscovery.run/1)
  end

  defp with_quiet_logger(fun) do
    original_level = Logger.level()
    Logger.configure(level: :warning)

    try do
      fun.()
    after
      Logger.configure(level: original_level)
    end
  end
end
