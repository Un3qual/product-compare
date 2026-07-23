defmodule ProductCompare.CommerceAttribution.Conversions do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Input
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Affiliate.AffiliateProgram
  alias ProductCompareSchemas.CommerceAttribution.CommerceClickSession
  alias ProductCompareSchemas.CommerceAttribution.CommerceConversion
  alias ProductCompareSchemas.CommerceAttribution.CommerceLink
  alias ProductCompareSchemas.CommerceAttribution.PurchasePriceFact
  alias ProductCompareSchemas.Pricing.MerchantProduct

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

  @spec ingest_conversion(map()) ::
          {:ok, CommerceConversion.t()} | {:error, Ecto.Changeset.t()}
  def ingest_conversion(attrs) do
    Repo.transaction(fn ->
      attrs = maybe_restore_persisted_click_attribution(attrs)

      case resolve_click_attribution(attrs) do
        {:ok, attrs} ->
          persist_conversion_or_rollback(attrs)

        {:error, conflicts} ->
          Repo.rollback(attribution_conflict_changeset(attrs, conflicts))
      end
    end)
    |> unwrap_transaction()
  end

  @spec create_purchase_price_fact(map()) ::
          {:ok, PurchasePriceFact.t()} | {:error, Ecto.Changeset.t()}
  def create_purchase_price_fact(attrs) do
    %PurchasePriceFact{}
    |> PurchasePriceFact.changeset(attrs)
    |> Repo.insert()
  end

  defp persist_conversion_or_rollback(attrs) do
    case persist_conversion(attrs) do
      {:ok, conversion} -> conversion
      {:error, changeset} -> Repo.rollback(changeset)
    end
  end

  defp persist_conversion(attrs) do
    now = DateTime.utc_now()

    attrs = put_default_attribution_confidence(attrs)

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

  defp unwrap_transaction({:ok, conversion}), do: {:ok, conversion}
  defp unwrap_transaction({:error, reason}), do: {:error, reason}

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

  defp maybe_restore_persisted_click_attribution(attrs) do
    existing_conversion =
      CommerceConversion.changeset(%CommerceConversion{}, attrs)
      |> existing_conversion_for_update()

    case {incoming_click_identifier?(attrs), existing_conversion} do
      {false, %CommerceConversion{click_session_id: click_session_id}}
      when not is_nil(click_session_id) ->
        put_attr(attrs, :click_session_id, click_session_id)

      _incoming_or_unattributed ->
        attrs
    end
  end

  defp existing_conversion_for_update(changeset) do
    source_network = Ecto.Changeset.get_field(changeset, :source_network)
    network_conversion_ref = Ecto.Changeset.get_field(changeset, :network_conversion_ref)

    if is_nil(source_network) or is_nil(network_conversion_ref) do
      nil
    else
      from(conversion in CommerceConversion,
        where:
          conversion.source_network == ^source_network and
            conversion.network_conversion_ref == ^network_conversion_ref,
        lock: "FOR UPDATE"
      )
      |> Repo.one()
    end
  end

  defp incoming_click_identifier?(attrs) do
    attr_present?(attrs, :click_session_id) or attr_present?(attrs, :public_click_id)
  end

  defp resolve_click_attribution(attrs) do
    changeset = CommerceConversion.changeset(%CommerceConversion{}, attrs)

    case resolved_click_session(attrs, changeset) do
      nil ->
        {:ok, attrs}

      %CommerceClickSession{} = click_session ->
        click_session = Repo.preload(click_session, [:commerce_link, :merchant_product])
        dimensions = click_session_attribution_dimensions(click_session)

        case conflicting_click_dimensions(attrs, changeset, dimensions) do
          [] -> {:ok, put_click_session_attribution_attrs(attrs, click_session, dimensions)}
          conflicts -> {:error, conflicts}
        end
    end
  end

  defp put_click_session_attribution_attrs(attrs, click_session, dimensions) do
    attrs
    |> put_attr(:click_session_id, click_session.id)
    |> put_attr_if_missing(:merchant_id, dimensions.merchant_id)
    |> put_attr_if_missing(:affiliate_program_id, dimensions.affiliate_program_id)
    |> put_attr_if_missing(:merchant_product_id, dimensions.merchant_product_id)
    |> put_attr_if_missing(:product_id, dimensions.product_id)
  end

  defp click_session_attribution_dimensions(click_session) do
    %{
      merchant_id: click_session_merchant_id(click_session),
      affiliate_program_id: click_session_affiliate_program_id(click_session),
      merchant_product_id: click_session.merchant_product_id,
      product_id: click_session_product_id(click_session)
    }
  end

  defp conflicting_click_dimensions(attrs, changeset, dimensions) do
    direct_conflicts =
      for {field, click_value} <- dimensions,
          provider_value = cast_provider_dimension(attrs, changeset, field),
          not is_nil(click_value),
          not is_nil(provider_value),
          provider_value != click_value,
          do: field

    (direct_conflicts ++
       affiliate_program_relation_conflicts(attrs, changeset, dimensions) ++
       merchant_product_relation_conflicts(attrs, changeset, dimensions))
    |> Enum.uniq()
  end

  defp affiliate_program_relation_conflicts(attrs, changeset, %{merchant_id: merchant_id})
       when not is_nil(merchant_id) do
    case cast_provider_dimension(attrs, changeset, :affiliate_program_id) do
      nil ->
        []

      affiliate_program_id ->
        case Repo.get(AffiliateProgram, affiliate_program_id) do
          %AffiliateProgram{merchant_id: ^merchant_id} -> []
          %AffiliateProgram{} -> [:affiliate_program_id]
          nil -> []
        end
    end
  end

  defp affiliate_program_relation_conflicts(_attrs, _changeset, _dimensions), do: []

  defp merchant_product_relation_conflicts(attrs, changeset, dimensions) do
    case cast_provider_dimension(attrs, changeset, :merchant_product_id) do
      nil ->
        []

      merchant_product_id ->
        case Repo.get(MerchantProduct, merchant_product_id) do
          %MerchantProduct{} = merchant_product ->
            if merchant_product_matches_click?(merchant_product, dimensions) do
              []
            else
              [:merchant_product_id]
            end

          nil ->
            []
        end
    end
  end

  defp merchant_product_matches_click?(merchant_product, dimensions) do
    matches_click_dimension?(merchant_product.merchant_id, dimensions.merchant_id) and
      matches_click_dimension?(merchant_product.product_id, dimensions.product_id)
  end

  defp matches_click_dimension?(_provider_value, nil), do: true
  defp matches_click_dimension?(provider_value, click_value), do: provider_value == click_value

  defp cast_provider_dimension(attrs, changeset, field) do
    if Input.attr_key_present?(attrs, field) do
      Ecto.Changeset.get_field(changeset, field)
    end
  end

  defp attribution_conflict_changeset(attrs, conflicts) do
    Enum.reduce(
      conflicts,
      CommerceConversion.changeset(%CommerceConversion{}, attrs),
      &Ecto.Changeset.add_error(&2, &1, "does not match resolved click")
    )
  end

  defp resolved_click_session(attrs, changeset) do
    case Input.fetch_attr(attrs, :click_session_id) do
      nil ->
        attrs
        |> Input.fetch_attr(:public_click_id)
        |> get_click_session_by_public_id()

      _click_session_id ->
        changeset
        |> Ecto.Changeset.get_field(:click_session_id)
        |> get_click_session_by_id()
    end
  end

  defp get_click_session_by_id(nil), do: nil

  defp get_click_session_by_id(click_session_id),
    do: Repo.get(CommerceClickSession, click_session_id)

  defp click_session_merchant_id(%CommerceClickSession{commerce_link: %CommerceLink{} = link}),
    do: link.merchant_id

  defp click_session_merchant_id(%CommerceClickSession{
         merchant_product: %MerchantProduct{} = product
       }),
       do: product.merchant_id

  defp click_session_merchant_id(_click_session), do: nil

  defp click_session_affiliate_program_id(%CommerceClickSession{
         commerce_link: %CommerceLink{} = link
       }),
       do: link.affiliate_program_id

  defp click_session_affiliate_program_id(_click_session), do: nil

  defp click_session_product_id(%CommerceClickSession{
         merchant_product: %MerchantProduct{} = product
       }),
       do: product.product_id

  defp click_session_product_id(_click_session), do: nil

  defp get_click_session_by_public_id(nil), do: nil

  defp get_click_session_by_public_id(click_id) do
    with {:ok, cast_click_id} <- Ecto.UUID.cast(click_id) do
      Repo.get_by(CommerceClickSession, click_id: cast_click_id)
    else
      :error -> nil
    end
  end

  defp put_default_attribution_confidence(attrs) do
    cond do
      Input.attr_key_present?(attrs, :attribution_confidence) ->
        attrs

      attr_present?(attrs, :click_session_id) ->
        put_attr(attrs, :attribution_confidence, :high)

      true ->
        attrs
    end
  end

  defp present_upsert_fields(attrs, changeset, fields) do
    for field <- fields,
        Input.attr_key_present?(attrs, field),
        do: {field, Ecto.Changeset.get_field(changeset, field)}
  end

  defp put_attr(attrs, key, value) when is_map(attrs), do: Map.put(attrs, key, value)

  defp put_attr_if_missing(attrs, _key, nil), do: attrs

  defp put_attr_if_missing(attrs, key, value) do
    if attr_present?(attrs, key) do
      attrs
    else
      put_attr(attrs, key, value)
    end
  end

  defp attr_present?(attrs, key), do: not is_nil(Input.fetch_attr(attrs, key))
end
