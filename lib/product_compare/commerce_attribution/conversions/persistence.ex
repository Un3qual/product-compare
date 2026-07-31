defmodule ProductCompare.CommerceAttribution.Conversions.Persistence do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.CommerceAttribution.Conversions.Attribution
  alias ProductCompare.Input
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Affiliate.AffiliateNetwork
  alias ProductCompareSchemas.CommerceAttribution.CommerceConversion

  @commerce_conversion_upsert_fields [
    :click_session_id,
    :public_click_id,
    :network_click_ref,
    :merchant_id,
    :affiliate_program_id,
    :product_id,
    :merchant_product_id,
    :status,
    :currency,
    :order_amount,
    :commission_amount,
    :commission_rate,
    :attribution_confidence,
    :data_freshness_at,
    :purchased_at,
    :reported_at,
    :raw_payload
  ]

  @spec ingest(map()) :: {:ok, CommerceConversion.t()} | {:error, Ecto.Changeset.t()}
  def ingest(attrs) do
    Repo.transaction(fn ->
      with {:ok, attrs} <- put_affiliate_network_id(attrs),
           attrs <- Attribution.restore_persisted(attrs),
           {:ok, attrs} <- Attribution.resolve(attrs) do
        persist_or_rollback(attrs)
      else
        {:error, changeset} -> Repo.rollback(changeset)
      end
    end)
  end

  defp persist_or_rollback(attrs) do
    case persist(attrs) do
      {:ok, conversion} -> conversion
      {:error, changeset} -> Repo.rollback(changeset)
    end
  end

  defp persist(attrs) do
    now = DateTime.utc_now()
    attrs = put_default_attribution_confidence(attrs)
    changeset = CommerceConversion.changeset(%CommerceConversion{}, attrs)

    update_fields =
      Input.present_upsert_fields(attrs, changeset, @commerce_conversion_upsert_fields)

    changeset
    |> Repo.insert(
      on_conflict: conversion_conflict_query(update_fields, now),
      conflict_target: [:affiliate_network_id, :network_conversion_ref],
      allow_stale: true,
      returning: true
    )
    |> maybe_fetch_unchanged_conversion(changeset)
  end

  defp conversion_conflict_query(update_fields, now) do
    from conversion in CommerceConversion,
      where: fragment("EXCLUDED.reported_at >= ?", conversion.reported_at),
      update: [set: ^(update_fields ++ [updated_at: now])]
  end

  defp maybe_fetch_unchanged_conversion({:ok, %CommerceConversion{id: nil}}, changeset) do
    {:ok, get_existing_conversion!(changeset)}
  end

  defp maybe_fetch_unchanged_conversion(result, _changeset), do: result

  defp get_existing_conversion!(changeset) do
    Repo.get_by!(
      CommerceConversion,
      affiliate_network_id: Ecto.Changeset.get_field(changeset, :affiliate_network_id),
      network_conversion_ref: Ecto.Changeset.get_field(changeset, :network_conversion_ref)
    )
  end

  defp put_affiliate_network_id(attrs) do
    changeset = CommerceConversion.changeset(%CommerceConversion{}, attrs)

    case Ecto.Changeset.get_field(changeset, :source_network) do
      source_network when is_atom(source_network) ->
        case Repo.get_by(AffiliateNetwork, code: Atom.to_string(source_network)) do
          %AffiliateNetwork{id: affiliate_network_id} ->
            {:ok, Input.put_attr(attrs, :affiliate_network_id, affiliate_network_id)}

          nil ->
            {:error,
             Ecto.Changeset.add_error(
               changeset,
               :source_network,
               "is not configured as an affiliate network"
             )}
        end

      _invalid_or_missing_network ->
        {:error, changeset}
    end
  end

  defp put_default_attribution_confidence(attrs) do
    cond do
      Input.attr_key_present?(attrs, :attribution_confidence) ->
        attrs

      not is_nil(Input.fetch_attr(attrs, :click_session_id)) ->
        Input.put_attr(attrs, :attribution_confidence, :high)

      true ->
        attrs
    end
  end
end
