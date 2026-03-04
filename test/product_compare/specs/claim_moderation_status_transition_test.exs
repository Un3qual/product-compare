defmodule ProductCompare.Specs.ClaimModerationStatusTransitionTest do
  use ProductCompare.DataCase, async: true

  alias ProductCompare.Fixtures.AccountsFixtures
  alias ProductCompare.Fixtures.SpecsFixtures
  alias ProductCompare.Repo
  alias ProductCompare.Specs
  alias ProductCompareSchemas.Specs.ProductAttributeClaim

  describe "claim moderation status transitions" do
    test "accept_claim/2 transitions a proposed claim to accepted" do
      moderator = AccountsFixtures.user_fixture()
      claim = proposed_claim_fixture(moderator.id)

      assert {:ok, accepted_claim} = Specs.accept_claim(claim.id, moderator.id)
      assert accepted_claim.status == :accepted
    end

    test "reject_claim/2 transitions a proposed claim to rejected" do
      moderator = AccountsFixtures.user_fixture()
      claim = proposed_claim_fixture(moderator.id)

      assert {:ok, rejected_claim} = Specs.reject_claim(claim.id, moderator.id)
      assert rejected_claim.status == :rejected
    end

    test "accept_claim/2 is idempotent for accepted claims" do
      moderator = AccountsFixtures.user_fixture()
      claim = proposed_claim_fixture(moderator.id)

      assert {:ok, accepted_claim} = Specs.accept_claim(claim.id, moderator.id)
      assert {:ok, accepted_claim_again} = Specs.accept_claim(claim.id, moderator.id)

      assert accepted_claim_again.id == accepted_claim.id
      assert accepted_claim_again.status == :accepted
    end

    test "reject_claim/2 is idempotent for rejected claims" do
      moderator = AccountsFixtures.user_fixture()
      claim = proposed_claim_fixture(moderator.id)

      assert {:ok, rejected_claim} = Specs.reject_claim(claim.id, moderator.id)
      assert {:ok, rejected_claim_again} = Specs.reject_claim(claim.id, moderator.id)

      assert rejected_claim_again.id == rejected_claim.id
      assert rejected_claim_again.status == :rejected
    end

    test "accept_claim/2 rejects transitioning from rejected to accepted" do
      moderator = AccountsFixtures.user_fixture()
      claim = proposed_claim_fixture(moderator.id)

      assert {:ok, _rejected_claim} = Specs.reject_claim(claim.id, moderator.id)
      assert {:error, :invalid_status_transition} = Specs.accept_claim(claim.id, moderator.id)
      assert Repo.get!(ProductAttributeClaim, claim.id).status == :rejected
    end

    test "reject_claim/2 rejects transitioning from accepted to rejected" do
      moderator = AccountsFixtures.user_fixture()
      claim = proposed_claim_fixture(moderator.id)

      assert {:ok, _accepted_claim} = Specs.accept_claim(claim.id, moderator.id)
      assert {:error, :invalid_status_transition} = Specs.reject_claim(claim.id, moderator.id)
      assert Repo.get!(ProductAttributeClaim, claim.id).status == :accepted
    end

    test "accept_claim/2 and reject_claim/2 return claim_not_found for missing claims" do
      moderator = AccountsFixtures.user_fixture()
      missing_claim_id = -1

      assert {:error, :claim_not_found} = Specs.accept_claim(missing_claim_id, moderator.id)
      assert {:error, :claim_not_found} = Specs.reject_claim(missing_claim_id, moderator.id)
    end
  end

  defp proposed_claim_fixture(moderator_user_id) do
    product = SpecsFixtures.product_fixture()
    attribute = SpecsFixtures.attribute_fixture()

    {:ok, claim} =
      Specs.propose_claim(product.id, attribute.id, %{value_bool: true}, %{
        source_type: :user,
        created_by: moderator_user_id
      })

    claim
  end
end
