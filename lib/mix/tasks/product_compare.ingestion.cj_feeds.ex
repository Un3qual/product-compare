defmodule Mix.Tasks.ProductCompare.Ingestion.CjFeeds do
  @moduledoc """
  Manually discovers CJ shopping product feeds.
  """

  use Mix.Task

  alias ProductCompare.Ingestion.CJFeedDiscovery
  alias ProductCompare.Ingestion.CJFailureDiagnostics
  alias ProductCompare.MixTasks.CliOptions

  @shortdoc "Discovers manual CJ shopping product feeds"

  @impl Mix.Task
  def run(argv) do
    opts = parse_argv(argv)

    if Keyword.get(opts, :check_credentials, false) do
      {:ok, report} = credential_preflight(opts)

      print_preflight_report(report)

      if Keyword.get(opts, :require_ready, false) and not report.ready do
        Mix.raise("missing CJ credentials: #{Enum.join(report.missing_required, ",")}")
      end

      :ok
    else
      Mix.Task.run("app.start")

      opts
      |> runner().()
      |> case do
        {:ok, report} ->
          print_report(report)
          :ok

        {:error, {:row_failures, report} = reason} ->
          print_report(report)
          raise_discovery_failure(reason)

        {:error, reason} ->
          raise_discovery_failure(reason)
      end
    end
  end

  @spec run_discovery(keyword()) :: {:ok, map()} | {:error, term()}
  def run_discovery(opts) do
    if Keyword.get(opts, :check_credentials, false) do
      credential_preflight(opts)
    else
      opts
      |> runner().()
      |> tap(fn
        {:ok, report} -> print_report(report)
        {:error, {:row_failures, report}} -> print_report(report)
        {:error, _reason} -> :ok
      end)
    end
  end

  defp parse_argv(argv) do
    opts =
      CliOptions.parse!(argv,
        advertiser_country: :string,
        check_credentials: :boolean,
        limit: :integer,
        offset: :integer,
        pages: :integer,
        require_ready: :boolean
      )

    [
      advertiser_country:
        CliOptions.non_blank_string!(
          Keyword.get(opts, :advertiser_country),
          "US",
          "--advertiser-country"
        ),
      check_credentials: Keyword.get(opts, :check_credentials, false),
      limit: CliOptions.positive_integer!(Keyword.get(opts, :limit), 25, "--limit"),
      cursor: normalize_offset(Keyword.get(opts, :offset)),
      pages: CliOptions.positive_integer!(Keyword.get(opts, :pages), 1, "--pages"),
      require_ready: Keyword.get(opts, :require_ready, false)
    ]
  end

  defp normalize_offset(nil), do: nil

  defp normalize_offset(offset),
    do: CliOptions.non_negative_integer!(offset, 0, "--offset")

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

  @spec raise_discovery_failure(term()) :: no_return()
  defp raise_discovery_failure(reason) do
    Mix.raise("CJ feed discovery failed: category=#{CJFailureDiagnostics.category(reason)}")
  end

  defp runner do
    Application.get_env(:product_compare, :cj_feed_discovery_runner, &CJFeedDiscovery.run/1)
  end
end
