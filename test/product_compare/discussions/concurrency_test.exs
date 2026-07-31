defmodule ProductCompare.Discussions.ConcurrencyTest do
  use ProductCompare.DataCase, async: false

  import ProductCompare.DatabaseTestHelpers,
    only: [
      assert_some_backend_blocked_by: 1,
      hold_row_lock: 3,
      release_row_lock: 1,
      start_unboxed_action: 1
    ]

  alias Ecto.Adapters.SQL.Sandbox
  alias ProductCompare.Catalog
  alias ProductCompare.Discussions
  alias ProductCompare.Fixtures.AccountsFixtures
  alias ProductCompare.Fixtures.SpecsFixtures
  alias ProductCompare.Fixtures.TaxonomyFixtures
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Accounts.User
  alias ProductCompareSchemas.Catalog.Brand
  alias ProductCompareSchemas.Catalog.Product
  alias ProductCompareSchemas.Discussions.ProductReview
  alias ProductCompareSchemas.Taxonomy.Taxon

  test "moderation rechecks operator access after a competing revocation" do
    fixture = committed_moderation_fixture()
    on_exit(fn -> delete_committed_moderation_fixture(fixture) end)

    {lock_holder, lock_backend_pid} =
      hold_row_lock(User, fixture.operator.id, fn operator ->
        operator
        |> User.operator_access_changeset(false)
        |> Repo.update!()
      end)

    {moderation, _moderation_backend_pid} =
      start_unboxed_action(fn ->
        Discussions.moderate(
          fixture.operator.id,
          :review,
          fixture.review.entropy_id,
          :published
        )
      end)

    assert_some_backend_blocked_by(lock_backend_pid)
    release_row_lock(lock_holder)

    assert {:error, :forbidden} = Task.await(moderation)
    assert Repo.get!(ProductReview, fixture.review.id).moderation_status == :pending
  end

  defp committed_moderation_fixture do
    Sandbox.unboxed_run(Repo, fn ->
      operator = AccountsFixtures.operator_fixture()
      author = AccountsFixtures.user_fixture()
      product_fixture = committed_product_fixture()

      {:ok, review} =
        Discussions.create_review(%{
          user_id: author.id,
          product_id: product_fixture.product.id,
          rating: 4,
          title: "Concurrent moderation"
        })

      %{
        author: author,
        operator: operator,
        product_fixture: product_fixture,
        review: Repo.get!(ProductReview, review.id)
      }
    end)
  end

  defp committed_product_fixture do
    type_taxonomy = TaxonomyFixtures.taxonomy_fixture("type", "Type")

    taxon =
      TaxonomyFixtures.taxon_fixture(%{
        taxonomy_id: type_taxonomy.id,
        code: "discussion-concurrency-#{Ecto.UUID.generate()}",
        name: "Discussion Concurrency"
      })

    {:ok, brand} =
      Catalog.upsert_brand(%{name: "Discussion Concurrency #{Ecto.UUID.generate()}"})

    product =
      SpecsFixtures.product_fixture(%{
        primary_type_taxon: taxon,
        brand_id: brand.id,
        slug: "discussion-concurrency-#{Ecto.UUID.generate()}"
      })

    %{brand: brand, product: product, taxon: taxon}
  end

  defp delete_committed_moderation_fixture(fixture) do
    Sandbox.unboxed_run(Repo, fn ->
      Repo.delete_all(from review in ProductReview, where: review.id == ^fixture.review.id)

      Repo.delete_all(
        from user in User,
          where: user.id in ^[fixture.author.id, fixture.operator.id]
      )

      Repo.delete_all(
        from product in Product, where: product.id == ^fixture.product_fixture.product.id
      )

      Repo.delete_all(from brand in Brand, where: brand.id == ^fixture.product_fixture.brand.id)
      Repo.delete_all(from taxon in Taxon, where: taxon.id == ^fixture.product_fixture.taxon.id)
    end)
  end
end
