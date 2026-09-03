defmodule ProductCompareWeb.GraphQL.HomeWorkspaceConsistencyTest do
  use ProductCompare.DataCase, async: false

  @moduletag sandbox_isolation: "REPEATABLE READ"

  alias Ecto.Adapters.SQL.Sandbox
  alias ProductCompare.{Catalog, Pricing, Repo, Specs}
  alias ProductCompare.Fixtures.{AccountsFixtures, SpecsFixtures, TaxonomyFixtures}
  alias ProductCompareWeb.Resolvers.HomeResolver
  alias ProductCompareSchemas.Accounts.User
  alias ProductCompareSchemas.Catalog.{Brand, Product}
  alias ProductCompareSchemas.Pricing.Merchant
  alias ProductCompareSchemas.Specs.Attribute
  alias ProductCompareSchemas.Taxonomy.Taxon

  @now ~U[2026-08-10 12:00:00Z]

  test "workspace candidate and offer hydration use one consistent database snapshot" do
    fixture = Sandbox.unboxed_run(Repo, &committed_workspace_fixture/0)
    on_exit(fn -> Sandbox.unboxed_run(Repo, fn -> delete_fixture(fixture) end) end)
    parent = self()

    reader =
      Task.async(fn ->
        Sandbox.unboxed_run(Repo, fn ->
          send(parent, {:reader_ready, self()})

          receive do
            :read -> :ok
          after
            5_000 -> flunk("timed out waiting to read the workspace")
          end

          try do
            HomeResolver.workspace_products(%{now: @now}, %{first: 100}, %{})
          rescue
            error -> {:raised, error}
          end
        end)
      end)

    assert_receive {:reader_ready, reader_pid}
    handler_id = {__MODULE__, make_ref()}

    :ok =
      :telemetry.attach(
        handler_id,
        [:product_compare, :repo, :query],
        &pause_after_candidate_page/4,
        {handler_id, reader_pid, parent}
      )

    on_exit(fn -> :telemetry.detach(handler_id) end)
    send(reader_pid, :read)

    assert_receive {:workspace_candidates_loaded, ^reader_pid}

    Sandbox.unboxed_run(Repo, fn ->
      {:ok, _future_refresh} =
        Pricing.add_price_point(%{
          merchant_product_id: fixture.offer.id,
          observed_at: @now,
          price: "1",
          shipping: "0",
          in_stock: false
        })
    end)

    send(reader_pid, :continue_workspace)
    assert {:ok, connection} = Task.await(reader)

    edge = Enum.find(connection.edges, &(&1.node.id == fixture.product.id))
    assert edge.node.id == fixture.product.id
    assert edge.offer.merchant_product_id == fixture.offer.id
    assert Decimal.eq?(edge.offer.landed_price, Decimal.new("105"))
  end

  defp pause_after_candidate_page(
         _event,
         _measurements,
         metadata,
         {handler_id, reader_pid, test_pid}
       ) do
    if self() == reader_pid and workspace_candidate_query?(metadata.query) do
      :telemetry.detach(handler_id)
      send(test_pid, {:workspace_candidates_loaded, self()})

      receive do
        :continue_workspace -> :ok
      after
        5_000 -> flunk("timed out waiting to continue workspace hydration")
      end
    end
  end

  defp workspace_candidate_query?(query) do
    String.contains?(query, ~s(FROM "products"))
  end

  defp committed_workspace_fixture do
    operator = AccountsFixtures.operator_fixture()
    taxonomy = TaxonomyFixtures.taxonomy_fixture("type", "Type")

    taxon =
      TaxonomyFixtures.taxon_fixture(%{
        taxonomy_id: taxonomy.id,
        code: "workspace-consistency-#{Ecto.UUID.generate()}",
        name: "Workspace Consistency"
      })

    {:ok, brand} = Catalog.upsert_brand(%{name: "Workspace Consistency #{Ecto.UUID.generate()}"})

    product =
      SpecsFixtures.product_fixture(%{
        slug: "workspace-consistency-#{Ecto.UUID.generate()}",
        brand_id: brand.id,
        primary_type_taxon: taxon,
        description: String.duplicate("Consistent workspace facts. ", 4)
      })

    attributes =
      Enum.map(1..2, fn index ->
        attribute =
          SpecsFixtures.attribute_fixture(%{
            code: "workspace-consistency-#{index}-#{Ecto.UUID.generate()}",
            data_type: :text
          })

        {:ok, claim} =
          Specs.propose_claim(product.id, attribute.id, %{value_text: "Value #{index}"}, %{
            source_type: :user,
            created_by: operator.id
          })

        {:ok, claim} = Specs.accept_claim(claim.id, operator.id)

        {:ok, _current} =
          Specs.select_current_claim(product.id, attribute.id, claim.id, operator.id)

        attribute
      end)

    {:ok, merchant} =
      Pricing.upsert_merchant(%{
        name: "Workspace Consistency #{Ecto.UUID.generate()}",
        domain: "workspace-consistency-#{Ecto.UUID.generate()}.example"
      })

    {:ok, offer} =
      Pricing.upsert_merchant_product(%{
        merchant_id: merchant.id,
        product_id: product.id,
        url: "https://workspace-consistency.example/#{Ecto.UUID.generate()}",
        currency: "USD",
        is_active: true
      })

    {:ok, _current_price} =
      Pricing.add_price_point(%{
        merchant_product_id: offer.id,
        observed_at: DateTime.add(@now, -3_600, :second),
        price: "100",
        shipping: "5",
        in_stock: true
      })

    %{
      attributes: attributes,
      brand: brand,
      merchant: merchant,
      offer: offer,
      operator: operator,
      product: product,
      taxon: taxon
    }
  end

  defp delete_fixture(fixture) do
    Repo.delete_all(from merchant in Merchant, where: merchant.id == ^fixture.merchant.id)
    Repo.delete_all(from product in Product, where: product.id == ^fixture.product.id)

    Repo.delete_all(
      from attribute in Attribute, where: attribute.id in ^Enum.map(fixture.attributes, & &1.id)
    )

    Repo.delete_all(from user in User, where: user.id == ^fixture.operator.id)
    Repo.delete_all(from brand in Brand, where: brand.id == ^fixture.brand.id)
    Repo.delete_all(from taxon in Taxon, where: taxon.id == ^fixture.taxon.id)
  end
end
