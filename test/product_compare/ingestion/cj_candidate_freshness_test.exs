defmodule ProductCompare.Ingestion.CJCandidateFreshnessTest do
  use ProductCompare.DataCase, async: true

  import ProductCompare.Fixtures.CJIngestionFixtures

  alias ProductCompare.Ingestion.CJCandidateFreshness
  alias ProductCompare.Ingestion.CJPrograms
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.CJProgram
  alias ProductCompareSchemas.Ingestion.MerchantFeedCandidate

  describe "summary/2" do
    test "counts feeds by freshness bucket, linked program stage, and unmatched state" do
      now = ~U[2026-07-02 12:00:00Z]
      source = source_fixture()

      _first_new_feed =
        merchant_feed_candidate_fixture(source, %{
          advertiser_id: "fresh-new-program",
          last_seen_at: now,
          provider_feed_id: "cj-fresh-new-first"
        })

      _second_new_feed =
        merchant_feed_candidate_fixture(source, %{
          advertiser_id: "fresh-new-program",
          last_seen_at: now,
          provider_feed_id: "cj-fresh-new-second"
        })

      considering_feed =
        merchant_feed_candidate_fixture(source, %{
          advertiser_id: "aging-considering-program",
          last_seen_at: DateTime.add(now, -72, :hour),
          provider_feed_id: "cj-aging-considering"
        })

      set_program_stage(considering_feed, "considering")

      selected_feed =
        merchant_feed_candidate_fixture(source, %{
          advertiser_id: "stale-selected-program",
          last_seen_at: DateTime.add(now, -10, :day),
          provider_feed_id: "cj-stale-selected"
        })

      set_program_stage(selected_feed, "selected")

      merchant_feed_candidate_fixture(source, %{
        advertiser_id: "   ",
        last_seen_at: now,
        provider_feed_id: "cj-fresh-unmatched"
      })

      awin_source = source_fixture(%{name: "Awin", provider: "awin"})

      merchant_feed_candidate_fixture(awin_source, %{
        last_seen_at: now,
        provider: "awin",
        provider_feed_id: "awin-fresh"
      })

      assert %{
               provider: "cj",
               fresh_hours: 48,
               stale_hours: 168,
               buckets: %{
                 fresh: %{candidate_count: 3, stage_counts: fresh_stage_counts},
                 aging: %{candidate_count: 1, stage_counts: aging_stage_counts},
                 stale: %{candidate_count: 1, stage_counts: stale_stage_counts}
               }
             } = summary = CJCandidateFreshness.summary([], now)

      assert fresh_stage_counts == %{
               new: 2,
               considering: 0,
               selected: 0,
               applied: 0,
               accepted: 0,
               not_pursuing: 0,
               declined: 0,
               unmatched: 1
             }

      assert aging_stage_counts == %{
               new: 0,
               considering: 1,
               selected: 0,
               applied: 0,
               accepted: 0,
               not_pursuing: 0,
               declined: 0,
               unmatched: 0
             }

      assert stale_stage_counts == %{
               new: 0,
               considering: 0,
               selected: 1,
               applied: 0,
               accepted: 0,
               not_pursuing: 0,
               declined: 0,
               unmatched: 0
             }

      assert_safe_summary(summary)
    end

    test "normalizes invalid thresholds and clamps stale hours to fresh hours" do
      now = ~U[2026-07-02 12:00:00Z]

      assert %{fresh_hours: 48, stale_hours: 168} =
               CJCandidateFreshness.summary([fresh_hours: 0, stale_hours: "bad"], now)

      assert %{fresh_hours: 96, stale_hours: 96} =
               CJCandidateFreshness.summary([fresh_hours: 96, stale_hours: 24], now)

      assert %{fresh_hours: 48, stale_hours: 168} =
               CJCandidateFreshness.summary(["not-an-option"], now)

      assert %{fresh_hours: 12, stale_hours: 36} =
               CJCandidateFreshness.summary(%{"fresh_hours" => 12, "stale_hours" => 36}, now)
    end

    test "does not mutate feeds or their linked program while summarizing freshness" do
      now = ~U[2026-07-02 12:00:00Z]
      source = source_fixture()

      candidate =
        merchant_feed_candidate_fixture(source, %{
          advertiser_id: "unchanged-program",
          last_seen_at: DateTime.add(now, -10, :day),
          raw_metadata: %{"token" => "secret"}
        })

      set_program_stage(candidate, "not_pursuing")
      before_candidate = Repo.get!(MerchantFeedCandidate, candidate.id)
      before_program = Repo.get!(CJProgram, candidate.cj_program_id)

      assert %{buckets: %{stale: %{candidate_count: 1}}} =
               CJCandidateFreshness.summary([], now)

      after_candidate = Repo.get!(MerchantFeedCandidate, candidate.id)
      after_program = Repo.get!(CJProgram, candidate.cj_program_id)

      assert after_candidate.cj_program_id == before_candidate.cj_program_id
      assert after_candidate.raw_metadata == before_candidate.raw_metadata
      assert after_program.stage == before_program.stage
      assert DateTime.compare(after_program.changed_at, before_program.changed_at) == :eq
    end
  end

  defp set_program_stage(candidate, stage) do
    program = Repo.get!(CJProgram, candidate.cj_program_id)

    assert {:ok, _program} =
             CJPrograms.update_lifecycle(
               program.entropy_id,
               %{stage: stage, note: "Decision for #{stage}"},
               ~U[2026-07-02 13:00:00.000000Z]
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

    assert Map.keys(summary) |> Enum.sort() == [:buckets, :fresh_hours, :provider, :stale_hours]
    assert MapSet.disjoint?(MapSet.new(Map.keys(summary)), sensitive_keys)

    Enum.each(summary.buckets, fn {_bucket, bucket_summary} ->
      assert Map.keys(bucket_summary) |> Enum.sort() == [:candidate_count, :stage_counts]
      assert MapSet.disjoint?(MapSet.new(Map.keys(bucket_summary)), sensitive_keys)
    end)
  end
end
