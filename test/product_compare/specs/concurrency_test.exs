defmodule ProductCompare.Specs.ConcurrencyTest do
  use ProductCompare.DataCase, async: false

  import ProductCompare.DatabaseTestHelpers,
    only: [
      assert_backend_blocked: 1,
      assert_blocked_by: 2,
      hold_row_lock: 3,
      release_row_lock: 1,
      start_unboxed_action: 1
    ]

  alias Ecto.Adapters.SQL.Sandbox
  alias ProductCompare.Catalog
  alias ProductCompare.Fixtures.AccountsFixtures
  alias ProductCompare.Fixtures.SpecsFixtures
  alias ProductCompare.Fixtures.TaxonomyFixtures
  alias ProductCompare.Ingestion.SpecificationObservation
  alias ProductCompare.Repo
  alias ProductCompare.Specs
  alias ProductCompareSchemas.Accounts.User
  alias ProductCompareSchemas.Catalog.Brand
  alias ProductCompareSchemas.Catalog.Product
  alias ProductCompareSchemas.Specs.Attribute
  alias ProductCompareSchemas.Specs.ProductAttributeClaim
  alias ProductCompareSchemas.Specs.ProductAttributeCurrent
  alias ProductCompareSchemas.Specs.Source
  alias ProductCompareSchemas.Specs.SourceArtifact
  alias ProductCompareSchemas.Taxonomy.Taxon

  test "claim moderation cannot overwrite a competing committed decision" do
    fixture = committed_claim_fixture()
    on_exit(fn -> delete_committed_claim_fixture(fixture) end)

    {lock_holder, lock_backend_pid} =
      hold_row_lock(ProductAttributeClaim, fixture.claim.id, fn claim ->
        claim
        |> ProductAttributeClaim.changeset(%{status: :rejected})
        |> Repo.update!()
      end)

    {acceptance, acceptance_backend_pid} =
      start_unboxed_action(fn ->
        Specs.accept_claim(fixture.claim.id, fixture.moderator.id)
      end)

    assert_blocked_by(acceptance_backend_pid, lock_backend_pid)
    release_row_lock(lock_holder)

    assert {:error, :invalid_status_transition} = Task.await(acceptance)
    assert Repo.get!(ProductAttributeClaim, fixture.claim.id).status == :rejected
  end

  test "concurrent eligible imports auto-accept only the claim that creates current truth" do
    fixture = committed_auto_accept_fixture()
    previous_config = Application.get_env(:product_compare, :ingestion_auto_accept_attributes)

    Application.put_env(:product_compare, :ingestion_auto_accept_attributes, %{
      "cj" => [fixture.attribute.code]
    })

    on_exit(fn ->
      if is_nil(previous_config) do
        Application.delete_env(:product_compare, :ingestion_auto_accept_attributes)
      else
        Application.put_env(
          :product_compare,
          :ingestion_auto_accept_attributes,
          previous_config
        )
      end

      delete_committed_auto_accept_fixture(fixture)
    end)

    {lock_holder, lock_backend_pid} =
      hold_row_lock(Product, fixture.product_fixture.product.id, & &1)

    imports =
      fixture.artifacts
      |> Enum.with_index()
      |> Enum.map(fn {artifact, index} ->
        start_unboxed_action(fn ->
          Specs.import_observation(
            fixture.product_fixture.product.id,
            artifact.id,
            "cj",
            %SpecificationObservation{
              attribute_code: fixture.attribute.code,
              data_type: :bool,
              value: index == 0,
              confidence: Decimal.new("0.99")
            }
          )
        end)
      end)

    [{_first_import, first_backend_pid}, {_second_import, second_backend_pid}] = imports
    assert_blocked_by(first_backend_pid, lock_backend_pid)
    assert_backend_blocked(second_backend_pid)
    release_row_lock(lock_holder)

    results = Enum.map(imports, fn {task, _backend_pid} -> Task.await(task) end)
    assert Enum.all?(results, &match?({:ok, %{replayed: false}}, &1))

    claim_ids = Enum.map(results, fn {:ok, %{claim: claim}} -> claim.id end)
    claims = Repo.all(from claim in ProductAttributeClaim, where: claim.id in ^claim_ids)

    assert Enum.count(claims, &(&1.status == :accepted)) == 1
    assert Enum.count(claims, &(&1.status == :proposed)) == 1

    assert %ProductAttributeCurrent{claim_id: current_claim_id} =
             Repo.get_by!(
               ProductAttributeCurrent,
               product_id: fixture.product_fixture.product.id,
               attribute_id: fixture.attribute.id
             )

    assert Repo.get!(ProductAttributeClaim, current_claim_id).status == :accepted
  end

  defp committed_claim_fixture do
    Sandbox.unboxed_run(Repo, fn ->
      moderator = AccountsFixtures.user_fixture()
      product_fixture = committed_product_fixture("claim")

      attribute =
        SpecsFixtures.attribute_fixture(%{
          code: "concurrency-attribute-#{Ecto.UUID.generate()}"
        })

      {:ok, claim} =
        Specs.propose_claim(product_fixture.product.id, attribute.id, %{value_bool: true}, %{
          source_type: :user,
          created_by: moderator.id
        })

      %{
        attribute: attribute,
        claim: claim,
        moderator: moderator,
        product_fixture: product_fixture
      }
    end)
  end

  defp committed_auto_accept_fixture do
    Sandbox.unboxed_run(Repo, fn ->
      product_fixture = committed_product_fixture("auto-accept")

      attribute =
        SpecsFixtures.attribute_fixture(%{
          code: "concurrency-auto-accept-#{Ecto.UUID.generate()}",
          data_type: :bool
        })

      source =
        %Source{}
        |> Source.changeset(%{
          kind: "affiliate_feed",
          provider: "cj",
          name: "Auto accept source #{Ecto.UUID.generate()}",
          domain: "auto-accept-#{Ecto.UUID.generate()}.example"
        })
        |> Repo.insert!()

      artifacts =
        Enum.map(1..2, fn index ->
          %SourceArtifact{}
          |> SourceArtifact.changeset(%{
            source_id: source.id,
            fetched_at: DateTime.add(~U[2026-07-30 12:00:00.000000Z], index, :second),
            url: "https://auto-accept.example/#{Ecto.UUID.generate()}"
          })
          |> Repo.insert!()
        end)

      %{
        artifacts: artifacts,
        attribute: attribute,
        product_fixture: product_fixture,
        source: source
      }
    end)
  end

  defp committed_product_fixture(label) do
    type_taxonomy = TaxonomyFixtures.taxonomy_fixture("type", "Type")

    taxon =
      TaxonomyFixtures.taxon_fixture(%{
        taxonomy_id: type_taxonomy.id,
        code: "#{label}-concurrency-#{Ecto.UUID.generate()}",
        name: "#{label} concurrency"
      })

    {:ok, brand} = Catalog.upsert_brand(%{name: "#{label} concurrency #{Ecto.UUID.generate()}"})

    product =
      SpecsFixtures.product_fixture(%{
        primary_type_taxon: taxon,
        brand_id: brand.id,
        slug: "#{label}-concurrency-#{Ecto.UUID.generate()}"
      })

    %{brand: brand, product: product, taxon: taxon}
  end

  defp delete_committed_claim_fixture(fixture) do
    Sandbox.unboxed_run(Repo, fn ->
      Repo.delete_all(from claim in ProductAttributeClaim, where: claim.id == ^fixture.claim.id)
      Repo.delete_all(from attribute in Attribute, where: attribute.id == ^fixture.attribute.id)
      Repo.delete_all(from user in User, where: user.id == ^fixture.moderator.id)
      delete_committed_product_fixture(fixture.product_fixture)
    end)
  end

  defp delete_committed_auto_accept_fixture(fixture) do
    Sandbox.unboxed_run(Repo, fn ->
      delete_committed_product_fixture(fixture.product_fixture)
      Repo.delete_all(from attribute in Attribute, where: attribute.id == ^fixture.attribute.id)
      Repo.delete_all(from source in Source, where: source.id == ^fixture.source.id)
    end)
  end

  defp delete_committed_product_fixture(fixture) do
    Repo.delete_all(from product in Product, where: product.id == ^fixture.product.id)
    Repo.delete_all(from brand in Brand, where: brand.id == ^fixture.brand.id)
    Repo.delete_all(from taxon in Taxon, where: taxon.id == ^fixture.taxon.id)
  end
end
