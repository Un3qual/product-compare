defmodule ProductCompare.Specs.CorrectionsTest do
  use ProductCompare.DataCase, async: true

  alias ProductCompare.Fixtures.AccountsFixtures
  alias ProductCompare.Fixtures.SpecsFixtures
  alias ProductCompare.Repo
  alias ProductCompare.Specs
  alias ProductCompareSchemas.Specs.ProductAttributeClaim
  alias ProductCompareSchemas.Specs.ProductAttributeCurrent
  alias ProductCompareSchemas.Specs.SpecificationCorrection

  describe "propose_correction/5" do
    test "returns the claim insert action without persisting a claim or correction" do
      user = AccountsFixtures.user_fixture()
      product = SpecsFixtures.product_fixture()
      attribute = SpecsFixtures.attribute_fixture(%{data_type: :text})

      assert {:error, %Ecto.Changeset{action: :insert}} =
               Specs.propose_correction(
                 product.id,
                 attribute.id,
                 user.id,
                 %{value_text: %{invalid: "value"}},
                 %{
                   reason: "The published specification is incorrect.",
                   explanation: "Checked against the product label."
                 }
               )

      assert Repo.aggregate(ProductAttributeClaim, :count, :id) == 0
      assert Repo.aggregate(SpecificationCorrection, :count, :id) == 0
    end

    test "creates a pending typed user claim without changing current truth" do
      submitter = AccountsFixtures.user_fixture()
      moderator = AccountsFixtures.operator_fixture()
      product = SpecsFixtures.product_fixture()
      attribute = SpecsFixtures.attribute_fixture(%{data_type: :text})
      current_claim = put_current!(product, attribute, %{value_text: "LCD"}, moderator)

      assert {:ok, correction} =
               Specs.propose_correction(
                 product.id,
                 attribute.id,
                 submitter.id,
                 %{value_text: "OLED"},
                 %{
                   reason: "The manufacturer specification lists OLED.",
                   source_url: "https://manufacturer.example/model/specifications"
                 }
               )

      correction = Repo.preload(correction, :claim)
      assert correction.status == :pending
      assert correction.submitted_by == submitter.id
      assert correction.product_id == product.id
      assert correction.attribute_id == attribute.id
      assert correction.claim.status == :proposed
      assert correction.claim.source_type == :user
      assert correction.claim.created_by == submitter.id
      assert correction.claim.supersedes_claim_id == current_claim.id
      assert correction.claim.value_text == "OLED"

      assert Repo.get_by!(ProductAttributeCurrent,
               product_id: product.id,
               attribute_id: attribute.id
             ).claim_id == current_claim.id
    end

    test "requires a bounded reason and source URL or explanation" do
      user = AccountsFixtures.user_fixture()
      product = SpecsFixtures.product_fixture()
      attribute = SpecsFixtures.attribute_fixture(%{data_type: :bool})

      assert {:error, %Ecto.Changeset{} = missing_evidence} =
               Specs.propose_correction(
                 product.id,
                 attribute.id,
                 user.id,
                 %{value_bool: true},
                 %{reason: "This value is incorrect."}
               )

      assert "provide a source URL or explanation" in errors_on(missing_evidence).base

      assert {:error, %Ecto.Changeset{} = unsafe_url} =
               Specs.propose_correction(
                 product.id,
                 attribute.id,
                 user.id,
                 %{value_bool: true},
                 %{reason: "This value is incorrect.", source_url: "javascript:alert(1)"}
               )

      assert "must be an HTTP(S) URL" in errors_on(unsafe_url).source_url
      assert Repo.aggregate(ProductAttributeClaim, :count, :id) == 0
    end

    test "prevents more than one pending correction per user and attribute" do
      user = AccountsFixtures.user_fixture()
      product = SpecsFixtures.product_fixture()
      attribute = SpecsFixtures.attribute_fixture(%{data_type: :text})

      attrs = %{reason: "The published specification differs.", explanation: "Retail box."}

      assert {:ok, _correction} =
               Specs.propose_correction(
                 product.id,
                 attribute.id,
                 user.id,
                 %{value_text: "First"},
                 attrs
               )

      assert {:error, %Ecto.Changeset{} = changeset} =
               Specs.propose_correction(
                 product.id,
                 attribute.id,
                 user.id,
                 %{value_text: "Second"},
                 attrs
               )

      assert "already has a pending correction" in errors_on(changeset).attribute_id
    end
  end

  describe "moderate_correction/4" do
    test "accepts and selects the replacement atomically, superseding prior truth" do
      user = AccountsFixtures.user_fixture()
      operator = AccountsFixtures.operator_fixture()
      product = SpecsFixtures.product_fixture()
      attribute = SpecsFixtures.attribute_fixture(%{data_type: :text})
      old_claim = put_current!(product, attribute, %{value_text: "LCD"}, operator)

      {:ok, correction} =
        Specs.propose_correction(
          product.id,
          attribute.id,
          user.id,
          %{value_text: "OLED"},
          %{reason: "Manufacturer says OLED.", explanation: "Printed specification sheet."}
        )

      assert {:ok, accepted} =
               Specs.moderate_correction(correction.id, operator.id, :accepted, %{
                 moderation_note: "Confirmed against source."
               })

      assert accepted.status == :accepted
      assert accepted.reviewed_by == operator.id
      assert accepted.reviewed_at
      assert accepted.moderation_note == "Confirmed against source."
      assert Repo.get!(ProductAttributeClaim, accepted.claim_id).status == :accepted
      assert Repo.get!(ProductAttributeClaim, old_claim.id).status == :superseded

      assert Repo.get_by!(ProductAttributeCurrent,
               product_id: product.id,
               attribute_id: attribute.id
             ).claim_id == accepted.claim_id

      assert {:ok, replayed} =
               Specs.moderate_correction(correction.id, operator.id, :accepted, %{})

      assert replayed.id == accepted.id

      assert {:error, :invalid_status_transition} =
               Specs.moderate_correction(correction.id, operator.id, :rejected, %{})
    end

    test "rejects without changing current truth and refuses stale acceptance" do
      user = AccountsFixtures.user_fixture()
      operator = AccountsFixtures.operator_fixture()
      product = SpecsFixtures.product_fixture()
      attribute = SpecsFixtures.attribute_fixture(%{data_type: :text})
      original = put_current!(product, attribute, %{value_text: "LCD"}, operator)

      {:ok, rejected_correction} =
        Specs.propose_correction(
          product.id,
          attribute.id,
          user.id,
          %{value_text: "OLED"},
          %{reason: "I believe this is OLED.", explanation: "Observed the product."}
        )

      assert {:ok, rejected} =
               Specs.moderate_correction(rejected_correction.id, operator.id, :rejected, %{})

      assert rejected.status == :rejected
      assert Repo.get!(ProductAttributeClaim, rejected.claim_id).status == :rejected
      assert current_claim_id(product, attribute) == original.id

      {:ok, stale_correction} =
        Specs.propose_correction(
          product.id,
          attribute.id,
          user.id,
          %{value_text: "Mini LED"},
          %{reason: "A newer source says Mini LED.", explanation: "Support response."}
        )

      newer = put_current!(product, attribute, %{value_text: "QLED"}, operator)

      assert {:error, :stale_current_claim} =
               Specs.moderate_correction(stale_correction.id, operator.id, :accepted, %{})

      assert Repo.get!(ProductAttributeClaim, stale_correction.claim_id).status == :proposed
      assert current_claim_id(product, attribute) == newer.id
    end
  end

  describe "correction reads" do
    test "scopes owner and moderation queries and returns public aggregate counts" do
      first_user = AccountsFixtures.user_fixture()
      second_user = AccountsFixtures.user_fixture()
      operator = AccountsFixtures.operator_fixture()
      product = SpecsFixtures.product_fixture()
      attribute = SpecsFixtures.attribute_fixture(%{data_type: :bool})

      {:ok, first} = propose_bool(product, attribute, first_user, true)
      {:ok, second} = propose_bool(product, attribute, second_user, false)
      assert {:ok, _accepted} = Specs.moderate_correction(first.id, operator.id, :accepted, %{})

      assert [owned] = Repo.all(Specs.list_user_corrections_query(first_user.id))
      assert owned.id == first.id

      assert [pending] = Repo.all(Specs.list_correction_moderation_query(status: :pending))
      assert pending.id == second.id

      assert Specs.correction_counts_for_product(product.id) == %{
               attribute.id => %{pending: 1, accepted: 1}
             }
    end
  end

  defp propose_bool(product, attribute, user, value) do
    Specs.propose_correction(
      product.id,
      attribute.id,
      user.id,
      %{value_bool: value},
      %{reason: "The current boolean value is incorrect.", explanation: "Checked product."}
    )
  end

  defp put_current!(product, attribute, value, operator) do
    assert {:ok, claim} =
             Specs.propose_claim(product.id, attribute.id, value, %{
               source_type: :user,
               created_by: operator.id
             })

    assert {:ok, claim} = Specs.accept_claim(claim.id, operator.id)

    assert {:ok, _current} =
             Specs.select_current_claim(product.id, attribute.id, claim.id, operator.id)

    claim
  end

  defp current_claim_id(product, attribute) do
    Repo.get_by!(ProductAttributeCurrent,
      product_id: product.id,
      attribute_id: attribute.id
    ).claim_id
  end
end
