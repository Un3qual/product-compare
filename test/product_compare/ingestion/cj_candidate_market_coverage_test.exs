defmodule ProductCompare.Ingestion.CJCandidateMarketCoverageTest do
  use ProductCompare.DataCase, async: true

  import ProductCompare.Fixtures.CJIngestionFixtures

  alias ProductCompare.Ingestion.CJCandidateMarketCoverage
  alias ProductCompare.Ingestion.CJPrograms
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.CJProgram

  describe "summary/1" do
    test "returns safe CJ feed counts by normalized market bucket, stage, and unmatched state" do
      source = source_fixture()

      _first_new_feed =
        merchant_feed_candidate_fixture(source, %{
          advertiser_country: " US ",
          advertiser_id: "new-program",
          currency: " usd ",
          language: " en ",
          provider_feed_id: "cj-us-new-first",
          source_feed_type: " shopping "
        })

      _second_new_feed =
        merchant_feed_candidate_fixture(source, %{
          advertiser_country: "US",
          advertiser_id: "new-program",
          currency: "USD",
          language: "EN",
          provider_feed_id: "cj-us-new-second",
          source_feed_type: "SHOPPING"
        })

      selected_feed =
        merchant_feed_candidate_fixture(source, %{
          advertiser_country: " ca ",
          advertiser_id: "selected-program",
          currency: " cad ",
          language: " fr ",
          provider_feed_id: "cj-ca-selected",
          source_feed_type: " product "
        })

      set_program_stage(selected_feed, "selected")

      merchant_feed_candidate_fixture(source, %{
        advertiser_country: nil,
        advertiser_id: "   ",
        currency: "",
        language: "   ",
        provider_feed_id: "cj-unknown-unmatched",
        source_feed_type: nil
      })

      awin_source = source_fixture(%{name: "Awin", provider: "awin"})

      merchant_feed_candidate_fixture(awin_source, %{
        advertiser_country: "US",
        provider: "awin",
        provider_feed_id: "awin-us"
      })

      assert %{
               provider: "cj",
               total_candidate_count: 4,
               stage_counts: %{
                 new: 2,
                 considering: 0,
                 selected: 1,
                 applied: 0,
                 accepted: 0,
                 not_pursuing: 0,
                 declined: 0,
                 unmatched: 1
               },
               dimensions: %{
                 advertiser_country: [
                   %{
                     bucket: "US",
                     candidate_count: 2,
                     stage_counts: %{
                       new: 2,
                       considering: 0,
                       selected: 0,
                       applied: 0,
                       accepted: 0,
                       not_pursuing: 0,
                       declined: 0,
                       unmatched: 0
                     }
                   },
                   %{
                     bucket: "CA",
                     candidate_count: 1,
                     stage_counts: %{
                       new: 0,
                       considering: 0,
                       selected: 1,
                       applied: 0,
                       accepted: 0,
                       not_pursuing: 0,
                       declined: 0,
                       unmatched: 0
                     }
                   },
                   %{
                     bucket: "unknown",
                     candidate_count: 1,
                     stage_counts: %{
                       new: 0,
                       considering: 0,
                       selected: 0,
                       applied: 0,
                       accepted: 0,
                       not_pursuing: 0,
                       declined: 0,
                       unmatched: 1
                     }
                   }
                 ],
                 currency: [
                   %{bucket: "USD", candidate_count: 2},
                   %{bucket: "CAD", candidate_count: 1},
                   %{bucket: "unknown", candidate_count: 1}
                 ],
                 language: [
                   %{bucket: "EN", candidate_count: 2},
                   %{bucket: "FR", candidate_count: 1},
                   %{bucket: "unknown", candidate_count: 1}
                 ],
                 source_feed_type: [
                   %{bucket: "SHOPPING", candidate_count: 2},
                   %{bucket: "PRODUCT", candidate_count: 1},
                   %{bucket: "unknown", candidate_count: 1}
                 ]
               }
             } = summary = CJCandidateMarketCoverage.summary()

      assert_safe_summary(summary)
    end
  end

  defp set_program_stage(candidate, stage) do
    program = Repo.get!(CJProgram, candidate.cj_program_id)

    assert {:ok, _program} =
             CJPrograms.update_lifecycle(
               program.entropy_id,
               %{stage: stage, note: "Decision for #{stage}"},
               ~U[2026-07-25 13:00:00.000000Z]
             )
  end

  defp assert_safe_summary(summary) do
    sensitive_keys =
      MapSet.new([
        :account_id,
        :advertiser_id,
        :credentials,
        :provider_payload,
        :raw_metadata,
        :tracking_params
      ])

    assert Map.keys(summary) |> Enum.sort() == [
             :dimensions,
             :provider,
             :stage_counts,
             :total_candidate_count
           ]

    assert MapSet.disjoint?(MapSet.new(Map.keys(summary)), sensitive_keys)

    Enum.each(summary.dimensions, fn {_dimension, rows} ->
      Enum.each(rows, fn row ->
        assert Map.keys(row) |> Enum.sort() == [:bucket, :candidate_count, :stage_counts]
        assert MapSet.disjoint?(MapSet.new(Map.keys(row)), sensitive_keys)
      end)
    end)
  end
end
