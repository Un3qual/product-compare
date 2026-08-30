defmodule ProductCompare.Ingestion.MerchantIdentitiesConcurrencyTest do
  use ProductCompare.DataCase, async: false

  import Ecto.Query

  import ProductCompare.DatabaseTestHelpers,
    only: [assert_blocked_by: 2, assert_not_blocked_by: 2, start_unboxed_action: 1]

  alias Ecto.Adapters.SQL.Sandbox
  alias ProductCompare.Ingestion.MerchantIdentities
  alias ProductCompare.Ingestion.NormalizedListing
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.MerchantSourceIdentity
  alias ProductCompareSchemas.Pricing.Merchant
  alias ProductCompareSchemas.Specs.Source

  test "in-transaction resolution fails fast without an outer transaction" do
    assert_raise ArgumentError, ~r/requires a database transaction/, fn ->
      MerchantIdentities.resolve_in_transaction(1, normalized_listing(%{}))
    end
  end

  test "same-key first sightings serialize before creating merchants" do
    source = committed_source_fixture()
    identifier = "same-key-merchant"
    merchant_domains = ["current.example", "stale.example"]
    on_exit(fn -> delete_committed_fixture(source.id, merchant_domains) end)

    {barrier, barrier_backend_pid} = hold_identity_lock(source.id, identifier)

    current_listing =
      normalized_listing(%{
        merchant_identifier: identifier,
        merchant_name: "Current Merchant",
        merchant_domain: "current.example",
        observed_at: ~U[2026-08-30 12:00:00Z]
      })

    stale_listing =
      normalized_listing(%{
        merchant_identifier: identifier,
        merchant_name: "Stale Merchant",
        merchant_domain: "stale.example",
        observed_at: ~U[2026-08-29 12:00:00Z]
      })

    {current_attempt, current_backend_pid} =
      start_resolution(source.id, current_listing)

    assert_blocked_by(current_backend_pid, barrier_backend_pid)

    {stale_attempt, stale_backend_pid} =
      start_resolution(source.id, stale_listing)

    assert_blocked_by(stale_backend_pid, barrier_backend_pid)
    release_identity_lock(barrier)

    assert {:ok, current_identity} = Task.await(current_attempt)
    assert {:ok, stale_identity} = Task.await(stale_attempt)
    assert current_identity.id == stale_identity.id
    assert current_identity.merchant_id == stale_identity.merchant_id

    assert %MerchantSourceIdentity{
             merchant_id: merchant_id,
             merchant_name: "Current Merchant",
             merchant_domain: "current.example"
           } = Repo.get_by!(MerchantSourceIdentity, source_id: source.id)

    assert [%Merchant{id: ^merchant_id, domain: "current.example"}] =
             Repo.all(from merchant in Merchant, where: merchant.domain in ^merchant_domains)
  end

  test "a different merchant identity key does not wait for the held key" do
    source = committed_source_fixture()
    held_identifier = "held-merchant"
    other_domain = "other-merchant.example"
    on_exit(fn -> delete_committed_fixture(source.id, [other_domain]) end)

    {barrier, barrier_backend_pid} = hold_identity_lock(source.id, held_identifier)

    {other_attempt, other_backend_pid} =
      start_held_resolution(
        source.id,
        normalized_listing(%{
          merchant_identifier: "other-merchant",
          merchant_name: "Other Merchant",
          merchant_domain: other_domain
        })
      )

    assert_not_blocked_by(other_backend_pid, barrier_backend_pid)
    assert_receive {:resolution_finished, task_pid, {:ok, identity}}, 2_000
    assert task_pid == other_attempt.pid
    assert identity.merchant_identifier == "other-merchant"

    send(other_attempt.pid, :finish_resolution)
    assert {:ok, %MerchantSourceIdentity{}} = Task.await(other_attempt)
    release_identity_lock(barrier)
  end

  defp start_resolution(source_id, listing) do
    start_unboxed_action(fn ->
      Repo.transaction(fn ->
        case MerchantIdentities.resolve_in_transaction(source_id, listing) do
          {:ok, identity} -> identity
          {:error, reason} -> Repo.rollback(reason)
        end
      end)
    end)
  end

  defp start_held_resolution(source_id, listing) do
    parent = self()

    start_unboxed_action(fn ->
      Repo.transaction(fn ->
        result = MerchantIdentities.resolve_in_transaction(source_id, listing)
        send(parent, {:resolution_finished, self(), result})

        receive do
          :finish_resolution ->
            case result do
              {:ok, identity} -> identity
              {:error, reason} -> Repo.rollback(reason)
            end
        after
          5_000 -> flunk("timed out waiting to finish merchant identity resolution")
        end
      end)
    end)
  end

  defp hold_identity_lock(source_id, merchant_identifier) do
    parent = self()

    {task, backend_pid} =
      start_unboxed_action(fn ->
        Repo.transaction(fn ->
          Repo.query!("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [
            identity_lock_key(source_id, merchant_identifier)
          ])

          send(parent, {:identity_lock_held, self()})

          receive do
            :release_identity_lock -> :ok
          after
            5_000 -> flunk("timed out waiting to release merchant identity lock")
          end
        end)
      end)

    assert_receive {:identity_lock_held, task_pid}, 2_000
    assert task_pid == task.pid
    {task, backend_pid}
  end

  defp release_identity_lock(task) do
    send(task.pid, :release_identity_lock)
    assert {:ok, :ok} = Task.await(task)
  end

  defp identity_lock_key(source_id, merchant_identifier),
    do: "#{source_id}:#{merchant_identifier}"

  defp committed_source_fixture do
    Sandbox.unboxed_run(Repo, fn ->
      %Source{}
      |> Source.changeset(%{
        kind: "affiliate_feed",
        name: "Merchant identity concurrency #{Ecto.UUID.generate()}",
        domain: "merchant-identity-#{Ecto.UUID.generate()}.example"
      })
      |> Repo.insert!()
    end)
  end

  defp delete_committed_fixture(source_id, merchant_domains) do
    Sandbox.unboxed_run(Repo, fn ->
      Repo.delete_all(
        from identity in MerchantSourceIdentity, where: identity.source_id == ^source_id
      )

      Repo.delete_all(from merchant in Merchant, where: merchant.domain in ^merchant_domains)
      Repo.delete_all(from source in Source, where: source.id == ^source_id)
    end)
  end

  defp normalized_listing(attrs) do
    struct!(
      NormalizedListing,
      Map.merge(
        %{
          source: :cj,
          external_product_id: Ecto.UUID.generate(),
          merchant_identifier: "merchant",
          product_title: "Concurrency product",
          merchant_name: "Merchant",
          merchant_domain: "merchant.example",
          listing_url: "https://merchant.example/product",
          currency: "USD",
          amount: Decimal.new("10.00"),
          availability: :in_stock,
          observed_at: ~U[2026-08-30 12:00:00Z],
          raw_payload: %{}
        },
        attrs
      )
    )
  end
end
