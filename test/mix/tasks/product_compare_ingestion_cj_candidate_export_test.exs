defmodule Mix.Tasks.ProductCompare.Ingestion.CjCandidateExportTest do
  use ExUnit.Case, async: true

  alias Mix.Tasks.ProductCompare.Ingestion.CjCandidateExport

  describe "run/1" do
    test "rejects CJ candidate CSV export" do
      assert_raise Mix.Error, "CJ candidate CSV export is not supported", fn ->
        CjCandidateExport.run([])
      end
    end

    test "rejects export even when a review status is supplied" do
      assert_raise Mix.Error, "CJ candidate CSV export is not supported", fn ->
        CjCandidateExport.run(["--status", "shortlisted"])
      end
    end
  end
end
