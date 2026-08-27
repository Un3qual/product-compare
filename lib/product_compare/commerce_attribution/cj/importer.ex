defmodule ProductCompare.CommerceAttribution.CJ.Importer do
  @moduledoc false

  alias ProductCompare.CommerceAttribution.CJ.Client
  alias ProductCompare.CommerceAttribution.ConversionSyncRuns
  alias ProductCompare.CommerceAttribution.Conversions
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Affiliate.AffiliateNetwork
  alias ProductCompareSchemas.CommerceAttribution.ConversionSyncRun

  @record_fields ~w(
    commissionId
    original
    originalActionId
    correctionReason
    actionStatus
    shopperId
    eventDate
    postingDate
    saleAmountUsd
    pubCommissionAmountUsd
  )

  @type import_request :: %{
          required(:from) => DateTime.t(),
          required(:before) => DateTime.t(),
          required(:publisher_ids) => [String.t()],
          required(:max_pages) => pos_integer(),
          required(:trigger) => :scheduled | :operator | :cli,
          required(:requested_by_user_id) => pos_integer() | nil
        }

  @spec run(import_request(), keyword()) ::
          {:ok, ConversionSyncRun.t()} | {:error, term()}
  def run(request, opts \\ []) do
    with {:ok, request} <- validate_request(request),
         {:ok, network} <- cj_network(),
         {:ok, run} <- start_run(request, network) do
      execute_run(run, request, Keyword.get(opts, :fetch_page, &Client.fetch_page/2))
    end
  end

  defp execute_run(run, request, fetch_page) do
    page_request = %{
      publisher_ids: request.publisher_ids,
      from: request.from,
      before: request.before,
      since_commission_id: nil
    }

    case fetch_pages(
           page_request,
           fetch_page,
           MapSet.new(),
           1,
           request.max_pages,
           [],
           empty_progress()
         ) do
      {:ok, records, progress} ->
        case persist_records(records) do
          {:ok, persisted} -> complete_success(run, progress, persisted)
          {:error, reason, persisted} -> complete_failure(run, progress, persisted, reason)
        end

      {:error, reason, progress} ->
        complete_failure(run, progress, 0, reason)
    end
  rescue
    _exception -> complete_failure(run, empty_progress(), 0, :runner_exception)
  catch
    _kind, _reason -> complete_failure(run, empty_progress(), 0, :runner_exception)
  end

  defp fetch_pages(_request, _fetch_page, _seen, page, max_pages, _records, progress)
       when page > max_pages,
       do: {:error, :page_ceiling_exhausted, progress}

  defp fetch_pages(request, fetch_page, seen, page, max_pages, records, progress) do
    with {:ok, result} <- call_fetch_page(fetch_page, request),
         {:ok, result} <- validate_page(result),
         {:ok, cursor} <- validate_continuation(result, request.since_commission_id, seen) do
      records = Enum.reverse(result.records, records)

      progress = %{
        pages: page,
        fetched: progress.fetched + length(result.records),
        cursor: cursor || request.since_commission_id
      }

      if result.payload_complete do
        {:ok, Enum.reverse(records), progress}
      else
        fetch_pages(
          %{request | since_commission_id: cursor},
          fetch_page,
          MapSet.put(seen, cursor),
          page + 1,
          max_pages,
          records,
          progress
        )
      end
    else
      {:error, reason} -> {:error, reason, progress}
    end
  end

  defp call_fetch_page(fetch_page, request) when is_function(fetch_page, 2) do
    case fetch_page.(request, []) do
      {:ok, result} -> {:ok, result}
      {:error, reason} -> {:error, reason}
      _result -> {:error, {:invalid_response, :page}}
    end
  rescue
    _exception -> {:error, :runner_exception}
  catch
    _kind, _reason -> {:error, :runner_exception}
  end

  defp call_fetch_page(_fetch_page, _request), do: {:error, {:invalid_request, :fetch_page}}

  defp validate_page(
         %{
           records: records,
           payload_complete: payload_complete
         } = result
       )
       when is_list(records) and is_boolean(payload_complete) do
    if Enum.all?(records, &valid_record?/1) do
      {:ok, result}
    else
      {:error, {:invalid_response, :record}}
    end
  end

  defp validate_page(_result), do: {:error, {:invalid_response, :page}}

  defp validate_continuation(result, current_cursor, seen) do
    with {:ok, cursor} <- response_cursor(result) do
      cond do
        result.payload_complete ->
          {:ok, cursor}

        is_nil(cursor) ->
          {:error, {:invalid_response, :max_commission_id}}

        cursor == current_cursor ->
          {:error, {:invalid_response, :non_advancing_cursor}}

        MapSet.member?(seen, cursor) ->
          {:error, {:invalid_response, :repeated_cursor}}

        true ->
          {:ok, cursor}
      end
    end
  end

  defp response_cursor(result) do
    case Map.fetch(result, :max_commission_id) do
      {:ok, nil} ->
        {:ok, nil}

      {:ok, value} when is_binary(value) ->
        case normalize_string(value) do
          nil -> {:error, {:invalid_response, :max_commission_id}}
          cursor -> {:ok, cursor}
        end

      _missing_or_invalid ->
        {:error, {:invalid_response, :max_commission_id}}
    end
  end

  defp persist_records(records) do
    with {:ok, groups} <- action_groups(records) do
      Enum.reduce_while(groups, {:ok, 0}, fn {_key, group}, {:ok, persisted} ->
        case persist_action_group(group) do
          {:ok, result} -> {:cont, {:ok, persisted + result.persisted}}
          {:error, reason} -> {:halt, {:error, reason, persisted}}
        end
      end)
    else
      {:error, reason} -> {:error, reason, 0}
    end
  end

  defp persist_action_group(group) do
    Conversions.persist_cj_action_group(group)
  rescue
    _exception -> {:error, :runner_exception}
  catch
    _kind, _reason -> {:error, :runner_exception}
  end

  defp action_groups(records) do
    Enum.reduce_while(records, {:ok, %{}}, fn record, {:ok, groups} ->
      case action_group_key(record) do
        {:ok, key} -> {:cont, {:ok, Map.update(groups, key, [record], &[record | &1])}}
        {:error, reason} -> {:halt, {:error, reason}}
      end
    end)
    |> case do
      {:ok, groups} ->
        {:ok,
         groups
         |> Enum.map(fn {key, records} -> {key, Enum.reverse(records)} end)
         |> Enum.sort_by(&elem(&1, 0))}

      {:error, reason} ->
        {:error, reason}
    end
  end

  defp action_group_key(%{"original" => true} = record) do
    case normalize_string(record["originalActionId"]) do
      nil -> {:ok, {1, record["commissionId"]}}
      action_ref -> {:ok, {0, action_ref}}
    end
  end

  defp action_group_key(%{"original" => false} = record) do
    case normalize_string(record["originalActionId"]) do
      nil -> {:error, correction_changeset(:network_action_ref, "can't be blank")}
      action_ref -> {:ok, {0, action_ref}}
    end
  end

  defp complete_success(run, progress, persisted) do
    ConversionSyncRuns.complete(
      run,
      %{
        status: :succeeded,
        cursor: progress.cursor,
        pages_fetched: progress.pages,
        records_fetched: progress.fetched,
        records_persisted: persisted,
        records_failed: 0,
        error_summary: nil
      },
      DateTime.utc_now()
    )
  end

  defp complete_failure(run, progress, persisted, reason) do
    _completion =
      ConversionSyncRuns.complete(
        run,
        %{
          status: :failed,
          cursor: progress.cursor,
          pages_fetched: progress.pages,
          records_fetched: progress.fetched,
          records_persisted: persisted,
          records_failed: max(progress.fetched - persisted, 0),
          error_summary: error_summary(reason)
        },
        DateTime.utc_now()
      )

    {:error, reason}
  end

  defp start_run(request, network) do
    ConversionSyncRuns.start(
      %{
        affiliate_network_id: network.id,
        trigger: request.trigger,
        requested_by_user_id: request.requested_by_user_id,
        window_start: request.from,
        window_end: request.before,
        cursor: nil,
        pages_fetched: 0,
        records_fetched: 0,
        records_persisted: 0,
        records_failed: 0,
        error_summary: nil
      },
      DateTime.utc_now()
    )
  end

  defp validate_request(request) when is_map(request) do
    with {:ok, from, before} <-
           validate_window(Map.get(request, :from), Map.get(request, :before)),
         {:ok, publisher_ids} <- validate_publisher_ids(Map.get(request, :publisher_ids)),
         {:ok, max_pages} <- validate_max_pages(Map.get(request, :max_pages)),
         {:ok, trigger} <- fetch_required(request, :trigger),
         {:ok, requested_by_user_id} <- fetch_required(request, :requested_by_user_id) do
      {:ok,
       %{
         from: from,
         before: before,
         publisher_ids: publisher_ids,
         max_pages: max_pages,
         trigger: trigger,
         requested_by_user_id: requested_by_user_id
       }}
    end
  end

  defp validate_request(_request), do: {:error, {:invalid_request, :request}}

  defp validate_window(%DateTime{} = from, %DateTime{} = before) do
    if utc?(from) and utc?(before) and DateTime.compare(from, before) == :lt do
      {:ok, from, before}
    else
      {:error, {:invalid_request, :window}}
    end
  end

  defp validate_window(_from, _before), do: {:error, {:invalid_request, :window}}

  defp validate_publisher_ids(publisher_ids) when is_list(publisher_ids) do
    publisher_ids = Enum.map(publisher_ids, &normalize_string/1)

    if publisher_ids != [] and Enum.all?(publisher_ids, &is_binary/1) do
      {:ok, publisher_ids}
    else
      {:error, {:invalid_request, :publisher_ids}}
    end
  end

  defp validate_publisher_ids(_publisher_ids),
    do: {:error, {:invalid_request, :publisher_ids}}

  defp validate_max_pages(max_pages) when is_integer(max_pages) and max_pages > 0,
    do: {:ok, max_pages}

  defp validate_max_pages(_max_pages), do: {:error, {:invalid_request, :max_pages}}

  defp fetch_required(request, field) do
    case Map.fetch(request, field) do
      {:ok, value} -> {:ok, value}
      :error -> {:error, {:invalid_request, field}}
    end
  end

  defp cj_network do
    case Repo.get_by(AffiliateNetwork, code: "cj") do
      %AffiliateNetwork{} = network -> {:ok, network}
      nil -> {:error, {:missing_affiliate_network, "cj"}}
    end
  end

  defp valid_record?(record) when is_map(record) do
    Enum.all?(@record_fields, &Map.has_key?(record, &1)) and
      nonblank_string?(record["commissionId"]) and
      is_boolean(record["original"]) and
      nullable_string?(record["originalActionId"]) and
      nullable_string?(record["correctionReason"]) and
      nonblank_string?(record["actionStatus"]) and
      nullable_string?(record["shopperId"]) and
      nonblank_string?(record["eventDate"]) and
      nonblank_string?(record["postingDate"]) and
      nonblank_string?(record["saleAmountUsd"]) and
      nonblank_string?(record["pubCommissionAmountUsd"])
  end

  defp valid_record?(_record), do: false

  defp error_summary({:invalid_response, _category}), do: "invalid_response"
  defp error_summary({:transport_error, _reason}), do: "transport_error"
  defp error_summary(%Ecto.Changeset{}), do: "persistence_validation_failed"
  defp error_summary(:page_ceiling_exhausted), do: "page_ceiling_exhausted"
  defp error_summary(:unmatched_correction), do: "unmatched_correction"
  defp error_summary(:runner_exception), do: "runner_exception"
  defp error_summary(_reason), do: "runner_error"

  defp correction_changeset(field, message) do
    %ProductCompareSchemas.CommerceAttribution.CommerceConversion{}
    |> Ecto.Changeset.change()
    |> Ecto.Changeset.add_error(field, message)
  end

  defp empty_progress, do: %{pages: 0, fetched: 0, cursor: nil}

  defp normalize_string(value) when is_binary(value) do
    case String.trim(value) do
      "" -> nil
      value -> value
    end
  end

  defp normalize_string(_value), do: nil
  defp nonblank_string?(value), do: not is_nil(normalize_string(value))
  defp nullable_string?(nil), do: true
  defp nullable_string?(value), do: is_binary(value)
  defp utc?(%DateTime{utc_offset: 0, std_offset: 0}), do: true
  defp utc?(_datetime), do: false
end
