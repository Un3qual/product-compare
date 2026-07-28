defmodule ProductCompare.Catalog.SearchDocumentsTest do
  use ProductCompare.DataCase, async: false

  alias ProductCompare.Catalog
  alias ProductCompare.Catalog.SearchDocuments
  alias ProductCompare.Fixtures.SpecsFixtures
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Catalog.{Brand, Product, ProductSlugAlias}

  test "create persists a document that matches product, brand, slug, model, and description terms" do
    {:ok, brand} = Catalog.create_brand(%{name: "Asterion Instruments"})

    product =
      SpecsFixtures.product_fixture(%{
        brand_id: brand.id,
        name: "Helios Drafting Keyboard",
        model_number: "RX-7900",
        slug: "helios-drafting-keyboard",
        description: "A compact mechanical keyboard for studio work"
      })

    assert document_matches?(product.id, "Asterion Helios RX-7900 drafting mechanical keyboard")
    assert document_matches?(product.id, "RX-7900")
    assert document_matches?(product.id, "keyboards")
  end

  test "update refreshes the document and preserves the prior slug alias" do
    product =
      SpecsFixtures.product_fixture(%{
        name: "Atlas Keyboard",
        model_number: "RX-7900",
        slug: "atlas-keyboard",
        description: "A mechanical keyboard"
      })

    assert {:ok, updated} =
             Catalog.update_product(product, %{
               name: "Nova Trackball",
               model_number: "QX-9000",
               slug: "nova-trackball",
               description: "An ergonomic pointing device"
             })

    assert document_matches?(updated.id, "Nova QX-9000 trackball ergonomic")
    refute document_matches?(updated.id, "Atlas")
    refute document_matches?(updated.id, "RX-7900")
    refute document_matches?(updated.id, "keyboard")

    assert %ProductSlugAlias{product_id: product_id, slug: "atlas-keyboard"} =
             Repo.get_by(ProductSlugAlias, product_id: product.id, slug: product.slug)

    assert product_id == product.id
  end

  test "brand reassignment refreshes the product document" do
    {:ok, former_brand} = Catalog.create_brand(%{name: "Former Beacon"})
    {:ok, current_brand} = Catalog.create_brand(%{name: "Current Meridian"})

    product =
      SpecsFixtures.product_fixture(%{brand_id: former_brand.id, name: "Reference Display"})

    assert {:ok, reassigned} = Catalog.update_product(product, %{brand_id: current_brand.id})

    assert document_matches?(reassigned.id, "Current Meridian")
    refute document_matches?(reassigned.id, "Former Beacon")
  end

  test "refresh_brand updates every attached product after a brand rename" do
    {:ok, brand} = Catalog.create_brand(%{name: "Original Foundry"})
    first = SpecsFixtures.product_fixture(%{brand_id: brand.id, name: "Foundry First"})
    second = SpecsFixtures.product_fixture(%{brand_id: brand.id, name: "Foundry Second"})

    assert {:ok, 2} =
             Repo.transaction(fn ->
               brand
               |> Brand.changeset(%{name: "Renamed Foundry"})
               |> Repo.update!()

               {:ok, count} = SearchDocuments.refresh_brand(brand.id)
               count
             end)

    assert document_matches?(first.id, "Renamed Foundry")
    assert document_matches?(second.id, "Renamed Foundry")
    refute document_matches?(first.id, "Original Foundry")
    refute document_matches?(second.id, "Original Foundry")
  end

  test "refresh_products removes a deleted brand from every former product document" do
    {:ok, brand} = Catalog.create_brand(%{name: "Retired Beacon"})
    first = SpecsFixtures.product_fixture(%{brand_id: brand.id, name: "Retired First"})
    second = SpecsFixtures.product_fixture(%{brand_id: brand.id, name: "Retired Second"})
    product_ids = [first.id, second.id]

    assert {:ok, 2} =
             Repo.transaction(fn ->
               Repo.delete!(brand)
               {:ok, count} = SearchDocuments.refresh_products(product_ids)
               count
             end)

    refute document_matches?(first.id, "Retired Beacon")
    refute document_matches?(second.id, "Retired Beacon")
  end

  test "rebuild repairs a corrupt persisted document" do
    product =
      SpecsFixtures.product_fixture(%{
        name: "Rebuild Keyboard",
        model_number: "RX-7900",
        description: "A mechanical keyboard for rebuild verification"
      })

    Repo.query!("UPDATE products SET search_document = ''::tsvector WHERE id = $1", [product.id])
    refute document_matches?(product.id, "Rebuild RX-7900 keyboards")

    assert {:ok, count} = SearchDocuments.rebuild()
    assert count >= 1
    assert document_matches?(product.id, "Rebuild RX-7900 keyboards")
  end

  test "rebuild uses its dedicated maintenance timeout" do
    previous_config = Application.get_env(:product_compare, SearchDocuments)

    on_exit(fn ->
      if previous_config do
        Application.put_env(:product_compare, SearchDocuments, previous_config)
      else
        Application.delete_env(:product_compare, SearchDocuments)
      end
    end)

    Application.put_env(:product_compare, SearchDocuments, rebuild_timeout: :invalid)

    assert_raise ArithmeticError, fn ->
      SearchDocuments.rebuild()
    end
  end

  test "create rolls back the product when document refresh fails" do
    existing = SpecsFixtures.product_fixture(%{name: "Rollback Reference"})
    name = "Rollback Create #{System.unique_integer([:positive])}"
    slug = "rollback-create-#{System.unique_integer([:positive])}"

    install_failing_document_builder!()

    assert {:error, _reason} =
             Catalog.create_product(%{
               brand_id: existing.brand_id,
               primary_type_taxon_id: existing.primary_type_taxon_id,
               name: name,
               slug: slug
             })

    refute Repo.exists?(from product in Product, where: product.slug == ^slug)
  end

  test "update rolls back product fields and slug aliases when document refresh fails" do
    product =
      SpecsFixtures.product_fixture(%{
        name: "Rollback Original",
        model_number: "RX-7900",
        slug: "rollback-original",
        description: "Original keyboard description"
      })

    install_failing_document_builder!()

    assert {:error, _reason} =
             Catalog.update_product(product, %{
               name: "Rollback Changed",
               model_number: "QX-9000",
               slug: "rollback-changed",
               description: "Changed trackball description"
             })

    persisted = Repo.get!(Product, product.id)
    assert persisted.name == product.name
    assert persisted.model_number == product.model_number
    assert persisted.slug == product.slug
    assert persisted.description == product.description
    assert Repo.get_by(ProductSlugAlias, product_id: product.id, slug: product.slug) == nil
  end

  defp document_matches?(product_id, query) do
    %Postgrex.Result{rows: [[matches?]]} =
      Repo.query!(
        """
        SELECT search_document @@ (
          websearch_to_tsquery('simple', $2) ||
          websearch_to_tsquery('english', $2)
        )
        FROM products
        WHERE id = $1
        """,
        [product_id, query]
      )

    matches?
  end

  defp install_failing_document_builder! do
    Repo.query!("""
    CREATE OR REPLACE FUNCTION catalog_search_document(
      product_name text,
      product_slug text,
      product_model_number text,
      product_description text,
      brand_name text
    ) RETURNS tsvector
    LANGUAGE plpgsql
    AS $$
    BEGIN
      RAISE EXCEPTION 'forced search document failure';
    END
    $$
    """)
  end
end
