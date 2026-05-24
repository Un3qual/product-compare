defmodule ProductCompare.Ingestion do
  @moduledoc """
  Product data ingestion context.
  """

  import Ecto.Query

  alias ProductCompare.Ingestion.NormalizedListing
  alias ProductCompare.Pricing
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.MerchantSourceIdentity
  alias ProductCompareSchemas.Pricing.Merchant
  alias ProductCompareSchemas.Specs.Source

  @spec resolve_merchant_identity(Source.t(), NormalizedListing.t()) ::
          {:ok, MerchantSourceIdentity.t()} | {:error, term()}
  def resolve_merchant_identity(%Source{id: source_id}, %NormalizedListing{} = listing) do
    case get_merchant_identity(source_id, listing.merchant_identifier) do
      nil -> create_merchant_identity(source_id, listing)
      %MerchantSourceIdentity{} = identity -> update_merchant_identity(identity, listing)
    end
  end

  defp create_merchant_identity(source_id, listing) do
    Repo.transaction(fn ->
      case create_merchant_identity_in_transaction(source_id, listing) do
        {:ok, identity} -> identity
        {:stale_conflict, _source_id, _merchant_identifier} = conflict -> Repo.rollback(conflict)
        {:error, reason} -> Repo.rollback(reason)
      end
    end)
    |> case do
      {:ok, %MerchantSourceIdentity{} = identity} ->
        {:ok, identity}

      {:error, {:stale_conflict, source_id, merchant_identifier}} ->
        fetch_merchant_identity(source_id, merchant_identifier)

      {:error, reason} ->
        {:error, reason}
    end
  end

  defp create_merchant_identity_in_transaction(source_id, listing) do
    with {:ok, merchant} <- upsert_listing_merchant(listing) do
      %MerchantSourceIdentity{}
      |> MerchantSourceIdentity.changeset(identity_attrs(source_id, merchant.id, listing))
      |> Repo.insert(
        on_conflict: :nothing,
        conflict_target: [:source_id, :merchant_identifier],
        returning: true
      )
      |> maybe_update_conflicting_identity(source_id, merchant, listing)
    end
  end

  defp update_merchant_identity(identity, listing) do
    Repo.transaction(fn ->
      case update_identity_if_current(identity, listing) do
        {:ok, updated_identity} ->
          sync_identity_merchant(updated_identity, listing)

        :stale ->
          get_merchant_identity(identity.source_id, identity.merchant_identifier)
      end
    end)
    |> case do
      {:ok, %MerchantSourceIdentity{} = updated_identity} ->
        preload_merchant({:ok, updated_identity})

      {:ok, nil} ->
        {:error, :merchant_identity_not_found}

      {:error, reason} ->
        {:error, reason}
    end
  end

  defp maybe_update_conflicting_identity(
         {:ok, %MerchantSourceIdentity{id: nil}},
         source_id,
         merchant,
         listing
       ) do
    with {:ok, identity} <- fetch_merchant_identity(source_id, listing.merchant_identifier) do
      update_conflicting_merchant_identity(identity, merchant, listing)
    end
  end

  defp maybe_update_conflicting_identity(
         {:ok, %MerchantSourceIdentity{} = identity},
         _source_id,
         _merchant,
         _listing
       ) do
    preload_merchant({:ok, identity})
  end

  defp maybe_update_conflicting_identity(error, _source_id, _merchant, _listing), do: error

  defp update_conflicting_merchant_identity(identity, merchant, listing) do
    case update_identity_if_current(identity, listing, merchant.id) do
      {:ok, updated_identity} -> preload_merchant({:ok, updated_identity})
      :stale -> {:stale_conflict, identity.source_id, identity.merchant_identifier}
    end
  end

  defp fetch_merchant_identity(source_id, merchant_identifier) do
    case get_merchant_identity(source_id, merchant_identifier) do
      nil -> {:error, :merchant_identity_not_found}
      %MerchantSourceIdentity{} = identity -> {:ok, identity}
    end
  end

  defp update_identity_if_current(identity, listing, merchant_id \\ nil) do
    now = DateTime.utc_now()
    merchant_id = merchant_id || identity.merchant_id

    query =
      from source_identity in MerchantSourceIdentity,
        where:
          source_identity.id == ^identity.id and
            source_identity.last_seen_at <= ^listing.observed_at,
        select: source_identity

    updates = [
      merchant_id: merchant_id,
      merchant_name: listing.merchant_name,
      merchant_domain: listing.merchant_domain,
      last_seen_at: listing.observed_at,
      updated_at: now
    ]

    case Repo.update_all(query, set: updates) do
      {1, [updated_identity]} -> {:ok, updated_identity}
      {0, []} -> :stale
    end
  end

  defp sync_identity_merchant(identity, listing) do
    identity = Repo.preload(identity, :merchant)

    identity.merchant
    |> Merchant.changeset(%{
      name: listing.merchant_name,
      domain: listing.merchant_domain
    })
    |> Repo.update()
    |> case do
      {:ok, merchant} -> %{identity | merchant: merchant}
      {:error, reason} -> Repo.rollback(reason)
    end
  end

  defp get_merchant_identity(source_id, merchant_identifier) do
    Repo.one(
      from identity in MerchantSourceIdentity,
        where:
          identity.source_id == ^source_id and
            identity.merchant_identifier == ^merchant_identifier,
        preload: [:merchant]
    )
  end

  defp upsert_listing_merchant(listing) do
    Pricing.upsert_merchant(%{
      name: listing.merchant_name,
      domain: listing.merchant_domain
    })
  end

  defp identity_attrs(source_id, merchant_id, listing) do
    %{
      source_id: source_id,
      merchant_id: merchant_id,
      merchant_identifier: listing.merchant_identifier,
      merchant_name: listing.merchant_name,
      merchant_domain: listing.merchant_domain,
      last_seen_at: listing.observed_at
    }
  end

  defp preload_merchant({:ok, identity}), do: {:ok, Repo.preload(identity, :merchant)}
  defp preload_merchant(error), do: error
end
