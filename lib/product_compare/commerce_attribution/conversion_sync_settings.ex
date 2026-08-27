defmodule ProductCompare.CommerceAttribution.ConversionSyncSettings do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Repo
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

  @spec ensure_cj(map() | keyword()) ::
          {:ok, ConversionSyncSetting.t()} | {:error, term()}
  def ensure_cj(defaults \\ %{}) do
    defaults = Map.new(defaults)

    case Repo.get_by(AffiliateNetwork, code: @cj_code) do
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
      |> Map.new()
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

  defp requested_enabled?(attrs, current_enabled) do
    Map.get(attrs, :enabled, Map.get(attrs, "enabled", current_enabled))
    |> normalize_enabled()
  end

  defp normalize_enabled(value) when is_boolean(value), do: value
  defp normalize_enabled("true"), do: true
  defp normalize_enabled("false"), do: false
  defp normalize_enabled(value), do: value

  defp require_transaction! do
    unless Repo.in_transaction?() do
      raise ArgumentError, "lock_cj/0 requires a database transaction"
    end
  end
end
