defmodule ProductCompare.Discussions.ProductReviewImmutabilityTest do
  use ProductCompare.DataCase, async: true

  alias ProductCompare.Discussions
  alias ProductCompare.Fixtures.AccountsFixtures
  alias ProductCompare.Fixtures.SpecsFixtures
  alias ProductCompare.Pricing
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Discussions.ProductReview

  test "update_review/2 ignores owner and product identity while updating review content" do
    user = AccountsFixtures.user_fixture()
    other_user = AccountsFixtures.user_fixture()
    product = SpecsFixtures.product_fixture(%{slug: "review-identity-product"})
    other_product = SpecsFixtures.product_fixture(%{slug: "review-identity-other-product"})

    merchant = merchant_fixture()
    merchant_product = merchant_product_fixture(merchant, product)
    other_merchant_product = merchant_product_fixture(merchant, other_product)

    assert {:ok, review} =
             Discussions.create_review(%{
               product_id: product.id,
               user_id: user.id,
               merchant_product_id: merchant_product.id,
               rating: 3,
               title: "Original"
             })

    assert {:ok, updated_review} =
             Discussions.update_review(review, %{
               product_id: other_product.id,
               user_id: other_user.id,
               merchant_product_id: other_merchant_product.id,
               rating: 5,
               title: "Updated"
             })

    assert updated_review.product_id == product.id
    assert updated_review.user_id == user.id
    assert updated_review.merchant_product_id == merchant_product.id
    assert updated_review.rating == 5
    assert updated_review.title == "Updated"
  end

  test "update_review/2 reloads persisted identity before deriving verified purchase" do
    user = AccountsFixtures.user_fixture()
    product = SpecsFixtures.product_fixture(%{slug: "persisted-review-identity-product"})
    forged_product = SpecsFixtures.product_fixture(%{slug: "forged-review-identity-product"})
    merchant = merchant_fixture()
    forged_merchant_product = merchant_product_fixture(merchant, forged_product)

    assert {:ok, review} =
             Discussions.create_review(%{
               product_id: product.id,
               user_id: user.id,
               rating: 2,
               title: "Persisted title",
               body_md: "Persisted body"
             })

    forged_review = %{
      review
      | product_id: forged_product.id,
        merchant_product_id: forged_merchant_product.id,
        rating: 1,
        title: "Forged stale title",
        body_md: "Forged stale body"
    }

    assert {:ok, updated_review} = Discussions.update_review(forged_review, %{rating: 4})

    assert updated_review.product_id == product.id
    assert updated_review.merchant_product_id == nil
    assert updated_review.rating == 4
    assert updated_review.title == "Persisted title"
    assert updated_review.body_md == "Persisted body"
    assert updated_review.verified_purchase == false

    persisted_review = Repo.get!(ProductReview, review.id)

    assert persisted_review.product_id == product.id
    assert persisted_review.merchant_product_id == nil
    assert persisted_review.rating == 4
    assert persisted_review.title == "Persisted title"
    assert persisted_review.body_md == "Persisted body"
    assert persisted_review.verified_purchase == false
  end

  defp merchant_fixture do
    suffix = System.unique_integer([:positive])

    {:ok, merchant} =
      Pricing.upsert_merchant(%{
        name: "Review merchant #{suffix}",
        domain: "review-merchant-#{suffix}.example.com"
      })

    merchant
  end

  defp merchant_product_fixture(merchant, product) do
    suffix = System.unique_integer([:positive])

    {:ok, merchant_product} =
      Pricing.upsert_merchant_product(%{
        merchant_id: merchant.id,
        product_id: product.id,
        url: "https://review-merchant.example.com/products/#{suffix}",
        currency: "USD",
        external_sku: "review-sku-#{suffix}",
        is_active: true
      })

    merchant_product
  end
end
