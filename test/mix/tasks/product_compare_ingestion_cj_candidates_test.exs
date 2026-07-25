defmodule Mix.Tasks.ProductCompare.Ingestion.CjCandidatesTest do
  use ProductCompare.DataCase, async: false

  import ExUnit.CaptureIO

  alias Mix.Tasks.ProductCompare.Ingestion.CjCandidates
  alias Mix.Tasks.ProductCompare.Ingestion.CjCandidates.Options
  alias ProductCompare.Ingestion
  alias ProductCompare.Ingestion.CJPrograms
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.CJProgram
  alias ProductCompareSchemas.Specs.Source
  alias ProductCompareWeb.GraphQL.GlobalId

  describe "options" do
    test "normalizes a program stage and leaves unmatched feeds excluded by default" do
      opts = ["--stage", "new"] |> Options.parse_argv() |> Options.normalize()

      assert opts[:stage] == "new"
      assert opts[:include_unmatched] == false
    end

    test "rejects a stage outside the program lifecycle" do
      assert_raise Mix.Error, "invalid program stage: paused", fn ->
        Options.normalize(stage: "paused")
      end
    end

    test "forces application cohort options to the selected program stage" do
      opts = Options.normalize(report: "application-cohort", stage: "new")

      assert opts[:stage] == "selected"
    end
  end

  describe "run/1" do
    test "stale report includes linked and unmatched CJ feeds when requested" do
      source = source_fixture()

      linked =
        candidate_fixture(source, %{
          advertiser_id: "adv-linked-stale",
          advertiser_name: "Linked stale feed",
          last_seen_at: days_ago(20),
          provider_feed_id: "cj-linked-stale",
          raw_metadata: %{"token" => "do-not-print"}
        })

      unmatched =
        candidate_fixture(source, %{
          advertiser_id: "   ",
          advertiser_name: "Unmatched stale feed",
          last_seen_at: days_ago(20),
          provider_feed_id: "cj-unmatched-stale"
        })

      candidate_fixture(source, %{
        advertiser_id: "adv-fresh",
        last_seen_at: hours_ago(2),
        provider_feed_id: "cj-fresh"
      })

      candidate_fixture(source, %{
        advertiser_id: "adv-noncj",
        last_seen_at: days_ago(20),
        provider: "shopify",
        provider_feed_id: "non-cj-stale"
      })

      output =
        capture_io(fn ->
          CjCandidates.run(["--report", "stale", "--stage", "all", "--include-unmatched"])
        end)

      {:ok, linked_id} = GlobalId.encode_required(:merchant_feed_candidate, linked.id)
      {:ok, unmatched_id} = GlobalId.encode_required(:merchant_feed_candidate, unmatched.id)

      assert output =~
               "provider=cj report=stale max_age_hours=168 stale_count=2 stage=all include_unmatched=true"

      assert output =~ "candidate_id=#{linked_id}"
      assert output =~ "candidate_id=#{unmatched_id}"
      refute output =~ "adv-fresh"
      refute output =~ "adv-noncj"
      refute output =~ "do-not-print"
    end

    test "fit gaps defaults to New programs" do
      source = source_fixture()

      new_feed =
        candidate_fixture(source, %{
          advertiser_country: "CA",
          advertiser_id: "adv-new-gap",
          currency: "CAD",
          language: "FR",
          product_count: 25,
          provider_feed_id: "feed-new-gap",
          source_feed_type: nil
        })

      selected_feed =
        candidate_fixture(source, %{
          advertiser_id: "adv-selected-gap",
          provider_feed_id: "feed-selected-gap"
        })

      set_program_stage(selected_feed, "selected", "Selected outside the fit-gap default")

      output = capture_io(fn -> CjCandidates.run(["--report", "fit-gaps"]) end)

      {:ok, new_id} = GlobalId.encode_required(:merchant_feed_candidate, new_feed.id)
      {:ok, selected_id} = GlobalId.encode_required(:merchant_feed_candidate, selected_feed.id)

      assert output =~ "provider=cj report=fit-gaps stage=new candidate_count=1"
      assert output =~ "candidate_id=#{new_id}"

      assert output =~
               "gaps=country_not_us,currency_not_usd,language_not_en,low_product_count,missing_source_feed_type"

      refute output =~ "candidate_id=#{selected_id}"
    end

    test "application cohort reports selected program state and factual warnings only" do
      source = source_fixture()
      changed_at = ~U[2026-07-25 16:00:00.000000Z]

      selected_feed =
        candidate_fixture(source, %{
          advertiser_country: "CA",
          advertiser_id: "adv-selected-cohort",
          advertiser_name: nil,
          currency: "CAD",
          language: "FR",
          product_count: nil,
          provider_feed_id: "feed-selected-cohort",
          raw_metadata: %{"token" => "do-not-print"}
        })

      set_program_stage(selected_feed, "selected", "Ready for an application", changed_at)

      applied_feed =
        candidate_fixture(source, %{
          advertiser_id: "adv-applied-cohort",
          provider_feed_id: "feed-applied-cohort"
        })

      accepted_feed =
        candidate_fixture(source, %{
          advertiser_id: "adv-accepted-cohort",
          provider_feed_id: "feed-accepted-cohort"
        })

      set_program_stage(applied_feed, "applied", "Application already sent")
      set_program_stage(accepted_feed, "accepted", "Already accepted")

      output =
        capture_io(fn ->
          CjCandidates.run(["--report", "application-cohort", "--stage", "new"])
        end)

      {:ok, selected_id} = GlobalId.encode_required(:merchant_feed_candidate, selected_feed.id)

      assert output =~ "provider=cj report=application-cohort format=lines stage=selected count=1"
      assert output =~ "candidate_id=#{selected_id}"
      assert output =~ "program_stage=selected"
      assert output =~ "program_note_present=true"
      assert output =~ "program_changed_at=2026-07-25T16:00:00.000000Z"

      assert output =~
               "warning_codes=missing_advertiser_name,missing_product_count,non_us_market,non_usd_currency,non_english_language"

      refute output =~ "adv-applied-cohort"
      refute output =~ "adv-accepted-cohort"
      refute output =~ "review_status"
      refute output =~ "shortlisted"
      refute output =~ "dismissed"
      refute output =~ "fit_score"
      refute output =~ "do-not-print"
    end

    test "rejects removed CSV export report" do
      assert_raise Mix.Error, "CJ candidate CSV export is not supported", fn ->
        capture_io(fn -> CjCandidates.run(["--report", "export"]) end)
      end
    end
  end

  defp source_fixture(attrs \\ %{}) do
    suffix = "#{System.unique_integer([:positive])}-#{System.system_time(:nanosecond)}"

    %Source{}
    |> Source.changeset(
      Map.merge(
        %{kind: "affiliate_feed", name: "CJ #{suffix}", domain: "cj-#{suffix}.example"},
        attrs
      )
    )
    |> Repo.insert!()
  end

  defp candidate_fixture(source, attrs) do
    attrs =
      Map.merge(
        %{
          advertiser_country: "US",
          advertiser_id: "adv-1",
          advertiser_name: "Trail Merchant",
          currency: "USD",
          feed_name: "US Shopping",
          language: "EN",
          product_count: 1_500,
          provider: "cj",
          provider_feed_id: "feed-1",
          provider_last_updated_at: hours_ago(22),
          raw_metadata: %{},
          last_seen_at: DateTime.utc_now(),
          source_feed_type: "SHOPPING"
        },
        attrs
      )

    assert {:ok, candidate} = Ingestion.upsert_merchant_feed_candidate(source, attrs)
    candidate
  end

  defp set_program_stage(candidate, stage, note, changed_at \\ DateTime.utc_now()) do
    program = Repo.get!(CJProgram, candidate.cj_program_id)

    assert {:ok, _program} =
             CJPrograms.update_lifecycle(
               program.entropy_id,
               %{stage: stage, note: note},
               changed_at
             )
  end

  defp days_ago(days) do
    DateTime.utc_now()
    |> DateTime.add(-days, :day)
    |> DateTime.truncate(:microsecond)
  end

  defp hours_ago(hours) do
    DateTime.utc_now()
    |> DateTime.add(-hours, :hour)
    |> DateTime.truncate(:microsecond)
  end
end
