defmodule ProductCompare.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children =
      [
        ProductCompareWeb.Telemetry,
        ProductCompare.Repo,
        {Oban, Application.fetch_env!(:product_compare, Oban)},
        {ProductCompare.CommerceAttribution.CJCommissionSyncDispatcher,
         name: ProductCompare.CommerceAttribution.CJCommissionSyncDispatcher},
        {DNSCluster, query: Application.get_env(:product_compare, :dns_cluster_query) || :ignore},
        {Phoenix.PubSub, name: ProductCompare.PubSub},
        # Start a worker by calling: ProductCompare.Worker.start_link(arg)
        # {ProductCompare.Worker, arg},
        # Start to serve requests, typically the last entry
        ProductCompareWeb.Endpoint
      ]
      |> maybe_append_cj_feed_discovery_scheduler()
      |> maybe_append_cj_product_import_scheduler()

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: ProductCompare.Supervisor]
    Supervisor.start_link(children, opts)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  @impl true
  def config_change(changed, _new, removed) do
    ProductCompareWeb.Endpoint.config_change(changed, removed)
    :ok
  end

  defp maybe_append_cj_feed_discovery_scheduler(children) do
    config = Application.get_env(:product_compare, :cj_feed_discovery_scheduler, [])

    if Keyword.get(config, :enabled, false) do
      interval_ms = Keyword.get(config, :interval_minutes, 1440) * 60_000

      scheduler_opts = [
        advertiser_country: Keyword.get(config, :advertiser_country, "US"),
        initial_delay_ms: Keyword.get(config, :initial_delay_ms, 60_000),
        interval_ms: interval_ms,
        limit: Keyword.get(config, :limit, 25),
        name: ProductCompare.Ingestion.CJFeedDiscoveryScheduler,
        pages: Keyword.get(config, :pages, 1)
      ]

      children ++ [{ProductCompare.Ingestion.CJFeedDiscoveryScheduler, scheduler_opts}]
    else
      children
    end
  end

  defp maybe_append_cj_product_import_scheduler(children) do
    config = Application.get_env(:product_compare, :cj_product_import_scheduler, [])

    if Keyword.get(config, :enabled, false) do
      interval_ms = Keyword.get(config, :interval_minutes, 1440) * 60_000

      scheduler_opts = [
        complete_scope: Keyword.get(config, :complete_scope, false),
        currency: Keyword.get(config, :currency, "USD"),
        initial_delay_ms: Keyword.get(config, :initial_delay_ms, 60_000),
        interval_ms: interval_ms,
        keywords: comma_separated_strings(Keyword.get(config, :keywords, "shoe")),
        limit: Keyword.get(config, :limit, 25),
        name: ProductCompare.Ingestion.CJProductImportScheduler,
        pages: Keyword.get(config, :pages, 1),
        serviceable_areas: comma_separated_strings(Keyword.get(config, :serviceable_areas, "US"))
      ]

      children ++ [{ProductCompare.Ingestion.CJProductImportScheduler, scheduler_opts}]
    else
      children
    end
  end

  defp comma_separated_strings(value) when is_binary(value) do
    value
    |> String.split(",", trim: true)
    |> normalize_string_list()
  end

  defp comma_separated_strings(value) when is_list(value), do: normalize_string_list(value)
  defp comma_separated_strings(_value), do: []

  defp normalize_string_list(values) do
    values
    |> Enum.filter(&is_binary/1)
    |> Enum.map(&String.trim/1)
    |> Enum.reject(&(&1 == ""))
  end
end
