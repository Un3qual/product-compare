defmodule Mix.Tasks.ProductCompare.Ingestion.CjCandidateReviewBatchTest do
  use ProductCompare.DataCase, async: false

  import ExUnit.CaptureIO

  alias Mix.Tasks.ProductCompare.Ingestion.CjCandidateReviewBatch
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.MerchantFeedCandidate
  alias ProductCompareSchemas.Specs.Source
  alias ProductCompareWeb.GraphQL.GlobalId

  describe "run/1" do
    setup do
      source = source_fixture()
      other_source = source_fixture(%{name: "Other source #{unique_suffix()}"})
      feed_prefix = "review-batch-#{unique_suffix()}"

      feed_1 =
        candidate_fixture(source, %{
          advertiser_name: "Beta Merchant",
          feed_name: "Beta Feed",
          provider_feed_id: "#{feed_prefix}-feed-1"
        })

      feed_2 =
        candidate_fixture(source, %{
          advertiser_name: "Alpha Merchant",
          feed_name: "Alpha Feed",
          provider_feed_id: "#{feed_prefix}-feed-2"
        })

      feed_3 =
        candidate_fixture(source, %{
          advertiser_name: "Gamma Merchant",
          feed_name: "Gamma Feed",
          provider_feed_id: "#{feed_prefix}-feed-3"
        })

      non_cj_feed_1 =
        candidate_fixture(other_source, %{
          advertiser_name: "External Merchant",
          feed_name: "External Feed",
          provider: "shopify",
          provider_feed_id: "#{feed_prefix}-feed-1"
        })

      %{
        feed_1: feed_1,
        feed_2: feed_2,
        feed_3: feed_3,
        non_cj_feed_1: non_cj_feed_1
      }
    end

    test "dry-run reports matching candidates without updating review state", %{
      feed_1: feed_1,
      feed_2: feed_2,
      feed_3: feed_3
    } do
      output =
        capture_io(fn ->
          CjCandidateReviewBatch.run([
            "--status",
            "shortlisted",
            "--provider-feed-id",
            feed_1.provider_feed_id,
            "--provider-feed-id",
            feed_2.provider_feed_id
          ])
        end)

      assert output =~
               "provider=cj dry_run=true requested=2 matched=2 updated=0 invalid_ids=0 status=shortlisted note_present=false"

      assert output =~
               "candidate_id=#{relay_id(feed_1)} provider_feed_id=#{feed_1.provider_feed_id} review_status=pending"

      assert output =~
               "candidate_id=#{relay_id(feed_2)} provider_feed_id=#{feed_2.provider_feed_id} review_status=pending"

      refute output =~ "candidate_id=#{relay_id(feed_3)}"

      [_summary, first_candidate, second_candidate] =
        output |> String.trim() |> String.split("\n")

      assert first_candidate =~ "provider_feed_id=#{feed_2.provider_feed_id}"
      assert second_candidate =~ "provider_feed_id=#{feed_1.provider_feed_id}"

      assert Repo.reload!(feed_1).review_status == "pending"
      assert Repo.reload!(feed_2).review_status == "pending"
      assert Repo.reload!(feed_1).reviewed_at == nil
      assert Repo.reload!(feed_2).reviewed_at == nil
    end

    test "apply updates matched candidates and stores trimmed note", %{
      feed_1: feed_1,
      feed_2: feed_2,
      feed_3: feed_3
    } do
      output =
        capture_io(fn ->
          CjCandidateReviewBatch.run([
            "--apply",
            "--status",
            "shortlisted",
            "--provider-feed-id",
            feed_1.provider_feed_id,
            "--provider-feed-id",
            feed_2.provider_feed_id,
            "--note",
            "  Launch cohort  "
          ])
        end)

      assert output =~
               "provider=cj dry_run=false requested=2 matched=2 updated=2 invalid_ids=0 status=shortlisted note_present=true"

      refute output =~ "Launch cohort"

      assert %{
               review_status: "shortlisted",
               review_note: "Launch cohort",
               reviewed_at: %DateTime{}
             } = Repo.reload!(feed_1)

      assert %{
               review_status: "shortlisted",
               review_note: "Launch cohort",
               reviewed_at: %DateTime{}
             } = Repo.reload!(feed_2)

      assert Repo.reload!(feed_3).review_status == "pending"
    end

    test "deduplicates repeated relay ids", %{feed_1: feed_1, feed_2: feed_2} do
      output =
        capture_io(fn ->
          CjCandidateReviewBatch.run([
            "--apply",
            "--status",
            "dismissed",
            "--id",
            relay_id(feed_1),
            "--id",
            relay_id(feed_1)
          ])
        end)

      assert output =~
               "provider=cj dry_run=false requested=2 matched=1 updated=1 invalid_ids=0 status=dismissed note_present=false"

      assert Regex.scan(~r/candidate_id=/, output) |> length() == 1
      assert Repo.reload!(feed_1).review_status == "dismissed"
      assert Repo.reload!(feed_2).review_status == "pending"
    end

    test "ignores non-CJ candidates with matching provider feed id", %{
      feed_1: feed_1,
      non_cj_feed_1: non_cj_feed_1
    } do
      output =
        capture_io(fn ->
          CjCandidateReviewBatch.run([
            "--apply",
            "--status",
            "shortlisted",
            "--provider-feed-id",
            feed_1.provider_feed_id
          ])
        end)

      assert output =~
               "provider=cj dry_run=false requested=1 matched=1 updated=1 invalid_ids=0 status=shortlisted note_present=false"

      assert output =~ "candidate_id=#{relay_id(feed_1)}"
      refute output =~ "candidate_id=#{relay_id(non_cj_feed_1)}"
      assert Repo.reload!(feed_1).review_status == "shortlisted"
      assert Repo.reload!(non_cj_feed_1).review_status == "pending"
    end

    test "trims blank notes to nil", %{feed_1: feed_1} do
      output =
        capture_io(fn ->
          CjCandidateReviewBatch.run([
            "--apply",
            "--status",
            "shortlisted",
            "--provider-feed-id",
            feed_1.provider_feed_id,
            "--note",
            "   "
          ])
        end)

      assert output =~ "note_present=false"
      assert Repo.reload!(feed_1).review_note == nil
    end

    test "counts invalid relay ids without matching them", %{feed_1: feed_1} do
      output =
        capture_io(fn ->
          CjCandidateReviewBatch.run([
            "--status",
            "shortlisted",
            "--id",
            "not-a-relay-id",
            "--id",
            relay_id(feed_1)
          ])
        end)

      assert output =~
               "provider=cj dry_run=true requested=2 matched=1 updated=0 invalid_ids=1 status=shortlisted note_present=false"
    end

    test "requires review status" do
      assert_raise Mix.Error, "review status is required", fn ->
        capture_io(fn -> CjCandidateReviewBatch.run(["--provider-feed-id", "feed-1"]) end)
      end
    end

    test "requires at least one candidate id or provider feed id" do
      assert_raise Mix.Error, "at least one candidate id or provider feed id is required", fn ->
        capture_io(fn -> CjCandidateReviewBatch.run(["--status", "shortlisted"]) end)
      end
    end

    test "limits each invocation to 50 identifiers" do
      argv =
        ["--status", "shortlisted"] ++
          Enum.flat_map(1..51, fn index -> ["--provider-feed-id", "feed-#{index}"] end)

      assert_raise Mix.Error, "candidate review batch limit is 50", fn ->
        capture_io(fn -> CjCandidateReviewBatch.run(argv) end)
      end
    end

    test "does not print raw metadata, secret markers, account ids, tracking params, or notes", %{
      feed_1: feed_1
    } do
      output =
        capture_io(fn ->
          CjCandidateReviewBatch.run([
            "--apply",
            "--status",
            "shortlisted",
            "--id",
            relay_id(feed_1),
            "--note",
            "do-not-print-review-note"
          ])
        end)

      refute output =~ "raw-metadata-marker"
      refute output =~ "credential-token-marker"
      refute output =~ "account-id-marker"
      refute output =~ "provider-payload-marker"
      refute output =~ "tracking-parameter-marker"
      refute output =~ "do-not-print-review-note"
      refute output =~ "raw_metadata"
      refute output =~ "csv"
      refute output =~ "merchant_id="
    end
  end

  defp relay_id(candidate), do: GlobalId.encode(:merchant_feed_candidate, candidate.id)

  defp source_fixture(attrs \\ %{}) do
    suffix = unique_suffix()

    %Source{}
    |> Source.changeset(
      Map.merge(
        %{
          kind: "affiliate_feed",
          name: "CJ #{suffix}",
          domain: "cj-#{suffix}.example"
        },
        attrs
      )
    )
    |> Repo.insert!()
  end

  defp unique_suffix do
    "#{System.os_time(:nanosecond)}-#{System.unique_integer([:positive])}"
  end

  defp candidate_fixture(source, attrs) do
    attrs =
      Map.merge(
        %{
          source_id: source.id,
          advertiser_country: "US",
          advertiser_id: "adv-1",
          advertiser_name: "Trail Merchant",
          currency: "USD",
          feed_name: "US Shopping",
          language: "EN",
          product_count: 1,
          provider: "cj",
          provider_feed_id: "feed-1",
          provider_last_updated_at: ~U[2026-06-26 11:00:00Z],
          raw_metadata: %{
            "account_id_marker" => "account-id-marker",
            "provider_payload_marker" => "provider-payload-marker",
            "raw_metadata_marker" => "raw-metadata-marker",
            "tracking_parameter_marker" => "tracking-parameter-marker",
            "token_marker" => "credential-token-marker"
          },
          last_seen_at: ~U[2026-06-26 12:00:00Z],
          review_status: "pending"
        },
        attrs
      )

    %MerchantFeedCandidate{}
    |> MerchantFeedCandidate.changeset(attrs)
    |> Repo.insert!()
  end
end
