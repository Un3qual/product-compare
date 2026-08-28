defmodule ProductCompare.CommerceAttribution.ConversionSyncSettings do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Repo
  alias ProductCompare.CommerceAttribution.CJ.Client
  alias ProductCompare.CommerceAttribution.Jobs.CJCommissionSyncWorker
  alias ProductCompareSchemas.Affiliate.AffiliateNetwork
  alias ProductCompareSchemas.CommerceAttribution.ConversionSyncSetting

  @cj_code AffiliateNetwork.normalize_code("cj")
  @defaults %{
    enabled: false,
    interval_minutes: 1_440,
    lookback_days: 90,
    max_pages: 100,
    next_run_at: nil,
    updated_by_user_id: nil
  }
  @setting_fields Map.keys(@defaults)
  @setting_field_map Map.new(@setting_fields, &{Atom.to_string(&1), &1})

  @spec ensure_cj(map() | keyword()) ::
          {:ok, ConversionSyncSetting.t()} | {:error, term()}
  def ensure_cj(defaults \\ %{}) do
    defaults = normalize_attrs(defaults)

    case Repo.transaction(fn -> ensure_cj_transaction(defaults) end) do
      {:ok, result} -> result
      {:error, reason} -> {:error, reason}
    end
  end

  defp ensure_cj_transaction(defaults) do
    case Repo.one(
           from network in AffiliateNetwork,
             where: network.code == ^@cj_code,
             lock: "FOR UPDATE"
         ) do
      %AffiliateNetwork{id: affiliate_network_id} ->
        insert_or_fetch(
          Map.merge(@defaults, defaults)
          |> Map.put(:affiliate_network_id, affiliate_network_id)
        )

      nil ->
        {:error, :cj_network_not_found}
    end
  end

  @spec lock_cj() :: ConversionSyncSetting.t() | nil
  def lock_cj do
    require_transaction!()

    Repo.one(
      from setting in ConversionSyncSetting,
        join: network in AffiliateNetwork,
        on: network.id == setting.affiliate_network_id,
        where: network.code == ^@cj_code,
        lock: "FOR UPDATE"
    )
  end

  @spec update_locked(ConversionSyncSetting.t(), pos_integer(), map(), DateTime.t()) ::
          {:ok, ConversionSyncSetting.t()} | {:error, Ecto.Changeset.t()}
  def update_locked(%ConversionSyncSetting{} = settings, operator_id, attrs, now) do
    require_transaction!()

    attrs =
      attrs
      |> normalize_attrs()
      |> Map.drop([:next_run_at, "next_run_at"])
      |> Map.put(:updated_by_user_id, operator_id)

    proposed_attrs =
      if requested_enabled?(attrs, settings.enabled) == false do
        Map.put(attrs, :next_run_at, nil)
      else
        attrs
      end

    proposed = ConversionSyncSetting.changeset(settings, proposed_attrs)

    if proposed.valid? do
      enabled = Ecto.Changeset.get_field(proposed, :enabled)
      interval_minutes = Ecto.Changeset.get_field(proposed, :interval_minutes)

      cadence_changed? =
        Ecto.Changeset.changed?(proposed, :enabled) or
          Ecto.Changeset.changed?(proposed, :interval_minutes)

      next_run_at =
        cond do
          not enabled -> nil
          cadence_changed? -> DateTime.add(now, interval_minutes * 60, :second)
          true -> settings.next_run_at
        end

      settings
      |> ConversionSyncSetting.changeset(Map.put(proposed_attrs, :next_run_at, next_run_at))
      |> Repo.update()
    else
      {:error, proposed}
    end
  end

  @spec claim_due_cj(DateTime.t(), (keyword() -> {:ok, Oban.Job.t()} | {:error, term()})) ::
          {:ok, :idle | %{job: Oban.Job.t(), settings: ConversionSyncSetting.t()}}
          | {:error, term()}
  def claim_due_cj(%DateTime{} = now, enqueuer \\ &CJCommissionSyncWorker.enqueue/1)
      when is_function(enqueuer, 1) do
    Repo.transaction(fn ->
      case due_cj_setting(now) do
        nil ->
          :idle

        %ConversionSyncSetting{} = settings ->
          enqueue_and_advance(settings, now, enqueuer)
      end
    end)
  end

  defp insert_or_fetch(attrs) do
    changeset = ConversionSyncSetting.changeset(%ConversionSyncSetting{}, attrs)

    case Repo.insert(
           changeset,
           on_conflict: :nothing,
           conflict_target: [:affiliate_network_id],
           returning: true
         ) do
      {:ok, %ConversionSyncSetting{id: nil}} ->
        {:ok,
         Repo.get_by!(ConversionSyncSetting, affiliate_network_id: attrs.affiliate_network_id)}

      result ->
        result
    end
  end

  defp due_cj_setting(now) do
    Repo.one(
      from setting in ConversionSyncSetting,
        join: network in AffiliateNetwork,
        on: network.id == setting.affiliate_network_id,
        where:
          network.code == ^@cj_code and setting.enabled == true and
            not is_nil(setting.next_run_at) and setting.next_run_at <= ^now,
        lock: "FOR UPDATE SKIP LOCKED"
    )
  end

  defp enqueue_and_advance(settings, now, enqueuer) do
    with {:ok, publisher_ids} <- Client.publisher_ids(),
         {:ok, %Oban.Job{} = job} <-
           enqueuer.(
             publisher_ids: publisher_ids,
             from: DateTime.add(now, -settings.lookback_days * 86_400, :second),
             before: now,
             max_pages: settings.max_pages,
             trigger: :scheduled,
             requested_by_user_id: nil,
             schedule_window: now
           ),
         {:ok, settings} <-
           settings
           |> ConversionSyncSetting.changeset(%{
             next_run_at: DateTime.add(now, settings.interval_minutes * 60, :second)
           })
           |> Repo.update() do
      %{job: job, settings: settings}
    else
      {:error, reason} -> Repo.rollback(reason)
      _unexpected -> Repo.rollback(:invalid_enqueuer_result)
    end
  end

  defp requested_enabled?(attrs, current_enabled) do
    Map.get(attrs, :enabled, Map.get(attrs, "enabled", current_enabled))
    |> normalize_enabled()
  end

  defp normalize_enabled(value) when is_boolean(value), do: value
  defp normalize_enabled("true"), do: true
  defp normalize_enabled("false"), do: false
  defp normalize_enabled(value), do: value

  defp normalize_attrs(attrs) do
    attrs
    |> Map.new()
    |> Enum.reduce(%{}, fn {key, value}, normalized ->
      case normalize_key(key) do
        nil -> normalized
        normalized_key -> Map.put(normalized, normalized_key, value)
      end
    end)
  end

  defp normalize_key(key) when is_atom(key) do
    if key in @setting_fields, do: key
  end

  defp normalize_key(key) when is_binary(key), do: Map.get(@setting_field_map, key)
  defp normalize_key(_key), do: nil

  defp require_transaction! do
    unless Repo.in_transaction?() do
      raise ArgumentError, "lock_cj/0 requires a database transaction"
    end
  end
end
