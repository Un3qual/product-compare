defmodule ProductCompare.CommerceAttribution do
  @moduledoc """
  Attribution context for commerce redirects, click sessions, conversions, and price-paid facts.
  """

  import Ecto.Query

  alias ProductCompare.Repo
  alias ProductCompareSchemas.CommerceAttribution.CommerceClickSession
  alias ProductCompareSchemas.CommerceAttribution.CommerceConversion
  alias ProductCompareSchemas.CommerceAttribution.CommerceLink
  alias ProductCompareSchemas.CommerceAttribution.PurchasePriceFact

  @commerce_link_upsert_fields [
    :network,
    :campaign_params,
    :backfilled_from_affiliate_links,
    :is_active
  ]
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
  @commerce_link_conflict_target {:unsafe_fragment,
                                  "(destination_url, COALESCE(affiliate_program_id, 0), merchant_id, link_type)"}

  @spec upsert_commerce_link(map()) :: {:ok, CommerceLink.t()} | {:error, Ecto.Changeset.t()}
  def upsert_commerce_link(attrs) do
    now = DateTime.utc_now()
    changeset = CommerceLink.changeset(%CommerceLink{}, attrs)

    update_fields =
      present_upsert_fields(attrs, changeset, @commerce_link_upsert_fields)

    Repo.insert(
      changeset,
      on_conflict: [set: update_fields ++ [updated_at: now]],
      conflict_target: @commerce_link_conflict_target,
      returning: true
    )
  end

  @spec create_click_session(map()) ::
          {:ok, CommerceClickSession.t()} | {:error, Ecto.Changeset.t()}
  def create_click_session(attrs) do
    %CommerceClickSession{}
    |> CommerceClickSession.changeset(attrs)
    |> Repo.insert()
  end

  @spec redirect_destination(String.t()) :: {:ok, String.t()} | {:error, :not_found}
  def redirect_destination(click_id) do
    with {:ok, cast_click_id} <- Ecto.UUID.cast(click_id),
         destination_url when is_binary(destination_url) <-
           lookup_redirect_destination(cast_click_id),
         true <- CommerceLink.valid_destination_url?(destination_url) do
      {:ok, destination_url}
    else
      _not_found -> {:error, :not_found}
    end
  end

  @spec ingest_conversion(map()) ::
          {:ok, CommerceConversion.t()} | {:error, Ecto.Changeset.t()}
  def ingest_conversion(attrs) do
    now = DateTime.utc_now()

    attrs =
      attrs
      |> maybe_put_click_session_id()
      |> put_default_attribution_confidence()

    changeset = CommerceConversion.changeset(%CommerceConversion{}, attrs)

    update_fields =
      present_upsert_fields(attrs, changeset, @commerce_conversion_upsert_fields)

    changeset
    |> Repo.insert(
      on_conflict: conversion_conflict_query(update_fields, now),
      conflict_target: [:source_network, :network_conversion_ref],
      allow_stale: true,
      returning: true
    )
    |> maybe_fetch_unchanged_conversion(changeset)
  end

  @spec create_purchase_price_fact(map()) ::
          {:ok, PurchasePriceFact.t()} | {:error, Ecto.Changeset.t()}
  def create_purchase_price_fact(attrs) do
    %PurchasePriceFact{}
    |> PurchasePriceFact.changeset(attrs)
    |> Repo.insert()
  end

  defp lookup_redirect_destination(click_id) do
    Repo.one(
      from session in CommerceClickSession,
        join: link in assoc(session, :commerce_link),
        where: session.click_id == ^click_id and link.is_active == true,
        select: link.destination_url,
        limit: 1
    )
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
      source_network: Ecto.Changeset.get_field(changeset, :source_network),
      network_conversion_ref: Ecto.Changeset.get_field(changeset, :network_conversion_ref)
    )
  end

  defp maybe_put_click_session_id(attrs) do
    if attr_present?(attrs, :click_session_id) do
      attrs
    else
      case get_attr(attrs, :public_click_id) do
        nil ->
          attrs

        click_id ->
          case get_click_session_by_public_id(click_id) do
            nil -> attrs
            %CommerceClickSession{id: id} -> put_attr(attrs, :click_session_id, id)
          end
      end
    end
  end

  defp get_click_session_by_public_id(click_id) do
    with {:ok, cast_click_id} <- Ecto.UUID.cast(click_id) do
      Repo.get_by(CommerceClickSession, click_id: cast_click_id)
    else
      :error -> nil
    end
  end

  defp put_default_attribution_confidence(attrs) do
    cond do
      attr_key_present?(attrs, :attribution_confidence) ->
        attrs

      attr_present?(attrs, :click_session_id) ->
        put_attr(attrs, :attribution_confidence, :high)

      true ->
        attrs
    end
  end

  defp get_attr(attrs, key) when is_map(attrs),
    do: Map.get(attrs, key, Map.get(attrs, Atom.to_string(key)))

  defp put_attr(attrs, key, value) when is_map(attrs), do: Map.put(attrs, key, value)

  defp attr_present?(attrs, key), do: not is_nil(get_attr(attrs, key))

  defp present_upsert_fields(attrs, changeset, fields) do
    for field <- fields,
        attr_key_present?(attrs, field),
        do: {field, Ecto.Changeset.get_field(changeset, field)}
  end

  defp attr_key_present?(attrs, key) when is_map(attrs),
    do: Map.has_key?(attrs, key) or Map.has_key?(attrs, Atom.to_string(key))
end
