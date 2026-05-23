defmodule ProductCompare.Ingestion do
  @moduledoc """
  Product data ingestion context.
  """

  import Ecto.Query

  alias Ecto.Multi
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
    with {:ok, merchant} <- upsert_listing_merchant(listing) do
      %MerchantSourceIdentity{}
      |> MerchantSourceIdentity.changeset(identity_attrs(source_id, merchant.id, listing))
      |> Repo.insert()
      |> preload_merchant()
    end
  end

  defp update_merchant_identity(identity, listing) do
    if DateTime.compare(listing.observed_at, identity.last_seen_at) == :lt do
      {:ok, identity}
    else
      Multi.new()
      |> Multi.update(
        :merchant,
        Merchant.changeset(identity.merchant, %{
          name: listing.merchant_name,
          domain: listing.merchant_domain
        })
      )
      |> Multi.update(
        :identity,
        MerchantSourceIdentity.changeset(
          identity,
          identity_attrs(identity.source_id, identity.merchant_id, listing)
        )
      )
      |> Repo.transaction()
      |> case do
        {:ok, %{identity: updated_identity}} -> preload_merchant({:ok, updated_identity})
        {:error, _step, reason, _changes} -> {:error, reason}
      end
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
