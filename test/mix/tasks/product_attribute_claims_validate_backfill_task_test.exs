defmodule Mix.Tasks.ProductAttributeClaims.ValidateBackfillTest do
  use ProductCompare.DataCase, async: false

  import ExUnit.CaptureIO

  alias ProductCompare.Fixtures.SpecsFixtures
  alias ProductCompare.Repo
  alias ProductCompare.Specs
  alias ProductCompareSchemas.Specs.ProductAttributeClaim

  test "prints the default dry-run report against the migrated database" do
    claim = claim_fixture()
    claim_snapshot = persisted_claim_snapshot!(claim.id)
    claim_count = Repo.aggregate(ProductAttributeClaim, :count, :id)

    assert capture_io(fn -> run_task([]) end) == """
           product_attribute_claims validation report (dry-run)
           typed_value_missing: count=0 sample_ids=[]
           typed_value_multiple: count=0 sample_ids=[]
           confidence_out_of_range: count=0 sample_ids=[]
           total_violating_rows: 0
           manual remediation required: NO

           """

    assert Repo.aggregate(ProductAttributeClaim, :count, :id) == claim_count
    assert persisted_claim_snapshot!(claim.id) == claim_snapshot
  end

  test "rejects an invalid switch without writing claims" do
    claim = claim_fixture()
    claim_snapshot = persisted_claim_snapshot!(claim.id)
    claim_count = Repo.aggregate(ProductAttributeClaim, :count, :id)

    assert_raise Mix.Error, "Unknown or invalid options: --write", fn ->
      run_task(["--write"])
    end

    assert Repo.aggregate(ProductAttributeClaim, :count, :id) == claim_count
    assert persisted_claim_snapshot!(claim.id) == claim_snapshot
  end

  defp run_task(args) do
    Mix.Task.reenable("product_attribute_claims.validate_backfill")
    Mix.Task.run("product_attribute_claims.validate_backfill", args)
  end

  defp claim_fixture do
    product = SpecsFixtures.product_fixture()
    attribute = SpecsFixtures.attribute_fixture(%{data_type: :bool})

    {:ok, claim} =
      Specs.propose_claim(product.id, attribute.id, %{value_bool: true}, %{
        source_type: :user,
        confidence: Decimal.new("0.8")
      })

    claim
  end

  defp persisted_claim_snapshot!(claim_id) do
    claim = Repo.get!(ProductAttributeClaim, claim_id)
    Map.take(claim, ProductAttributeClaim.__schema__(:fields))
  end
end
