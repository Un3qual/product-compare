defmodule Mix.Tasks.ProductCompare.CommerceAttribution.CjCommissions do
  @moduledoc """
  Imports one bounded CJ publisher-commission window.
  """

  use Mix.Task

  alias Mix.Tasks.ProductCompare.CommerceAttribution.CjCommissions.Options
  alias ProductCompare.CommerceAttribution.CJ.Client
  alias ProductCompare.CommerceAttribution.CJ.Importer
  alias ProductCompare.CommerceAttribution.ConversionSyncSettings
  alias ProductCompareSchemas.CommerceAttribution.ConversionSyncRun

  @shortdoc "Imports bounded CJ publisher commissions"
  @provider "cj"
  @surface "publisherCommissions"

  @impl Mix.Task
  def run(argv) do
    opts = Options.parse_argv(argv)

    unless Keyword.get(opts, :check_credentials, false) do
      Mix.Task.run("app.start")
    end

    case run_import(opts) do
      {:ok, _result} ->
        :ok

      {:error, reason} ->
        Mix.raise("CJ commission import failed: #{failure_category(reason)}")
    end
  end

  @spec run_import(keyword()) :: {:ok, map()} | {:error, atom()}
  def run_import(opts) do
    if Keyword.get(opts, :check_credentials, false) do
      credential_check(opts)
    else
      import_window(opts)
    end
  end

  defp credential_check(opts) do
    report = Client.credential_status() |> Map.merge(%{provider: @provider, surface: @surface})

    if Keyword.get(opts, :print_report, true) do
      IO.puts(
        "provider=#{report.provider} surface=#{report.surface} ready=#{report.ready} " <>
          "api_token_configured=#{report.api_token_configured} " <>
          "publisher_ids_configured=#{report.publisher_ids_configured}"
      )
    end

    if Keyword.get(opts, :require_ready, false) and not report.ready do
      {:error, :credentials_missing}
    else
      {:ok, report}
    end
  end

  defp import_window(opts) do
    defaults = Application.get_env(:product_compare, :cj_commission_sync_defaults, %{})
    now = Keyword.get(opts, :now, DateTime.utc_now())

    with {:ok, settings} <- ConversionSyncSettings.ensure_cj(defaults),
         {:ok, publisher_ids} <- Client.publisher_ids(),
         {:ok, request} <- Options.import_request(opts, settings, publisher_ids, now) do
      result = invoke_importer(importer(opts), request)
      print_import_result(result, request, opts)
      result
    else
      {:error, reason} ->
        category = failure_category(reason)
        print_failure(category, opts)
        {:error, category}
    end
  end

  defp importer(opts),
    do:
      Keyword.get(
        opts,
        :importer,
        Application.get_env(:product_compare, :cj_commission_sync_importer, &Importer.run/2)
      )

  defp invoke_importer(importer, request) do
    importer.(request, [])
    |> normalize_importer_result()
  rescue
    _exception -> {:error, :provider_failure}
  catch
    _kind, _reason -> {:error, :provider_failure}
  end

  defp normalize_importer_result({:ok, %ConversionSyncRun{} = run}), do: {:ok, run}

  defp normalize_importer_result({:error, reason}),
    do: {:error, failure_category(reason)}

  defp normalize_importer_result(_unexpected), do: {:error, :unexpected_importer_result}

  defp print_import_result({:ok, run}, request, opts) do
    if Keyword.get(opts, :print_report, true) do
      IO.puts(
        "provider=#{@provider} surface=#{@surface} status=#{run.status} " <>
          "run_id=#{run.entropy_id} from=#{DateTime.to_iso8601(request.from)} " <>
          "before=#{DateTime.to_iso8601(request.before)} pages=#{run.pages_fetched} " <>
          "fetched=#{run.records_fetched} persisted=#{run.records_persisted} " <>
          "failed=#{run.records_failed}"
      )
    end
  end

  defp print_import_result({:error, reason}, _request, opts), do: print_failure(reason, opts)

  defp print_failure(reason, opts) do
    if Keyword.get(opts, :print_report, true) do
      IO.puts(
        "provider=#{@provider} surface=#{@surface} status=failed failure=#{failure_category(reason)}"
      )
    end
  end

  defp failure_category(category)
       when category in [
              :configuration_error,
              :authentication_error,
              :authorization_error,
              :invalid_request,
              :transient_provider_failure,
              :persistence_validation_failed,
              :unexpected_importer_result,
              :provider_failure
            ],
       do: category

  defp failure_category({:missing_env, _name}), do: :configuration_error
  defp failure_category(:credentials_missing), do: :configuration_error
  defp failure_category({:authentication_failed, _reason}), do: :authentication_error
  defp failure_category({:authorization_failed, _reason}), do: :authorization_error
  defp failure_category({:invalid_request, _field}), do: :invalid_request
  defp failure_category({:transport_error, _reason}), do: :transient_provider_failure
  defp failure_category(%Ecto.Changeset{}), do: :persistence_validation_failed
  defp failure_category(_reason), do: :provider_failure
end
