defmodule ProductCompare.Ingestion.CJFeedDiscovery do
  @moduledoc """
  Runs bounded CJ shopping product feed discovery.
  """

  alias ProductCompare.Ingestion
  alias ProductCompare.Ingestion.Sources.CJ.Client
  alias ProductCompare.Ingestion.Sources.CJ.SourceResolver

  @fetch_failure_summary "fetch_failed"

  @spec run(keyword()) :: {:ok, map()} | {:error, term()}
  def run(opts) do
    do_run(opts)
  end

  defp do_run(opts) do
    fetcher = Keyword.get(opts, :fetcher, &Client.fetch_feeds/2)
    cursor = Keyword.get(opts, :cursor)
    fetch_opts = fetch_opts(opts)
    pages = page_count(opts)

    with {:ok, source} <- fetch_source(),
         {:ok, import_run} <- start_import_run(source, cursor, fetch_opts, pages) do
      case fetch_pages(source, fetcher, cursor, fetch_opts, pages) do
        {:ok, report, next_cursor} ->
          with {:ok, _completed_run} <- complete_import_run(import_run, report, next_cursor) do
            report_result(report)
          end

        {:error, reason, report, next_cursor} ->
          case fail_import_run(import_run, report, next_cursor) do
            {:ok, _completed_run} -> {:error, reason}
            {:error, finalization_reason} -> {:error, finalization_reason}
          end
      end
    end
  end

  defp fetch_opts(opts) do
    [
      advertiser_country: Keyword.get(opts, :advertiser_country, "US"),
      limit: Keyword.get(opts, :limit, 25)
    ]
  end

  defp page_count(opts) do
    case Keyword.get(opts, :pages, 1) do
      value when is_integer(value) and value > 0 -> value
      _invalid -> 1
    end
  end

  defp start_import_run(source, cursor, fetch_opts, pages) do
    Ingestion.start_import_run(%{
      source_id: source.id,
      provider: "cj",
      surface: "shoppingProductFeeds",
      query: %{"advertiserCountry" => Keyword.fetch!(fetch_opts, :advertiser_country)},
      cursor_start: cursor || 0,
      page_size: Keyword.fetch!(fetch_opts, :limit),
      pages_requested: pages
    })
  end

  defp complete_import_run(import_run, report, next_cursor) do
    status = if report.failed == 0, do: "succeeded", else: "failed"

    Ingestion.complete_import_run(import_run, %{
      status: status,
      cursor_end: next_cursor,
      pages_fetched: report.pages_fetched,
      records_fetched: report.feeds_fetched,
      records_normalized: 0,
      records_persisted: report.candidates_persisted,
      records_failed: report.failed
    })
  end

  defp fail_import_run(import_run, report, next_cursor) do
    Ingestion.complete_import_run(import_run, %{
      error_summary: @fetch_failure_summary,
      status: "failed",
      cursor_end: next_cursor,
      pages_fetched: report.pages_fetched,
      records_fetched: report.feeds_fetched,
      records_normalized: 0,
      records_persisted: report.candidates_persisted,
      records_failed: report.failed
    })
  end

  defp fetch_pages(source, fetcher, cursor, fetch_opts, pages) do
    Enum.reduce_while(1..pages, {:ok, initial_report(), cursor}, fn _page,
                                                                    {:ok, report, current_cursor} ->
      case fetcher.(current_cursor, fetch_opts) do
        {:ok, feeds, next_cursor} ->
          candidate_report = persist_candidates(source, feeds)

          report =
            report
            |> Map.update!(:feeds_fetched, &(&1 + length(feeds)))
            |> Map.update!(:candidates_persisted, &(&1 + candidate_report.persisted))
            |> Map.update!(:failed, &(&1 + candidate_report.failed))
            |> Map.update!(:pages_fetched, &(&1 + 1))

          if is_nil(next_cursor) do
            {:halt, {:ok, report, next_cursor}}
          else
            {:cont, {:ok, report, next_cursor}}
          end

        {:error, reason} ->
          {:halt, {:error, reason, report, current_cursor}}
      end
    end)
  end

  defp initial_report do
    %{
      candidates_persisted: 0,
      failed: 0,
      feeds_fetched: 0,
      pages_fetched: 0
    }
  end

  defp persist_candidates(source, feeds) do
    seen_at = DateTime.utc_now()

    Enum.reduce(feeds, %{failed: 0, persisted: 0}, fn feed, report ->
      case Ingestion.upsert_merchant_feed_candidate(source, candidate_attrs(feed, seen_at)) do
        {:ok, _candidate} -> Map.update!(report, :persisted, &(&1 + 1))
        {:error, _changeset} -> Map.update!(report, :failed, &(&1 + 1))
      end
    end)
  end

  defp candidate_attrs(feed, seen_at) do
    %{
      advertiser_country: string_field(feed, "advertiserCountry"),
      advertiser_id: string_field(feed, "advertiserId"),
      advertiser_name: string_field(feed, "advertiserName"),
      currency: string_field(feed, "currency"),
      feed_name: string_field(feed, "feedName"),
      language: string_field(feed, "language"),
      last_seen_at: seen_at,
      product_count: integer_field(feed, "productCount"),
      provider: "cj",
      provider_feed_id: string_field(feed, "adId"),
      provider_last_updated_at: datetime_field(feed, "lastUpdated"),
      raw_metadata:
        Map.take(feed, [
          "adId",
          "advertiserCountry",
          "advertiserId",
          "advertiserName",
          "currency",
          "feedName",
          "language",
          "lastUpdated",
          "productCount",
          "sourceFeedType"
        ]),
      source_feed_type: string_field(feed, "sourceFeedType")
    }
  end

  defp string_field(feed, field) do
    case Map.get(feed, field) do
      value when is_binary(value) ->
        value
        |> String.trim()
        |> case do
          "" -> nil
          value -> value
        end

      value when is_integer(value) ->
        Integer.to_string(value)

      _other ->
        nil
    end
  end

  defp integer_field(feed, field) do
    case Map.get(feed, field) do
      value when is_integer(value) -> value
      value when is_binary(value) -> parse_integer(value)
      _other -> nil
    end
  end

  defp parse_integer(value) do
    case Integer.parse(value) do
      {integer, ""} -> integer
      _invalid -> nil
    end
  end

  defp datetime_field(feed, field) do
    with value when is_binary(value) <- Map.get(feed, field),
         {:ok, datetime, _offset} <- DateTime.from_iso8601(value) do
      datetime
    else
      _invalid -> nil
    end
  end

  defp fetch_source do
    SourceResolver.fetch_source()
  end

  defp report_result(%{failed: 0} = report), do: {:ok, report}
  defp report_result(report), do: {:error, {:row_failures, report}}
end
