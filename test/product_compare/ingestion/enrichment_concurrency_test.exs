defmodule ProductCompare.Ingestion.EnrichmentConcurrencyTest do
  use ProductCompare.DataCase, async: false

  import ProductCompare.DatabaseTestHelpers,
    only: [
      assert_backend_blocked: 1,
      assert_blocked_by: 2,
      database_backend_pid: 0,
      hold_row_lock: 3,
      release_row_lock: 1,
      start_unboxed_action: 1
    ]

  alias Ecto.Adapters.SQL.Sandbox
  alias ProductCompare.Catalog
  alias ProductCompare.Fixtures.SpecsFixtures
  alias ProductCompare.Fixtures.TaxonomyFixtures
  alias ProductCompare.Ingestion.ListingPersistence.Enrichment
  alias ProductCompare.Repo
  alias ProductCompare.Taxonomy
  alias ProductCompareSchemas.Catalog.Brand
  alias ProductCompareSchemas.Catalog.Product
  alias ProductCompareSchemas.Taxonomy.{Taxon, TaxonAlias}

  test "provider enrichment cannot overwrite fields curated before its locked reload" do
    fixture = Sandbox.unboxed_run(Repo, fn -> committed_product_fixture() end)
    on_exit(fn -> delete_committed_product_fixture_unboxed(fixture) end)

    {lock_holder, lock_backend_pid} =
      hold_row_lock(Product, fixture.product.id, fn product ->
        product
        |> Product.changeset(%{
          description: "Curated description",
          model_number: "CURATED-1"
        })
        |> Repo.update!()
      end)

    {enrichment, enrichment_backend_pid} =
      start_unboxed_action(fn ->
        run_enrichment(fixture.product, %{
          description: "Provider description",
          manufacturer_category_path: nil,
          model_number: "PROVIDER-1"
        })
      end)

    assert_blocked_by(enrichment_backend_pid, lock_backend_pid)
    release_row_lock(lock_holder)

    assert {:ok, enriched, %{status: :none}} = Task.await(enrichment)
    assert enriched.description == "Curated description"
    assert enriched.model_number == "CURATED-1"
  end

  test "mapped type cannot overwrite a type curated before its locked reload" do
    fixture = committed_mapping_fixture()
    on_exit(fn -> delete_committed_mapping_fixture(fixture) end)

    {lock_holder, lock_backend_pid} =
      hold_row_lock(Product, fixture.product_fixture.product.id, fn product ->
        product
        |> Product.changeset(%{primary_type_taxon_id: fixture.curated_taxon.id})
        |> Repo.update!()
      end)

    {enrichment, enrichment_backend_pid} =
      start_unboxed_action(fn ->
        run_enrichment(fixture.product_fixture.product, %{
          description: nil,
          manufacturer_category_path: fixture.category_path,
          model_number: nil
        })
      end)

    assert_blocked_by(enrichment_backend_pid, lock_backend_pid)
    release_row_lock(lock_holder)

    assert {:ok, enriched, %{status: :mapped_not_applied}} = Task.await(enrichment)
    assert enriched.primary_type_taxon_id == fixture.curated_taxon.id
  end

  test "mapped type rechecks placeholder semantics after a competing taxon edit" do
    fixture = committed_mapping_fixture()
    on_exit(fn -> delete_committed_mapping_fixture(fixture) end)
    replacement_code = "curated-placeholder-#{Ecto.UUID.generate()}"

    {lock_holder, lock_backend_pid} =
      hold_row_lock(Taxon, fixture.placeholder_taxon.id, fn taxon ->
        taxon
        |> Taxon.changeset(%{code: replacement_code})
        |> Repo.update!()
      end)

    {enrichment, enrichment_backend_pid} =
      start_unboxed_action(fn ->
        run_enrichment(fixture.product_fixture.product, %{
          description: nil,
          manufacturer_category_path: fixture.category_path,
          model_number: nil
        })
      end)

    assert_blocked_by(enrichment_backend_pid, lock_backend_pid)
    release_row_lock(lock_holder)

    assert {:ok, enriched, %{status: :mapped_not_applied}} = Task.await(enrichment)
    assert enriched.primary_type_taxon_id == fixture.placeholder_taxon.id
    assert Repo.get!(Taxon, fixture.placeholder_taxon.id).code == replacement_code
  end

  test "mapped type uses the alias owner committed before its dependent write" do
    fixture = committed_mapping_fixture()
    on_exit(fn -> delete_committed_mapping_fixture(fixture) end)

    {lock_holder, _lock_backend_pid} = hold_mapping_rows(fixture)

    {enrichment, enrichment_backend_pid} =
      start_unboxed_action(fn ->
        run_enrichment(fixture.product_fixture.product, %{
          description: nil,
          manufacturer_category_path: fixture.category_path,
          model_number: nil
        })
      end)

    assert_backend_blocked(enrichment_backend_pid)
    release_mapping_rows(lock_holder)

    assert {:ok, enriched, %{status: :mapped, taxon_id: mapped_taxon_id}} =
             Task.await(enrichment)

    assert mapped_taxon_id == fixture.reassigned_taxon.id
    assert enriched.primary_type_taxon_id == fixture.reassigned_taxon.id
    refute mapped_taxon_id == fixture.mapped_taxon.id
  end

  defp hold_mapping_rows(fixture) do
    parent = self()

    task =
      Task.async(fn ->
        Sandbox.unboxed_run(Repo, fn ->
          Repo.transaction(fn ->
            backend_pid = database_backend_pid()

            alias_record =
              Repo.one!(
                from taxon_alias in TaxonAlias,
                  where: taxon_alias.id == ^fixture.alias_record.id,
                  lock: "FOR UPDATE"
              )

            Repo.one!(
              from product in Product,
                where: product.id == ^fixture.product_fixture.product.id,
                lock: "FOR UPDATE"
            )

            send(parent, {:mapping_rows_held, self(), backend_pid})

            receive do
              :commit_mapping_reassignment ->
                alias_record
                |> TaxonAlias.changeset(%{taxon_id: fixture.reassigned_taxon.id})
                |> Repo.update!()
            after
              5_000 -> flunk("timed out waiting to commit the mapping reassignment")
            end
          end)
        end)
      end)

    assert_receive {:mapping_rows_held, task_pid, backend_pid}
    assert task_pid == task.pid
    {task, backend_pid}
  end

  defp release_mapping_rows(task) do
    send(task.pid, :commit_mapping_reassignment)
    assert {:ok, %TaxonAlias{}} = Task.await(task)
  end

  defp run_enrichment(product, listing) do
    assert {:ok, result} =
             Repo.transaction(fn ->
               Enrichment.enrich_product(product, %{}, listing)
             end)

    result
  end

  defp committed_product_fixture do
    type_taxonomy = TaxonomyFixtures.taxonomy_fixture("type", "Type")

    taxon =
      TaxonomyFixtures.taxon_fixture(%{
        taxonomy_id: type_taxonomy.id,
        code: "enrichment-concurrency-#{Ecto.UUID.generate()}",
        name: "Enrichment Concurrency"
      })

    {:ok, brand} =
      Catalog.upsert_brand(%{name: "Enrichment Concurrency #{Ecto.UUID.generate()}"})

    product =
      SpecsFixtures.product_fixture(%{
        primary_type_taxon: taxon,
        brand_id: brand.id,
        slug: "enrichment-concurrency-#{Ecto.UUID.generate()}"
      })

    %{brand: brand, product: product, taxon: taxon}
  end

  defp committed_mapping_fixture do
    Sandbox.unboxed_run(Repo, fn ->
      product_fixture = committed_product_fixture()
      taxonomy_id = product_fixture.taxon.taxonomy_id

      {placeholder_taxon, placeholder_created?} =
        case Repo.get_by(Taxon, taxonomy_id: taxonomy_id, code: "ingested-product") do
          nil ->
            {:ok, taxon} =
              Taxonomy.create_taxon(%{
                taxonomy_id: taxonomy_id,
                code: "ingested-product",
                name: "Ingested Product"
              })

            {taxon, true}

          taxon ->
            {taxon, false}
        end

      mapped_taxon = taxon_fixture(taxonomy_id, "mapped")
      reassigned_taxon = taxon_fixture(taxonomy_id, "reassigned")
      curated_taxon = taxon_fixture(taxonomy_id, "curated")

      product =
        product_fixture.product
        |> Product.changeset(%{primary_type_taxon_id: placeholder_taxon.id})
        |> Repo.update!()

      category_path = ["Concurrency", Ecto.UUID.generate()]
      {:ok, alias_record} = Taxonomy.upsert_taxon_alias(mapped_taxon.id, category_path)

      %{
        alias_record: alias_record,
        category_path: category_path,
        curated_taxon: curated_taxon,
        mapped_taxon: mapped_taxon,
        placeholder_created?: placeholder_created?,
        placeholder_taxon: placeholder_taxon,
        product_fixture: %{product_fixture | product: product},
        reassigned_taxon: reassigned_taxon
      }
    end)
  end

  defp taxon_fixture(taxonomy_id, label) do
    TaxonomyFixtures.taxon_fixture(%{
      taxonomy_id: taxonomy_id,
      code: "enrichment-#{label}-#{Ecto.UUID.generate()}",
      name: "Enrichment #{label}"
    })
  end

  defp delete_committed_product_fixture(fixture) do
    Repo.delete_all(from product in Product, where: product.id == ^fixture.product.id)
    Repo.delete_all(from brand in Brand, where: brand.id == ^fixture.brand.id)
    Repo.delete_all(from taxon in Taxon, where: taxon.id == ^fixture.taxon.id)
  end

  defp delete_committed_product_fixture_unboxed(fixture) do
    Sandbox.unboxed_run(Repo, fn -> delete_committed_product_fixture(fixture) end)
  end

  defp delete_committed_mapping_fixture(fixture) do
    Sandbox.unboxed_run(Repo, fn ->
      delete_committed_product_fixture(fixture.product_fixture)

      Repo.delete_all(
        from taxon in Taxon,
          where:
            taxon.id in ^[
              fixture.curated_taxon.id,
              fixture.mapped_taxon.id,
              fixture.reassigned_taxon.id
            ]
      )

      if fixture.placeholder_created? do
        Repo.delete_all(from taxon in Taxon, where: taxon.id == ^fixture.placeholder_taxon.id)
      else
        fixture.placeholder_taxon
        |> Taxon.changeset(%{code: "ingested-product"})
        |> Repo.update!()
      end
    end)
  end
end
