defmodule ProductCompare.CommerceAttribution.Jobs.CJCommissionSyncWorker do
  @moduledoc """
  Runs one bounded CJ commission import as a durable, retryable job.
  """

  use Oban.Worker,
    queue: :ingestion,
    max_attempts: 5,
    unique: [
      period: :infinity,
      fields: [:worker, :queue, :args],
      states: :incomplete
    ]

  alias ProductCompare.CommerceAttribution.CJ.Importer
  alias ProductCompare.CommerceAttribution.CJ.ImportRequest

  @spec enqueue(keyword() | map()) :: {:ok, Oban.Job.t()} | {:error, Ecto.Changeset.t()}
  def enqueue(opts \\ []) do
    opts
    |> args()
    |> new()
    |> Oban.insert()
  end

  @spec args(keyword() | map()) :: map()
  def args(opts) do
    opts = Map.new(opts)
    before = canonical_datetime(Map.fetch!(opts, :before))

    %{
      "publisher_ids" => normalize_publisher_ids(Map.fetch!(opts, :publisher_ids)),
      "from" => canonical_datetime(Map.fetch!(opts, :from)),
      "before" => before,
      "max_pages" => normalize_max_pages(Map.get(opts, :max_pages)),
      "trigger" => normalize_trigger(Map.get(opts, :trigger)),
      "requested_by_user_id" => normalize_requester(Map.get(opts, :requested_by_user_id)),
      "schedule_window" => canonical_schedule_window(Map.get(opts, :schedule_window), before)
    }
  end

  @impl Oban.Worker
  def perform(%Oban.Job{id: job_id, attempt: attempt, args: args}) do
    with {:ok, request} <- request_from_args(args) do
      invoke_importer(request, oban_job_id: job_id, oban_attempt: attempt)
    else
      {:error, _reason} -> {:cancel, "invalid_job_arguments"}
    end
  end

  defp invoke_importer(request, opts) do
    importer().(request, opts)
    |> classify_result()
  rescue
    _exception -> {:error, "runner_exception"}
  catch
    _kind, _reason -> {:error, "runner_exception"}
  end

  defp classify_result({:ok, _report}), do: :ok
  defp classify_result(:ok), do: :ok

  defp classify_result({:error, {:missing_env, _name}}),
    do: {:cancel, "configuration_error"}

  defp classify_result({:error, :missing_credentials}), do: {:cancel, "configuration_error"}

  defp classify_result({:error, {:authentication_failed, _reason}}),
    do: {:cancel, "authentication_error"}

  defp classify_result({:error, {:authorization_failed, _reason}}),
    do: {:cancel, "authorization_error"}

  defp classify_result({:error, {:transport_error, _reason}}),
    do: {:error, "transient_provider_failure"}

  defp classify_result({:error, {:http_error, status}}) when status in [408, 429],
    do: {:error, "transient_provider_failure"}

  defp classify_result({:error, {:http_error, status}})
       when is_integer(status) and status in 500..599,
       do: {:error, "transient_provider_failure"}

  defp classify_result({:error, {:http_error, _status}}), do: {:cancel, "http_error"}

  defp classify_result({:error, {:invalid_response, _category}}),
    do: {:cancel, "invalid_response"}

  defp classify_result({:error, {:decode_error, _category}}), do: {:cancel, "decode_error"}
  defp classify_result({:error, {:graphql_error, _category}}), do: {:cancel, "graphql_error"}
  defp classify_result({:error, :page_ceiling_exhausted}), do: {:cancel, "page_ceiling_exhausted"}
  defp classify_result({:error, :unmatched_correction}), do: {:cancel, "unmatched_correction"}

  defp classify_result({:error, %Ecto.Changeset{}}),
    do: {:cancel, "persistence_validation_failed"}

  defp classify_result({:error, {:invalid_request, _field}}), do: {:cancel, "invalid_request"}
  defp classify_result({:error, :runner_exception}), do: {:error, "runner_exception"}
  defp classify_result({:error, _reason}), do: {:cancel, "provider_error"}
  defp classify_result(_unexpected), do: {:cancel, "unexpected_runner_result"}

  defp request_from_args(args) do
    with {:ok, from} <- parse_datetime(Map.get(args, "from")),
         {:ok, before} <- parse_datetime(Map.get(args, "before")),
         true <- DateTime.compare(from, before) == :lt,
         {:ok, trigger} <- parse_trigger(Map.get(args, "trigger")),
         publisher_ids when publisher_ids != [] <-
           normalize_publisher_ids(Map.get(args, "publisher_ids", [])),
         max_pages when max_pages in 1..100 <- Map.get(args, "max_pages"),
         requested_by_user_id <- normalize_requester(Map.get(args, "requested_by_user_id")) do
      {:ok,
       %ImportRequest{
         publisher_ids: publisher_ids,
         from: from,
         before: before,
         max_pages: max_pages,
         trigger: trigger,
         requested_by_user_id: requested_by_user_id
       }}
    else
      _invalid -> {:error, :invalid_job_arguments}
    end
  end

  defp importer do
    Application.get_env(:product_compare, :cj_commission_sync_importer, &Importer.run/2)
  end

  defp normalize_publisher_ids(values) do
    values
    |> List.wrap()
    |> Enum.filter(&is_binary/1)
    |> Enum.map(&String.trim/1)
    |> Enum.reject(&(&1 == ""))
    |> Enum.uniq()
  end

  defp normalize_max_pages(value) when value in 1..100, do: value
  defp normalize_max_pages(_value), do: 100

  defp normalize_trigger(value) when value in [:scheduled, "scheduled"], do: "scheduled"
  defp normalize_trigger(value) when value in [:operator, "operator"], do: "operator"
  defp normalize_trigger(value) when value in [:cli, "cli"], do: "cli"
  defp normalize_trigger(_value), do: "scheduled"

  defp parse_trigger("scheduled"), do: {:ok, :scheduled}
  defp parse_trigger("operator"), do: {:ok, :operator}
  defp parse_trigger("cli"), do: {:ok, :cli}
  defp parse_trigger(_value), do: {:error, :invalid_trigger}

  defp normalize_requester(value) when is_integer(value) and value > 0, do: value
  defp normalize_requester(_value), do: nil

  defp canonical_schedule_window(nil, before), do: before

  defp canonical_schedule_window(%DateTime{} = value, _before),
    do: canonical_datetime(value)

  defp canonical_schedule_window(value, before) when is_binary(value) do
    case parse_datetime(value) do
      {:ok, datetime} -> canonical_datetime(datetime)
      {:error, _reason} -> before
    end
  end

  defp canonical_schedule_window(_value, before), do: before

  defp canonical_datetime(%DateTime{} = datetime) do
    datetime
    |> DateTime.shift_zone!("Etc/UTC")
    |> DateTime.truncate(:second)
    |> DateTime.to_iso8601()
  end

  defp parse_datetime(value) when is_binary(value) do
    case DateTime.from_iso8601(value) do
      {:ok, datetime, 0} -> {:ok, DateTime.truncate(datetime, :second)}
      _invalid -> {:error, :invalid_datetime}
    end
  end

  defp parse_datetime(_value), do: {:error, :invalid_datetime}
end
