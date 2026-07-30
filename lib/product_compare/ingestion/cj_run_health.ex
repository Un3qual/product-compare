defmodule ProductCompare.Ingestion.CJRunHealth do
  @moduledoc """
  Safe read-only latest-run health for CJ ingestion surfaces.

  The summary returns selected operational fields from the latest persisted CJ
  runs only. It deliberately excludes stored query maps and raw error summaries.
  """

  import Ecto.Query

  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.ImportRun

  @provider "cj"
  @surfaces ["shoppingProducts", "shoppingProductFeeds"]
  @surface_keys %{
    "shoppingProducts" => :shoppingProducts,
    "shoppingProductFeeds" => :shoppingProductFeeds
  }

  @type run_health :: %{
          surface: String.t(),
          missing: boolean(),
          status: atom() | nil,
          successful: boolean() | nil,
          started_at: DateTime.t() | nil,
          finished_at: DateTime.t() | nil,
          cursor_start: integer() | nil,
          cursor_end: integer() | nil,
          page_size: pos_integer() | nil,
          pages_requested: pos_integer() | nil,
          pages_fetched: non_neg_integer() | nil,
          records_fetched: non_neg_integer() | nil,
          records_normalized: non_neg_integer() | nil,
          records_persisted: non_neg_integer() | nil,
          records_failed: non_neg_integer() | nil,
          has_error_summary: boolean() | nil,
          reconciliation_status: atom() | nil,
          reconciled_at: DateTime.t() | nil,
          offers_deactivated: non_neg_integer() | nil
        }

  @type summary :: %{
          provider: String.t(),
          surfaces: %{shoppingProducts: run_health(), shoppingProductFeeds: run_health()}
        }

  @spec summary() :: summary()
  def summary do
    latest_by_surface = latest_health_by_surface()

    %{
      provider: @provider,
      surfaces:
        Map.new(@surfaces, fn surface ->
          {Map.fetch!(@surface_keys, surface),
           Map.get(latest_by_surface, surface, missing_health(surface))}
        end)
    }
  end

  defp latest_health_by_surface do
    ImportRun
    |> where([run], run.provider == @provider and run.surface in ^@surfaces)
    |> distinct([run], run.surface)
    |> order_by([run], asc: run.surface, desc: run.started_at, desc: run.id)
    |> select([run], %{
      surface: run.surface,
      missing: false,
      status: run.status,
      successful: run.status == :succeeded,
      started_at: run.started_at,
      finished_at: run.finished_at,
      cursor_start: run.cursor_start,
      cursor_end: run.cursor_end,
      page_size: run.page_size,
      pages_requested: run.pages_requested,
      pages_fetched: run.pages_fetched,
      records_fetched: run.records_fetched,
      records_normalized: run.records_normalized,
      records_persisted: run.records_persisted,
      records_failed: run.records_failed,
      reconciliation_status: run.reconciliation_status,
      reconciled_at: run.reconciled_at,
      offers_deactivated: run.offers_deactivated,
      has_error_summary:
        fragment("? IS NOT NULL AND BTRIM(?) <> ''", run.error_summary, run.error_summary)
    })
    |> Repo.all()
    |> Map.new(&{&1.surface, &1})
  end

  defp missing_health(surface) do
    %{
      surface: surface,
      missing: true,
      status: nil,
      successful: nil,
      started_at: nil,
      finished_at: nil,
      cursor_start: nil,
      cursor_end: nil,
      page_size: nil,
      pages_requested: nil,
      pages_fetched: nil,
      records_fetched: nil,
      records_normalized: nil,
      records_persisted: nil,
      records_failed: nil,
      reconciliation_status: nil,
      reconciled_at: nil,
      offers_deactivated: nil,
      has_error_summary: nil
    }
  end
end
