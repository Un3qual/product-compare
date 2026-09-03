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

    assert_raise Mix.Error, "unsupported option: --write", fn ->
      run_task(["--write"])
    end

    assert Repo.aggregate(ProductAttributeClaim, :count, :id) == claim_count
    assert persisted_claim_snapshot!(claim.id) == claim_snapshot
  end

  test "rejects malformed input before running the workflow" do
    invalid_cases = [
      {["extra"], "unexpected argument: extra"},
      {["--sample-size", "many"], "invalid value for --sample-size: many"},
      {["--sample-size", "0"], "invalid --sample-size: expected a positive integer"},
      {["--sample-size", "-1"], "invalid --sample-size: expected a positive integer"},
      {["--strict=maybe"], "invalid value for --strict: maybe"}
    ]

    Enum.each(invalid_cases, fn {args, expected_message} ->
      assert_raise Mix.Error, expected_message, fn -> run_task(args) end
    end)
  end

  test "does not start the repository or application for an invalid sample size" do
    {output, exit_status} = run_task_without_start(["--sample-size", "0"])

    assert exit_status == 0, output
    assert output =~ "result=error: invalid --sample-size: expected a positive integer"
    assert output =~ "repo_started=false"
    assert output =~ "application_started=false"
    assert output =~ "oban_started=false"
  end

  test "starts only repository dependencies for a valid dry run" do
    {output, exit_status} = run_task_without_start(["--sample-size", "1"])

    assert exit_status == 0, output
    assert output =~ "product_attribute_claims validation report (dry-run)"
    assert output =~ "result=ok"
    assert output =~ "repo_started=true"
    assert output =~ "application_started=false"
    assert output =~ "oban_started=false"
  end

  defp run_task(args) do
    Mix.Task.reenable("product_attribute_claims.validate_backfill")
    Mix.Task.run("product_attribute_claims.validate_backfill", args)
  end

  defp run_task_without_start(args) do
    script = """
    result =
      try do
        Mix.Task.run("product_attribute_claims.validate_backfill", #{inspect(args)})
        "ok"
      rescue
        error -> "error: " <> Exception.message(error)
      end

    IO.puts("result=\#{result}")
    IO.puts("repo_started=\#{is_pid(Process.whereis(ProductCompare.Repo))}")
    IO.puts("application_started=\#{is_pid(Process.whereis(ProductCompare.Supervisor))}")
    IO.puts("oban_started=\#{is_pid(Process.whereis(Oban))}")
    """

    System.cmd("mix", ["run", "--no-start", "-e", script],
      env: [{"MIX_ENV", "test"}],
      stderr_to_stdout: true
    )
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
