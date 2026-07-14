defmodule ProductCompare.Ingestion.Reconciliation do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.ImportObservation
  alias ProductCompareSchemas.Ingestion.ImportRun
  alias ProductCompareSchemas.Pricing.MerchantProduct
  alias ProductCompareSchemas.Specs.ExternalProduct

  @spec scope_fingerprint(map()) :: String.t()
  def scope_fingerprint(attrs) do
    attrs = Map.new(attrs)

    %{
      provider: Map.get(attrs, :provider),
      query: Map.get(attrs, :query, %{}),
      source_id: Map.get(attrs, :source_id),
      surface: Map.get(attrs, :surface)
    }
    |> canonical_value()
    |> Jason.encode!()
    |> then(&:crypto.hash(:sha256, &1))
    |> Base.encode16(case: :lower)
  end

  @spec observe(ImportRun.t(), map()) :: :ok | {:error, term()}
  def observe(
        %ImportRun{id: import_run_id},
        %{
          external_product: %ExternalProduct{id: external_product_id},
          merchant_product: %MerchantProduct{id: merchant_product_id}
        }
      ) do
    %ImportObservation{}
    |> ImportObservation.changeset(%{
      import_run_id: import_run_id,
      external_product_id: external_product_id,
      merchant_product_id: merchant_product_id
    })
    |> Repo.insert(
      on_conflict: :nothing,
      conflict_target: [:import_run_id, :external_product_id]
    )
    |> case do
      {:ok, _observation} -> :ok
      {:error, reason} -> {:error, reason}
    end
  end

  def observe(%ImportRun{}, _persisted_listing), do: :ok

  @spec finalize(ImportRun.t()) :: {:ok, ImportRun.t()} | {:error, Ecto.Changeset.t()}
  def finalize(%ImportRun{reconciliation_status: status} = run) when status != "pending",
    do: {:ok, run}

  def finalize(%ImportRun{status: status} = run) when status != "succeeded" do
    update_outcome(run, "skipped_failed", 0, nil)
  end

  def finalize(%ImportRun{cursor_end: cursor_end} = run) when not is_nil(cursor_end) do
    update_outcome(run, "skipped_partial", 0, nil)
  end

  def finalize(%ImportRun{records_failed: failed} = run) when failed > 0 do
    update_outcome(run, "skipped_partial", 0, nil)
  end

  def finalize(%ImportRun{} = run) do
    lock_scope!(run)

    if superseded?(run) do
      update_outcome(run, "skipped_superseded", 0, nil)
    else
      now = DateTime.utc_now()

      run
      |> observed_offers_query()
      |> Repo.update_all(set: [is_active: true, updated_at: now])

      {deactivated, _rows} =
        run
        |> unseen_historical_offers_query()
        |> Repo.update_all(set: [is_active: false, updated_at: now])

      update_outcome(run, "succeeded", deactivated, now)
    end
  end

  defp lock_scope!(run) do
    lock_name =
      Enum.join(
        [run.source_id, run.provider, run.surface, run.scope_fingerprint],
        ":"
      )

    Repo.query!("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [lock_name])
  end

  defp superseded?(run) do
    ImportRun
    |> where(
      [candidate],
      candidate.id > ^run.id and candidate.source_id == ^run.source_id and
        candidate.provider == ^run.provider and candidate.surface == ^run.surface and
        candidate.scope_fingerprint == ^run.scope_fingerprint and
        candidate.reconciliation_status == "succeeded"
    )
    |> Repo.exists?()
  end

  defp unseen_historical_offers_query(run) do
    historical_offer_ids =
      from(observation in ImportObservation,
        join: previous_run in ImportRun,
        on: previous_run.id == observation.import_run_id,
        where:
          previous_run.id < ^run.id and previous_run.source_id == ^run.source_id and
            previous_run.provider == ^run.provider and previous_run.surface == ^run.surface and
            previous_run.scope_fingerprint == ^run.scope_fingerprint and
            not is_nil(previous_run.finished_at),
        select: observation.merchant_product_id
      )

    from(merchant_product in MerchantProduct,
      where: merchant_product.is_active == true,
      where: merchant_product.id in subquery(historical_offer_ids),
      where: merchant_product.id not in subquery(current_offer_ids_query(run))
    )
  end

  defp observed_offers_query(run) do
    from(merchant_product in MerchantProduct,
      where: merchant_product.is_active == false,
      where: merchant_product.id in subquery(current_offer_ids_query(run))
    )
  end

  defp current_offer_ids_query(run) do
    from(observation in ImportObservation,
      where: observation.import_run_id == ^run.id,
      select: observation.merchant_product_id
    )
  end

  defp update_outcome(run, status, deactivated, reconciled_at) do
    run
    |> ImportRun.changeset(%{
      offers_deactivated: deactivated,
      reconciled_at: reconciled_at,
      reconciliation_status: status
    })
    |> Repo.update()
  end

  defp canonical_value(value) when is_map(value) do
    value
    |> Enum.map(fn {key, nested} -> [canonical_key(key), canonical_value(nested)] end)
    |> Enum.sort_by(&List.first/1)
  end

  defp canonical_value(value) when is_list(value), do: Enum.map(value, &canonical_value/1)
  defp canonical_value(value) when is_atom(value), do: Atom.to_string(value)
  defp canonical_value(value), do: value

  defp canonical_key(key) when is_atom(key), do: Atom.to_string(key)
  defp canonical_key(key) when is_binary(key), do: key
  defp canonical_key(key), do: inspect(key)
end
