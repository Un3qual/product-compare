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
    :network_action_ref,
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

  @spec reverse_cj_action(String.t(), DateTime.t(), map()) ::
          {:ok, %{matched: pos_integer(), updated: non_neg_integer()}}
          | {:error, :unmatched_correction | Ecto.Changeset.t()}
  def reverse_cj_action(network_action_ref, posting_date, raw_payload) do
    with {:ok, network_action_ref} <- validate_action_ref(network_action_ref),
         :ok <- validate_posting_date(posting_date),
         :ok <- validate_raw_payload(raw_payload),
         {:ok, network} <- cj_network(),
         [_ | _] = conversions <- lock_cj_action(network.id, network_action_ref) do
      reverse_eligible(conversions, posting_date, raw_payload)
    else
      [] -> {:error, :unmatched_correction}
      {:error, changeset} -> {:error, changeset}
    end
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
    attrs = normalize_source_network(attrs)
    changeset = CommerceConversion.changeset(%CommerceConversion{}, attrs)

    case Ecto.Changeset.get_field(changeset, :source_network) do
      source_network when is_binary(source_network) ->
        case Repo.get_by(AffiliateNetwork, code: source_network) do
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

  defp normalize_source_network(attrs) do
    case Input.fetch_attr(attrs, :source_network) do
      source_network when is_binary(source_network) ->
        Input.put_attr(attrs, :source_network, AffiliateNetwork.normalize_code(source_network))

      _missing_or_invalid ->
        attrs
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

  defp validate_action_ref(network_action_ref) do
    case normalize_string(network_action_ref) do
      nil -> {:error, correction_changeset(:network_action_ref, "can't be blank")}
      network_action_ref -> {:ok, network_action_ref}
    end
  end

  defp validate_posting_date(%DateTime{utc_offset: 0, std_offset: 0}), do: :ok

  defp validate_posting_date(_posting_date),
    do: {:error, correction_changeset(:reported_at, "is invalid")}

  defp validate_raw_payload(raw_payload) when is_map(raw_payload), do: :ok

  defp validate_raw_payload(_raw_payload),
    do: {:error, correction_changeset(:raw_payload, "must be a map")}

  defp cj_network do
    case Repo.get_by(AffiliateNetwork, code: "cj") do
      %AffiliateNetwork{} = network ->
        {:ok, network}

      nil ->
        {:error,
         correction_changeset(:source_network, "is not configured as an affiliate network")}
    end
  end

  defp lock_cj_action(affiliate_network_id, network_action_ref) do
    Repo.all(
      from conversion in CommerceConversion,
        where:
          conversion.affiliate_network_id == ^affiliate_network_id and
            conversion.network_action_ref == ^network_action_ref,
        order_by: [asc: conversion.id],
        lock: "FOR UPDATE"
    )
  end

  defp reverse_eligible(conversions, posting_date, raw_payload) do
    Enum.reduce_while(conversions, {:ok, 0}, fn conversion, {:ok, updated} ->
      if DateTime.compare(conversion.reported_at, posting_date) == :gt do
        {:cont, {:ok, updated}}
      else
        attrs = %{
          status: :reversed,
          data_freshness_at: posting_date,
          reported_at: posting_date,
          raw_payload: raw_payload
        }

        conversion = %{conversion | source_network: "cj"}

        case conversion |> CommerceConversion.changeset(attrs) |> Repo.update() do
          {:ok, _conversion} -> {:cont, {:ok, updated + 1}}
          {:error, changeset} -> {:halt, {:error, changeset}}
        end
      end
    end)
    |> case do
      {:ok, updated} -> {:ok, %{matched: length(conversions), updated: updated}}
      {:error, changeset} -> {:error, changeset}
    end
  end

  defp correction_changeset(field, message) do
    %CommerceConversion{}
    |> Ecto.Changeset.change()
    |> Ecto.Changeset.add_error(field, message)
  end

  defp normalize_string(value) when is_binary(value) do
    case String.trim(value) do
      "" -> nil
      value -> value
    end
  end

  defp normalize_string(_value), do: nil
end
