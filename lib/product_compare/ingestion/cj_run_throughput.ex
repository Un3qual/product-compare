defmodule ProductCompare.Ingestion.CJRunThroughput do
  @moduledoc """
  Safe read-only daily throughput aggregate for CJ ingestion runs.

  The summary groups persisted CJ runs by UTC date and surface and returns
  counts only. It never returns raw queries, error payloads, credentials, or
  provider response data.
  """

  import Ecto.Query

  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.ImportRun

  @provider "cj"
  @default_days 14
  @min_days 1
  @max_days 90

  @type bucket :: %{
          date: Date.t(),
          surface: String.t(),
          run_count: non_neg_integer(),
          succeeded_run_count: non_neg_integer(),
          failed_run_count: non_neg_integer(),
          pages_fetched: non_neg_integer(),
          records_fetched: non_neg_integer(),
          records_normalized: non_neg_integer(),
          records_persisted: non_neg_integer(),
          records_failed: non_neg_integer()
        }

  @type summary :: %{provider: String.t(), days: pos_integer(), buckets: [bucket()]}

  @spec daily_summary(keyword() | map() | term()) :: summary()
  def daily_summary(opts \\ []) do
    daily_summary(opts, DateTime.utc_now())
  end

  @spec daily_summary(keyword() | map() | term(), DateTime.t()) :: summary()
  def daily_summary(opts, %DateTime{} = now) do
    days = days(opts)

    %{
      provider: @provider,
      days: days,
      buckets: buckets(days, now)
    }
  end

  defp days(opts) when is_list(opts) do
    if Keyword.keyword?(opts) do
      opts |> Map.new() |> days()
    else
      @default_days
    end
  end

  defp days(opts) when is_map(opts) do
    opts
    |> option(:days, @default_days)
    |> normalize_days()
    |> max(@min_days)
    |> min(@max_days)
  end

  defp days(_opts), do: @default_days

  defp option(opts, key, default),
    do: Map.get(opts, key, Map.get(opts, Atom.to_string(key), default))

  defp normalize_days(value) when is_integer(value), do: value
  defp normalize_days(_value), do: @default_days

  defp buckets(days, now) do
    start_date =
      now
      |> DateTime.to_date()
      |> Date.add(-(days - 1))

    start_at = DateTime.new!(start_date, ~T[00:00:00], "Etc/UTC")

    ImportRun
    |> where(
      [run],
      run.provider == @provider and run.started_at >= ^start_at and run.started_at <= ^now
    )
    |> group_by([run], [fragment("?::date", run.started_at), run.surface])
    |> order_by([run], desc: fragment("?::date", run.started_at), asc: run.surface)
    |> select([run], %{
      date: fragment("?::date", run.started_at),
      surface: run.surface,
      run_count: count(run.id),
      succeeded_run_count: filter(count(run.id), run.status == "succeeded"),
      failed_run_count: filter(count(run.id), run.status == "failed"),
      pages_fetched: sum(run.pages_fetched),
      records_fetched: sum(run.records_fetched),
      records_normalized: sum(run.records_normalized),
      records_persisted: sum(run.records_persisted),
      records_failed: sum(run.records_failed)
    })
    |> Repo.all()
  end
end
