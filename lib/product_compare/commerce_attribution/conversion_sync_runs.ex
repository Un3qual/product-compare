defmodule ProductCompare.CommerceAttribution.ConversionSyncRuns do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Repo
  alias ProductCompareSchemas.CommerceAttribution.ConversionSyncRun

  @start_fields [
    :entropy_id,
    :affiliate_network_id,
    :status,
    :trigger,
    :requested_by_user_id,
    :window_start,
    :window_end,
    :cursor,
    :pages_fetched,
    :records_fetched,
    :records_persisted,
    :records_failed,
    :started_at,
    :finished_at,
    :error_summary
  ]
  @start_field_map Map.new(@start_fields, &{Atom.to_string(&1), &1})
  @completion_fields [
    :status,
    :cursor,
    :pages_fetched,
    :records_fetched,
    :records_persisted,
    :records_failed,
    :finished_at,
    :error_summary
  ]
  @completion_field_map Map.new(@completion_fields, &{Atom.to_string(&1), &1})

  @spec start(map(), DateTime.t()) ::
          {:ok, ConversionSyncRun.t()} | {:error, Ecto.Changeset.t()}
  def start(attrs, now) do
    attrs =
      attrs
      |> normalize_attrs(@start_field_map)
      |> Map.put(:status, :running)
      |> Map.put(:finished_at, nil)
      |> Map.put(:started_at, now)

    %ConversionSyncRun{}
    |> ConversionSyncRun.changeset(attrs)
    |> Repo.insert(returning: true)
  end

  @spec complete(ConversionSyncRun.t(), map(), DateTime.t()) ::
          {:ok, ConversionSyncRun.t()} | {:error, :not_found | Ecto.Changeset.t()}
  def complete(%ConversionSyncRun{id: run_id}, attrs, now) do
    Repo.transaction(fn ->
      current_run =
        Repo.one(
          from run in ConversionSyncRun,
            where: run.id == ^run_id,
            lock: "FOR UPDATE"
        )

      case current_run do
        nil ->
          Repo.rollback(:not_found)

        %ConversionSyncRun{status: status} = terminal_run when status in [:succeeded, :failed] ->
          terminal_run

        %ConversionSyncRun{} = running_run ->
          attrs =
            attrs
            |> normalize_attrs(@completion_field_map)
            |> Map.put(:finished_at, now)

          case running_run
               |> ConversionSyncRun.completion_changeset(attrs)
               |> Repo.update() do
            {:ok, completed_run} -> completed_run
            {:error, changeset} -> Repo.rollback(changeset)
          end
      end
    end)
  end

  @spec query() :: Ecto.Query.t()
  def query do
    from run in ConversionSyncRun,
      order_by: [desc: run.started_at, desc: run.id]
  end

  defp normalize_attrs(attrs, field_map) do
    attrs
    |> Map.new()
    |> Enum.reduce(%{}, fn {key, value}, normalized ->
      normalized_key =
        cond do
          is_atom(key) and Map.has_key?(field_map, Atom.to_string(key)) -> key
          is_binary(key) -> Map.get(field_map, key)
          true -> nil
        end

      if normalized_key, do: Map.put(normalized, normalized_key, value), else: normalized
    end)
  end
end
