defmodule ProductCompareWeb.Resolvers.CommerceAttribution.Reads do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.CommerceAttribution
  alias ProductCompare.CommerceAttribution.CJ.Client
  alias ProductCompare.CommerceAttribution.CJCommissionSyncJobs
  alias ProductCompare.CommerceAttribution.ConversionSyncRuns
  alias ProductCompare.CommerceAttribution.ConversionSyncSettings
  alias ProductCompare.Repo
  alias ProductCompareWeb.GraphQL.Authorization
  alias ProductCompareWeb.GraphQL.Connection
  alias ProductCompareWeb.GraphQL.Errors, as: GraphQLErrors
  alias ProductCompareWeb.GraphQL.GlobalId
  alias ProductCompareWeb.GraphQL.Input
  alias ProductCompareSchemas.Reference.CurrencyCode
  alias ProductCompareSchemas.CommerceAttribution.ConversionSyncRun
  alias ProductCompareSchemas.CommerceAttribution.ConversionSyncSetting

  @invalid_filters_error "invalid revenue summary filters"
  @invalid_click_filters_error "invalid commerce attribution click filters"

  @spec cj_commission_ingestion(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, GraphQLErrors.top_level_error()}
  def cj_commission_ingestion(_parent, _args, resolution) do
    case Authorization.require_operator(resolution) do
      {:ok, _operator} ->
        cj_commission_ingestion_read()

      {:error, reason} when reason in [:unauthenticated, :forbidden] ->
        {:error, GraphQLErrors.authorization_error(reason)}
    end
  end

  @spec cj_commission_sync_runs(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t() | GraphQLErrors.top_level_error()}
  def cj_commission_sync_runs(_parent, args, resolution) do
    case Authorization.require_operator(resolution) do
      {:ok, _operator} ->
        cj_commission_sync_runs_read(args)

      {:error, reason} when reason in [:unauthenticated, :forbidden] ->
        {:error, GraphQLErrors.authorization_error(reason)}
    end
  end

  defp cj_commission_ingestion_read do
    with {:ok, settings} <- cj_settings() do
      {:ok, project_cj_commission_ingestion(settings)}
    else
      {:error, _reason} ->
        {:error, "CJ commission ingestion is unavailable"}
    end
  rescue
    _exception -> {:error, "CJ commission ingestion is unavailable"}
  end

  defp cj_commission_sync_runs_read(args) do
    with {:ok, settings} <- cj_settings(),
         connection_args = Input.connection_args(args || %{}),
         query =
           ConversionSyncRuns.query()
           |> where([run], run.affiliate_network_id == ^settings.affiliate_network_id)
           |> preload([:requested_by_user]),
         {:ok, connection} <- Connection.from_query_result(query, connection_args, Repo) do
      {:ok, project_sync_run_connection(connection)}
    else
      {:error, reason} when is_binary(reason) ->
        {:error, reason}

      {:error, _reason} ->
        {:error, "CJ commission ingestion is unavailable"}
    end
  rescue
    _exception -> {:error, "CJ commission ingestion is unavailable"}
  end

  @spec commerce_attribution_clicks(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()}
          | {:error, String.t() | GraphQLErrors.top_level_error()}
  def commerce_attribution_clicks(_parent, args, resolution) do
    args = args || %{}
    input = Input.fetch_value(args, :input, %{}) || %{}
    connection_args = Input.connection_args(args)

    with {:ok, _user} <- Authorization.require_operator(resolution),
         {:ok, _window} <- Connection.batch_window_result(connection_args),
         {:ok, filters} <- normalize_revenue_summary_input(input),
         query = CommerceAttribution.click_ledger_query(filters),
         {:ok, connection} <- Connection.from_query_result(query, connection_args, Repo) do
      {:ok, project_click_connection(connection)}
    else
      {:error, reason} when reason in [:unauthenticated, :forbidden] ->
        {:error, GraphQLErrors.authorization_error(reason)}

      {:error, reason} when is_binary(reason) ->
        {:error, reason}

      {:error, _reason} ->
        {:error, @invalid_click_filters_error}
    end
  rescue
    ArgumentError -> {:error, @invalid_click_filters_error}
  end

  @spec revenue_summary(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()}
          | {:error, String.t() | GraphQLErrors.top_level_error()}
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

  defp cj_settings do
    case ConversionSyncSettings.get_cj() do
      %ConversionSyncSetting{} = settings -> {:ok, settings}
      _ -> {:error, :cj_settings_unavailable}
    end
  end

  defp normalize_revenue_currency(nil), do: {:ok, nil}

  defp normalize_revenue_currency(currency) when is_binary(currency) do
    case CurrencyCode.cast(currency) do
      {:ok, currency} -> {:ok, currency}
      :error -> {:error, :invalid_currency}
    end
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

  defp normalize_revenue_network(network) when is_binary(network) do
    {:ok, network}
  end

  defp normalize_revenue_network(_network), do: {:error, :invalid_network}

  defp graphql_summary(%{"filters" => filters, "metrics" => metrics}) do
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
       }
     }}
  end

  defp graphql_summary(_summary), do: {:error, :invalid_summary}

  defp project_click_connection(connection) do
    Map.update!(connection, :edges, fn edges ->
      Enum.map(edges, fn edge -> Map.update!(edge, :node, &project_click/1) end)
    end)
  end

  defp project_click(click) do
    link = click.commerce_link
    merchant_product = click.merchant_product
    program = link.affiliate_program
    network = program && program.affiliate_network
    user = click.user

    %{
      affiliate_network_code: network && network.code,
      affiliate_network_id: global_id(:affiliate_network, network),
      affiliate_network_name: network && network.name,
      affiliate_program_code: program && program.program_code,
      affiliate_program_id: global_id(:affiliate_program, program),
      anonymous_visitor: not is_nil(click.anonymous_visitor_id),
      click_id: click.click_id,
      inserted_at: click.inserted_at,
      ip_address: format_ip(click.ip_address),
      link_type: link.link_type,
      matched_conversions: Enum.map(click.conversions, &project_conversion/1),
      merchant_id: global_id(:merchant, link.merchant),
      merchant_name: link.merchant.name,
      merchant_product_external_sku: merchant_product && merchant_product.external_sku,
      merchant_product_id: global_id(:merchant_product, merchant_product),
      product_id: global_id(:product, merchant_product && merchant_product.product),
      product_name: merchant_product && merchant_product.product.name,
      referrer: click.referrer,
      source_surface: click.source_surface,
      user_agent: click.user_agent,
      user_email: user && user.email,
      user_id: global_id(:user, user)
    }
  end

  defp format_ip(nil), do: nil
  defp format_ip(%Postgrex.INET{} = address), do: to_string(address)

  defp project_conversion(conversion) do
    merchant_product = conversion.merchant_product
    merchant = conversion.merchant || (merchant_product && merchant_product.merchant)
    product = conversion.product || (merchant_product && merchant_product.product)
    network = conversion.affiliate_network

    %{
      affiliate_network_code: network && network.code,
      affiliate_network_id: global_id(:affiliate_network, network),
      affiliate_network_name: network && network.name,
      attribution_confidence: conversion.attribution_confidence,
      commission_amount: conversion.commission_amount,
      currency: conversion.currency,
      merchant_id: global_id(:merchant, merchant),
      merchant_name: merchant && merchant.name,
      network_conversion_ref: conversion.network_conversion_ref,
      order_amount: conversion.order_amount,
      product_id: global_id(:product, product),
      product_name: product && product.name,
      purchased_at: conversion.purchased_at,
      reported_at: conversion.reported_at,
      status: conversion.status
    }
  end

  defp global_id(_type, nil), do: nil
  defp global_id(type, %{id: id}), do: GlobalId.encode_optional_value(type, id)

  defp drop_nil_values(map), do: Map.reject(map, fn {_key, value} -> is_nil(value) end)

  defp project_cj_commission_ingestion(settings) do
    settings = Repo.preload(settings, :updated_by_user)

    %{
      settings: project_sync_settings(settings),
      credentials: Client.credential_status(),
      activity: project_sync_activity(CJCommissionSyncJobs.active()),
      latest_success: latest_sync_run(:succeeded, settings.affiliate_network_id),
      latest_failure: latest_sync_run(:failed, settings.affiliate_network_id)
    }
  end

  defp project_sync_settings(settings) do
    %{
      enabled: settings.enabled,
      interval_minutes: settings.interval_minutes,
      lookback_days: settings.lookback_days,
      max_pages: settings.max_pages,
      next_run_at: settings.next_run_at,
      updated_at: settings.updated_at,
      updated_by_email: settings.updated_by_user && settings.updated_by_user.email
    }
  end

  defp project_sync_activity(nil), do: nil

  defp project_sync_activity(activity) do
    %{
      state: activity_state(activity.state),
      window_start: activity.from,
      window_end: activity.before,
      scheduled_at: activity.scheduled_at,
      attempted_at: activity.attempted_at
    }
  end

  defp activity_state("suspended"), do: :suspended
  defp activity_state("available"), do: :available
  defp activity_state("scheduled"), do: :scheduled
  defp activity_state("executing"), do: :executing
  defp activity_state("retryable"), do: :retryable

  defp latest_sync_run(status, affiliate_network_id) do
    ConversionSyncRuns.query()
    |> where(
      [run],
      run.affiliate_network_id == ^affiliate_network_id and run.status == ^status
    )
    |> preload([:requested_by_user])
    |> limit(1)
    |> Repo.one()
    |> project_sync_run()
  end

  defp project_sync_run_connection(connection) do
    Map.update!(connection, :edges, fn edges ->
      Enum.map(edges, fn edge -> Map.update!(edge, :node, &project_sync_run/1) end)
    end)
  end

  defp project_sync_run(nil), do: nil

  defp project_sync_run(%ConversionSyncRun{} = run) do
    %{
      id: GlobalId.encode(:cj_commission_sync_run, run.entropy_id),
      status: run.status,
      trigger: run.trigger,
      requester_email: run.requested_by_user && run.requested_by_user.email,
      window_start: run.window_start,
      window_end: run.window_end,
      cursor: run.cursor,
      pages_fetched: run.pages_fetched,
      records_fetched: run.records_fetched,
      records_persisted: run.records_persisted,
      records_failed: run.records_failed,
      started_at: run.started_at,
      finished_at: run.finished_at,
      error_summary: run.error_summary
    }
  end
end
