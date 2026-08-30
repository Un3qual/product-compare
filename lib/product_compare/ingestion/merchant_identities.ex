defmodule ProductCompare.Ingestion.MerchantIdentities do
  @moduledoc false

  @dialyzer {:nowarn_function, preload_merchant: 1}

  import Ecto.Query

  alias ProductCompare.Ingestion.NormalizedListing
  alias ProductCompare.Pricing
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.MerchantSourceIdentity
  alias ProductCompareSchemas.Specs.Source

  @spec resolve(Source.t(), NormalizedListing.t()) ::
          {:ok, MerchantSourceIdentity.t()} | {:error, term()}
  def resolve(%Source{id: source_id}, %NormalizedListing{} = listing) do
    Repo.transaction(fn ->
      case resolve_in_transaction(source_id, listing) do
        {:ok, identity} -> identity
        {:error, reason} -> Repo.rollback(reason)
      end
    end)
    |> case do
      {:ok, %MerchantSourceIdentity{} = identity} -> {:ok, identity}
      {:error, reason} -> {:error, reason}
    end
  end

  @spec resolve_in_transaction(integer(), NormalizedListing.t()) ::
          {:ok, MerchantSourceIdentity.t()} | {:error, term()}
  def resolve_in_transaction(source_id, %NormalizedListing{} = listing) do
    unless Repo.in_transaction?() do
      raise ArgumentError, "resolve_in_transaction/2 requires a database transaction"
    end

    lock_identity_key!(source_id, listing.merchant_identifier)

    case get_identity(source_id, listing.merchant_identifier) do
      nil -> create_or_fetch_identity(source_id, listing)
      %MerchantSourceIdentity{} = identity -> update_or_fetch_identity(identity, listing)
    end
  end

  defp create_identity_in_transaction(source_id, listing) do
    with {:ok, merchant} <- upsert_merchant(listing) do
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

  defp create_or_fetch_identity(source_id, listing) do
    case create_identity_in_transaction(source_id, listing) do
      {:ok, %MerchantSourceIdentity{} = identity} ->
        {:ok, identity}

      {:stale_conflict, ^source_id, merchant_identifier} ->
        fetch_identity(source_id, merchant_identifier)

      {:error, reason} ->
        {:error, reason}
    end
  end

  defp update_or_fetch_identity(identity, listing) do
    case update_if_current(identity, listing) do
      {:ok, updated_identity} ->
        with {:ok, retargeted_identity} <- retarget_merchant(updated_identity, listing) do
          preload_merchant({:ok, retargeted_identity})
        end

      :stale ->
        fetch_identity(identity.source_id, identity.merchant_identifier)
    end
  end

  defp maybe_update_conflicting_identity(
         {:ok, %MerchantSourceIdentity{id: nil}},
         source_id,
         merchant,
         listing
       ) do
    with {:ok, identity} <- fetch_identity(source_id, listing.merchant_identifier) do
      update_conflicting_identity(identity, merchant, listing)
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

  defp update_conflicting_identity(identity, merchant, listing) do
    case update_if_current(identity, listing, merchant.id) do
      {:ok, updated_identity} -> preload_merchant({:ok, updated_identity})
      :stale -> {:stale_conflict, identity.source_id, identity.merchant_identifier}
    end
  end

  defp fetch_identity(source_id, merchant_identifier) do
    case get_identity(source_id, merchant_identifier) do
      nil -> {:error, :merchant_identity_not_found}
      %MerchantSourceIdentity{} = identity -> {:ok, identity}
    end
  end

  defp update_if_current(identity, listing, merchant_id \\ nil) do
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

  defp retarget_merchant(identity, listing) do
    with {:ok, merchant} <- upsert_merchant(listing),
         {:ok, identity} <- set_merchant(identity, merchant.id) do
      {:ok, %{identity | merchant: merchant}}
    end
  end

  defp set_merchant(identity, merchant_id) do
    if identity.merchant_id == merchant_id do
      {:ok, identity}
    else
      identity
      |> MerchantSourceIdentity.changeset(%{merchant_id: merchant_id})
      |> Repo.update()
    end
  end

  defp get_identity(source_id, merchant_identifier) do
    Repo.one(
      from identity in MerchantSourceIdentity,
        where:
          identity.source_id == ^source_id and
            identity.merchant_identifier == ^merchant_identifier,
        preload: [:merchant]
    )
  end

  defp lock_identity_key!(source_id, merchant_identifier) do
    Repo.query!("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [
      "#{source_id}:#{merchant_identifier}"
    ])

    :ok
  end

  defp upsert_merchant(listing), do: Pricing.upsert_merchant(merchant_attrs(listing))

  defp merchant_attrs(listing) do
    %{
      name:
        first_present([
          listing.merchant_name,
          listing.merchant_domain,
          listing.merchant_identifier
        ]),
      domain:
        first_present([
          listing.merchant_domain,
          domain_from_url(listing.listing_url),
          listing.merchant_identifier
        ])
    }
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

  defp domain_from_url(url) when is_binary(url) do
    url
    |> URI.parse()
    |> Map.get(:host)
    |> present_string()
  end

  defp domain_from_url(_url), do: nil

  defp first_present(values), do: Enum.find_value(values, &present_string/1)

  defp present_string(value) when is_binary(value) do
    value
    |> String.trim()
    |> case do
      "" -> nil
      value -> value
    end
  end

  defp present_string(_value), do: nil

  defp preload_merchant({:ok, identity}), do: {:ok, Repo.preload(identity, :merchant)}
  defp preload_merchant(error), do: error
end
