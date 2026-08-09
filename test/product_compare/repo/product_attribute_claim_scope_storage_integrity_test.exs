defmodule ProductCompare.Repo.ProductAttributeClaimScopeStorageIntegrityTest do
  use ProductCompare.DataCase, async: true

  alias ProductCompare.Fixtures.AccountsFixtures
  alias ProductCompare.Fixtures.SpecsFixtures
  alias ProductCompare.Repo
  alias ProductCompare.Specs
  alias ProductCompareSchemas.Specs.ProductAttributeClaim
  alias ProductCompareSchemas.Specs.ProductAttributeCurrent
  alias ProductCompareSchemas.Specs.SpecificationCorrection

  test "current selections reject a product that differs from their claim" do
    fixture = current_fixture!()
    other_product = SpecsFixtures.product_fixture()

    assert_foreign_key_violation(
      Repo.query(
        "UPDATE product_attribute_current SET product_id = $1 WHERE id = $2",
        [other_product.id, fixture.current.id]
      ),
      "product_attribute_current_claim_scope_fkey"
    )
  end

  test "current selections reject an attribute that differs from their claim" do
    fixture = current_fixture!()
    other_attribute = SpecsFixtures.attribute_fixture()

    assert_foreign_key_violation(
      Repo.query(
        "UPDATE product_attribute_current SET attribute_id = $1 WHERE id = $2",
        [other_attribute.id, fixture.current.id]
      ),
      "product_attribute_current_claim_scope_fkey"
    )
  end

  test "specification corrections reject a product that differs from their claim" do
    fixture = correction_fixture!()
    other_product = SpecsFixtures.product_fixture()

    assert_foreign_key_violation(
      Repo.query(
        "UPDATE specification_corrections SET product_id = $1 WHERE id = $2",
        [other_product.id, fixture.correction.id]
      ),
      "specification_corrections_claim_scope_fkey"
    )
  end

  test "specification corrections reject an attribute that differs from their claim" do
    fixture = correction_fixture!()
    other_attribute = SpecsFixtures.attribute_fixture()

    assert_foreign_key_violation(
      Repo.query(
        "UPDATE specification_corrections SET attribute_id = $1 WHERE id = $2",
        [other_attribute.id, fixture.correction.id]
      ),
      "specification_corrections_claim_scope_fkey"
    )
  end

  test "current selections accept their claim's exact product and attribute scope" do
    fixture = current_fixture!()

    assert {:ok, _result} =
             Repo.query(
               """
               UPDATE product_attribute_current
               SET product_id = $1, attribute_id = $2, claim_id = $3
               WHERE id = $4
               """,
               [fixture.product.id, fixture.attribute.id, fixture.claim.id, fixture.current.id]
             )
  end

  test "specification corrections accept their claim's exact product and attribute scope" do
    fixture = correction_fixture!()

    assert {:ok, _result} =
             Repo.query(
               """
               UPDATE specification_corrections
               SET product_id = $1, attribute_id = $2, claim_id = $3
               WHERE id = $4
               """,
               [
                 fixture.product.id,
                 fixture.attribute.id,
                 fixture.claim.id,
                 fixture.correction.id
               ]
             )
  end

  test "deleting a claim still cascades its current selection" do
    fixture = current_fixture!()

    assert {:ok, _result} =
             Repo.query("DELETE FROM product_attribute_claims WHERE id = $1", [
               fixture.claim.id
             ])

    refute Repo.get(ProductAttributeCurrent, fixture.current.id)
  end

  test "deleting a claim still cascades its specification correction" do
    fixture = correction_fixture!()

    assert {:ok, _result} =
             Repo.query("DELETE FROM product_attribute_claims WHERE id = $1", [
               fixture.claim.id
             ])

    refute Repo.get(SpecificationCorrection, fixture.correction.id)
  end

  defp current_fixture! do
    product = SpecsFixtures.product_fixture()
    attribute = SpecsFixtures.attribute_fixture()
    moderator = AccountsFixtures.operator_fixture()

    {:ok, claim} =
      Specs.propose_claim(product.id, attribute.id, %{value_bool: true}, %{
        source_type: :user,
        created_by: moderator.id
      })

    {:ok, claim} = Specs.accept_claim(claim.id, moderator.id)
    {:ok, current} = Specs.select_current_claim(product.id, attribute.id, claim.id, moderator.id)

    %{product: product, attribute: attribute, claim: claim, current: current}
  end

  defp correction_fixture! do
    product = SpecsFixtures.product_fixture()
    attribute = SpecsFixtures.attribute_fixture()
    submitter = AccountsFixtures.user_fixture()

    {:ok, correction} =
      Specs.propose_correction(
        product.id,
        attribute.id,
        submitter.id,
        %{value_bool: true},
        %{
          reason: "The published specification value is incorrect.",
          explanation: "Checked against the manufacturer specification."
        }
      )

    claim = Repo.get!(ProductAttributeClaim, correction.claim_id)

    %{product: product, attribute: attribute, claim: claim, correction: correction}
  end

  defp assert_foreign_key_violation(result, constraint) do
    assert {:error,
            %Postgrex.Error{postgres: %{code: :foreign_key_violation, constraint: ^constraint}}} =
             result
  end
end
