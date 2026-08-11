defmodule ProductCompareWeb.GraphQL.HomeDealConsistencyTest do
  use ProductCompare.DataCase, async: false

  @moduletag sandbox_isolation: "REPEATABLE READ"

  alias Ecto.Adapters.SQL.Sandbox
  alias ProductCompare.{Pricing, Repo}
  alias ProductCompare.Fixtures.{AccountsFixtures, SpecsFixtures}
  alias ProductCompareWeb.Schema
  alias ProductCompareSchemas.Accounts.User
  alias ProductCompareSchemas.Catalog.{Brand, Product}
  alias ProductCompareSchemas.Pricing.{Merchant, MerchantProduct}
  alias ProductCompareSchemas.Taxonomy.Taxon

  @now ~U[2026-08-11 12:00:00Z]

  test "public New landed price and price signal use one database snapshot" do
    assert_new_offer_snapshot(:new)
  end

  test "signed-in fallback New landed price and price signal use one database snapshot" do
    assert_new_offer_snapshot(:fallback)
  end

  defp assert_new_offer_snapshot(surface) do
    fixture = Sandbox.unboxed_run(Repo, &committed_new_offer_fixture/0)
    on_exit(fn -> Sandbox.unboxed_run(Repo, fn -> delete_fixture(fixture) end) end)
    parent = self()

    reader =
      Task.async(fn ->
        Sandbox.unboxed_run(Repo, fn ->
          context =
            %{graphql_observed_at: @now}
            |> maybe_put_current_user(surface, fixture.user)
            |> Schema.context()

          send(parent, {:reader_ready, self()})

          receive do
            :read -> :ok
          after
            5_000 -> flunk("timed out waiting to read home deals")
          end

          Absinthe.run(query(surface), Schema, context: context)
        end)
      end)

    assert_receive {:reader_ready, reader_pid}, 2_000
    handler_id = {__MODULE__, surface, make_ref()}

    :ok =
      :telemetry.attach(
        handler_id,
        [:product_compare, :repo, :query],
        &pause_after_offer_selection/4,
        {handler_id, reader_pid, parent, surface}
      )

    on_exit(fn -> :telemetry.detach(handler_id) end)
    send(reader_pid, :read)

    assert_receive {:home_offer_selected, ^reader_pid}, 2_000

    Sandbox.unboxed_run(Repo, fn ->
      {1, _} =
        Repo.update_all(
          from(offer in MerchantProduct, where: offer.id == ^fixture.offer.id),
          set: [is_active: false]
        )
    end)

    send(reader_pid, :continue_home_offer)
    assert {:ok, %{data: %{"homeDeals" => deals}}} = Task.await(reader, 10_000)

    field = if surface == :new, do: "new", else: "forYou"

    assert %{
             "edges" => [
               %{
                 "offer" => %{
                   "merchantProductId" => merchant_product_id,
                   "landedPrice" => "1",
                   "priceSignal" => "BELOW_30_DAY_MEDIAN"
                 },
                 "reasons" => [%{"code" => "NEW_OFFER"}]
               }
             ]
           } = deals[field]

    assert merchant_product_id == global_id(:merchant_product, fixture.offer.id)
  end

  defp pause_after_offer_selection(
         _event,
         _measurements,
         metadata,
         {handler_id, reader_pid, test_pid, surface}
       ) do
    if self() == reader_pid and offer_selection_query?(metadata.query, surface) do
      :telemetry.detach(handler_id)
      send(test_pid, {:home_offer_selected, self()})

      receive do
        :continue_home_offer -> :ok
      after
        5_000 -> flunk("timed out waiting to continue home offer hydration")
      end
    end
  end

  defp offer_selection_query?(query, :new) when is_binary(query) do
    String.contains?(query, ~s(AS "new_offer?")) and
      not String.contains?(query, ~s(AS "fallback_rank"))
  end

  defp offer_selection_query?(query, :fallback) when is_binary(query) do
    String.contains?(query, ~s(AS "fallback_rank"))
  end

  defp committed_new_offer_fixture do
    user = AccountsFixtures.user_fixture()

    product =
      SpecsFixtures.product_fixture(%{
        slug: "home-deal-consistency-#{Ecto.UUID.generate()}"
      })

    {:ok, merchant} =
      Pricing.upsert_merchant(%{
        name: "Home Deal Consistency #{Ecto.UUID.generate()}",
        domain: "home-deal-consistency-#{Ecto.UUID.generate()}.example"
      })

    {:ok, offer} =
      Pricing.upsert_merchant_product(%{
        merchant_id: merchant.id,
        product_id: product.id,
        url: "https://home-deal-consistency.example/#{Ecto.UUID.generate()}",
        currency: "USD",
        is_active: true
      })

    {:ok, _historical} =
      Pricing.add_price_point(%{
        merchant_product_id: offer.id,
        observed_at: DateTime.add(@now, -3_600, :second),
        price: "101",
        shipping: "0",
        in_stock: true
      })

    {:ok, _current} =
      Pricing.add_price_point(%{
        merchant_product_id: offer.id,
        observed_at: @now,
        price: "1",
        shipping: "0",
        in_stock: true
      })

    %{merchant: merchant, offer: offer, product: product, user: user}
  end

  defp delete_fixture(fixture) do
    Repo.delete_all(from merchant in Merchant, where: merchant.id == ^fixture.merchant.id)
    Repo.delete_all(from user in User, where: user.id == ^fixture.user.id)
    Repo.delete_all(from product in Product, where: product.id == ^fixture.product.id)
    Repo.delete_all(from brand in Brand, where: brand.id == ^fixture.product.brand_id)

    Repo.delete_all(
      from taxon in Taxon, where: taxon.id == ^fixture.product.primary_type_taxon_id
    )
  end

  defp maybe_put_current_user(context, :new, _user), do: context
  defp maybe_put_current_user(context, :fallback, user), do: Map.put(context, :current_user, user)

  defp query(:new) do
    """
    query NewDealSnapshot {
      homeDeals(selectedSlugs: []) {
        new(first: 1) {
          edges {
            offer { merchantProductId landedPrice priceSignal }
            reasons { code }
          }
        }
      }
    }
    """
  end

  defp query(:fallback) do
    """
    query FallbackDealSnapshot {
      homeDeals(selectedSlugs: []) {
        forYou(first: 1) {
          edges {
            offer { merchantProductId landedPrice priceSignal }
            reasons { code }
          }
        }
      }
    }
    """
  end

  defp global_id(type, id), do: ProductCompareWeb.GraphQL.GlobalId.encode(type, id)
end
