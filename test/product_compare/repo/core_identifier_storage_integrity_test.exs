defmodule ProductCompare.Repo.CoreIdentifierStorageIntegrityTest do
  use ProductCompare.DataCase, async: true

  alias ProductCompare.Fixtures.AccountsFixtures
  alias ProductCompare.Fixtures.SpecsFixtures
  alias ProductCompare.Fixtures.TaxonomyFixtures
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Affiliate.AffiliateNetwork
  alias ProductCompareSchemas.Catalog.ComparisonSnapshot
  alias ProductCompareSchemas.Catalog.Product
  alias ProductCompareSchemas.Catalog.ProductSlugAlias
  alias ProductCompareSchemas.Pricing.Merchant
  alias ProductCompareSchemas.Taxonomy.Taxon

  test "changesets reject line-terminated identifiers instead of accepting prefix matches" do
    refute Product.changeset(%Product{}, %{name: "North Main", slug: "north-main\n"}).valid?

    refute ProductSlugAlias.changeset(%ProductSlugAlias{}, %{
             slug: "north-main\n",
             product_id: 1
           }).valid?

    refute Merchant.changeset(%Merchant{}, %{
             name: "North Main",
             domain: "north-main.example",
             slug: "north-main\n"
           }).valid?

    refute Taxon.changeset(%Taxon{}, %{
             taxonomy_id: 1,
             code: "north-main",
             name: "North Main",
             seo_slug: "north-main\n"
           }).valid?

    token_with_trailing_newline = String.duplicate("a", 42) <> "\n"

    refute ComparisonSnapshot.publish_changeset(%ComparisonSnapshot{}, %{
             public_token: token_with_trailing_newline,
             user_id: 1,
             version: 1,
             captured_at: DateTime.utc_now()
           }).valid?
  end

  test "affiliate network input normalization remains the changeset boundary contract" do
    changeset =
      AffiliateNetwork.changeset(%AffiliateNetwork{}, %{
        code: "Impact Network\n",
        name: "Impact Network"
      })

    assert changeset.valid?
    assert Ecto.Changeset.get_change(changeset, :code) == "impact_network"
  end

  test "products reject malformed stored slugs through the named constraint" do
    product = SpecsFixtures.product_fixture()

    assert_check_violation(
      Repo.query("UPDATE products SET slug = $1 WHERE id = $2", ["invalid slug", product.id]),
      "products_slug_format_check"
    )
  end

  test "product slug aliases reject malformed stored slugs through the named constraint" do
    product = SpecsFixtures.product_fixture()

    assert_check_violation(
      Repo.query(
        """
        INSERT INTO product_slug_aliases (slug, product_id, inserted_at)
        VALUES ($1, $2, now())
        """,
        ["invalid alias", product.id]
      ),
      "product_slug_aliases_slug_format_check"
    )
  end

  test "product slug reservations reject malformed stored slugs through the named constraint" do
    product = SpecsFixtures.product_fixture()

    assert_check_violation(
      Repo.query(
        """
        INSERT INTO product_slug_reservations (slug, product_id, inserted_at)
        VALUES ($1, $2, now())
        """,
        ["invalid reservation", product.id]
      ),
      "product_slug_reservations_slug_format_check"
    )
  end

  test "merchants reject malformed stored slugs through the named constraint" do
    merchant =
      %Merchant{}
      |> Merchant.changeset(%{
        name: "Merchant #{System.unique_integer([:positive])}",
        domain: "merchant-#{System.unique_integer([:positive])}.example",
        slug: "valid-merchant"
      })
      |> Repo.insert!()

    assert_check_violation(
      Repo.query("UPDATE merchants SET slug = $1 WHERE id = $2", ["invalid slug", merchant.id]),
      "merchants_slug_format_check"
    )
  end

  test "affiliate networks reject malformed stored codes through the named constraint" do
    suffix = System.unique_integer([:positive])

    network =
      %AffiliateNetwork{}
      |> AffiliateNetwork.changeset(%{code: "network_#{suffix}", name: "Network #{suffix}"})
      |> Repo.insert!()

    assert_check_violation(
      Repo.query("UPDATE affiliate_networks SET code = $1 WHERE id = $2", [
        "invalid-code",
        network.id
      ]),
      "affiliate_networks_code_format_check"
    )
  end

  test "taxons reject malformed stored SEO slugs through the named constraint" do
    taxon = TaxonomyFixtures.taxon_fixture(%{})

    assert_check_violation(
      Repo.query("UPDATE taxons SET seo_slug = $1 WHERE id = $2", ["invalid slug", taxon.id]),
      "taxons_seo_slug_format_check"
    )
  end

  test "comparison snapshots retain their existing database token rejection" do
    user = AccountsFixtures.user_fixture()

    assert_check_violation(
      Repo.query(
        """
        INSERT INTO comparison_snapshots (
          public_token, user_id, version, captured_at, inserted_at
        )
        VALUES ($1, $2, 1, now(), now())
        """,
        [String.duplicate("a", 42) <> "\n", user.id]
      ),
      "comparison_snapshots_public_token_format"
    )
  end

  test "ASCII identifier checks use deterministic C collation" do
    for {table, constraint} <- [
          {"products", "products_slug_format_check"},
          {"product_slug_aliases", "product_slug_aliases_slug_format_check"},
          {"product_slug_reservations", "product_slug_reservations_slug_format_check"},
          {"merchants", "merchants_slug_format_check"},
          {"affiliate_networks", "affiliate_networks_code_format_check"},
          {"taxons", "taxons_seo_slug_format_check"}
        ] do
      assert constraint_definition(table, constraint) =~ ~s(COLLATE "C")
    end
  end

  test "storage accepts exact identifiers and nullable taxonomy SEO slugs" do
    product = SpecsFixtures.product_fixture()
    suffix = System.unique_integer([:positive])

    assert {:ok, _result} =
             Repo.query("UPDATE products SET slug = $1 WHERE id = $2", [
               "valid-product-#{suffix}",
               product.id
             ])

    assert {:ok, _result} =
             Repo.query(
               """
               INSERT INTO product_slug_aliases (slug, product_id, inserted_at)
               VALUES ($1, $2, now())
               """,
               ["valid-alias-#{suffix}", product.id]
             )

    assert {:ok, %{rows: [[true]]}} =
             Repo.query(
               """
               SELECT EXISTS (
                 SELECT 1
                 FROM product_slug_reservations
                 WHERE slug = $1 AND product_id = $2
               )
               """,
               ["valid-alias-#{suffix}", product.id]
             )

    assert {:ok, _result} =
             Repo.query(
               """
               INSERT INTO product_slug_reservations (slug, product_id, inserted_at)
               VALUES ($1, $2, now())
               """,
               ["valid-reservation-#{suffix}", product.id]
             )

    assert {:ok, _result} =
             Repo.query(
               """
               INSERT INTO merchants (name, domain, slug, inserted_at, updated_at)
               VALUES ($1, $2, $3, now(), now())
               """,
               [
                 "Valid Merchant #{suffix}",
                 "valid-merchant-#{suffix}.example",
                 "valid-merchant-#{suffix}"
               ]
             )

    assert {:ok, _result} =
             Repo.query(
               """
               INSERT INTO affiliate_networks (code, name, inserted_at, updated_at)
               VALUES ($1, $2, now(), now())
               """,
               ["valid_network_#{suffix}", "Valid Network #{suffix}"]
             )

    taxon = TaxonomyFixtures.taxon_fixture(%{})

    assert {:ok, _result} =
             Repo.query("UPDATE taxons SET seo_slug = NULL WHERE id = $1", [taxon.id])

    user = AccountsFixtures.user_fixture()

    assert {:ok, _result} =
             Repo.query(
               """
               INSERT INTO comparison_snapshots (
                 public_token, user_id, version, captured_at, inserted_at
               )
               VALUES ($1, $2, 1, now(), now())
               """,
               [String.duplicate("a", 43), user.id]
             )
  end

  defp assert_check_violation(result, constraint) do
    assert {:error, %Postgrex.Error{postgres: %{code: :check_violation, constraint: ^constraint}}} =
             result
  end

  defp constraint_definition(table, constraint) do
    %{rows: [[definition]]} =
      Repo.query!(
        """
        SELECT pg_get_constraintdef(constraint_record.oid)
        FROM pg_constraint AS constraint_record
        JOIN pg_class AS table_record
          ON table_record.oid = constraint_record.conrelid
        JOIN pg_namespace AS namespace_record
          ON namespace_record.oid = table_record.relnamespace
        WHERE namespace_record.nspname = current_schema()
          AND table_record.relname = $1
          AND constraint_record.conname = $2
        """,
        [table, constraint]
      )

    definition
  end
end
