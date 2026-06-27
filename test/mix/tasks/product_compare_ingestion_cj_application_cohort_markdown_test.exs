defmodule Mix.Tasks.ProductCompare.Ingestion.CjApplicationCohortMarkdownTest do
  use ProductCompare.DataCase, async: false

  import ExUnit.CaptureIO

  alias Mix.Tasks.ProductCompare.Ingestion.CjApplicationCohortMarkdown
  alias ProductCompare.Ingestion
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.MerchantFeedCandidate
  alias ProductCompareSchemas.Specs.Source
  alias ProductCompareWeb.GraphQL.GlobalId

  describe "run/1" do
    test "renders markdown heading and shortlisted CJ rows with table columns" do
      source = source_fixture()

      shortlisted_us =
        candidate_fixture(source, %{
          advertiser_country: "US",
          advertiser_id: "adv-us",
          advertiser_name: "Trail Merchant",
          currency: "USD",
          feed_name: "Trail Feed",
          language: "EN",
          product_count: 12_000,
          provider_feed_id: "feed-shortlisted-us",
          review_status: "shortlisted"
        })

      shortlisted_ca =
        candidate_fixture(source, %{
          advertiser_country: "CA",
          advertiser_id: "adv-ca",
          advertiser_name: "North Merchant",
          currency: "CAD",
          feed_name: "North Feed",
          language: "EN",
          product_count: 9_000,
          provider_feed_id: "feed-shortlisted-ca",
          review_status: "shortlisted"
        })

      _pending =
        candidate_fixture(source, %{
          advertiser_country: "US",
          advertiser_id: "adv-pending",
          advertiser_name: "Pending Merchant",
          currency: "USD",
          feed_name: "Pending Feed",
          language: "EN",
          product_count: 20_000,
          provider_feed_id: "feed-pending",
          review_status: "pending"
        })

      _shortlisted_noncj =
        candidate_fixture(source, %{
          provider: "shopify",
          advertiser_country: "US",
          advertiser_id: "adv-shopify",
          advertiser_name: "Shopify Merchant",
          currency: "USD",
          feed_name: "Shopify Feed",
          language: "EN",
          product_count: 20_000,
          provider_feed_id: "feed-shopify",
          review_status: "shortlisted"
        })

      output = capture_io(fn -> CjApplicationCohortMarkdown.run([]) end)

      assert String.starts_with?(output, "# CJ Application Cohort\n\ncount=2\n\n")

      assert output =~
               "| Candidate | Advertiser | Advertiser ID | Country | Currency | Language | Feed | Products | Feed Type | Review Note |"

      assert output =~ "| --- | --- | --- | --- | --- | --- | --- | ---: | --- | --- |"

      assert output =~
               "| #{GlobalId.encode(:merchant_feed_candidate, shortlisted_us.id)} | Trail Merchant | adv-us | US | USD | EN | Trail Feed | 12000 | SHOPPING | blank |"

      assert output =~
               "| #{GlobalId.encode(:merchant_feed_candidate, shortlisted_ca.id)} | North Merchant | adv-ca | CA | CAD | EN | North Feed | 9000 | SHOPPING | blank |"

      refute output =~ "| #{GlobalId.encode(:merchant_feed_candidate, _pending.id)} |"
      refute output =~ "| #{GlobalId.encode(:merchant_feed_candidate, _shortlisted_noncj.id)} |"
      refute output =~ "Pending Merchant"
      refute output =~ "Shopify Merchant"
    end

    test "applies country, currency, language, and min-product-count filters" do
      source = source_fixture()

      matching_candidate =
        candidate_fixture(source, %{
          advertiser_country: "US",
          advertiser_id: "adv-match",
          advertiser_name: "Matching Merchant",
          currency: "USD",
          feed_name: "Matching Feed",
          language: "EN",
          product_count: 12_000,
          provider_feed_id: "feed-match",
          review_status: "shortlisted"
        })

      _not_country =
        candidate_fixture(source, %{
          advertiser_country: "CA",
          advertiser_id: "adv-country",
          advertiser_name: "Country Mismatch",
          currency: "USD",
          feed_name: "Country Feed",
          language: "EN",
          product_count: 12_000,
          provider_feed_id: "feed-country",
          review_status: "shortlisted"
        })

      _not_currency =
        candidate_fixture(source, %{
          advertiser_country: "US",
          advertiser_id: "adv-currency",
          advertiser_name: "Currency Mismatch",
          currency: "CAD",
          feed_name: "Currency Feed",
          language: "EN",
          product_count: 12_000,
          provider_feed_id: "feed-currency",
          review_status: "shortlisted"
        })

      _not_product_count =
        candidate_fixture(source, %{
          advertiser_country: "US",
          advertiser_id: "adv-count",
          advertiser_name: "Product Count Mismatch",
          currency: "USD",
          feed_name: "Count Feed",
          language: "EN",
          product_count: 9_000,
          provider_feed_id: "feed-count",
          review_status: "shortlisted"
        })

      output =
        capture_io(fn ->
          CjApplicationCohortMarkdown.run([
            "--country",
            "us",
            "--currency",
            "usd",
            "--language",
            "en",
            "--min-product-count",
            "10000"
          ])
        end)

      assert output =~ "count=1"
      assert output =~ "| #{GlobalId.encode(:merchant_feed_candidate, matching_candidate.id)} |"
      refute output =~ "adv-country"
      refute output =~ "adv-currency"
      refute output =~ "adv-count"
    end

    test "respects row limit in report output" do
      source = source_fixture()

      first =
        candidate_fixture(source, %{advertiser_id: "adv-first", review_status: "shortlisted"})

      _second =
        candidate_fixture(source, %{advertiser_id: "adv-second", review_status: "shortlisted"})

      output = capture_io(fn -> CjApplicationCohortMarkdown.run(["--limit", "1"]) end)

      rows =
        output
        |> String.split("\n")
        |> Enum.filter(&String.starts_with?(&1, "|"))
        |> Enum.drop(2)
        |> Enum.filter(&(&1 != ""))

      assert output =~ "count=1"
      assert Enum.count(rows) == 1
      assert output =~ "#{GlobalId.encode(:merchant_feed_candidate, first.id)}"
      refute output =~ "#{GlobalId.encode(:merchant_feed_candidate, _second.id)}"
    end

    test "raises when no candidates are found and requirement is enabled" do
      source = source_fixture()

      candidate_fixture(source, %{
        advertiser_country: "US",
        advertiser_id: "adv-only",
        advertiser_name: "Only Merchant",
        currency: "USD",
        feed_name: "Only Feed",
        language: "EN",
        product_count: 12_000,
        provider_feed_id: "feed-only",
        review_status: "shortlisted"
      })

      assert_raise Mix.Error, "no CJ application cohort candidates found", fn ->
        capture_io(fn ->
          CjApplicationCohortMarkdown.run(["--country", "ZZ", "--require-candidates"])
        end)
      end
    end

    test "includes review note presence marker but not review note body" do
      source = source_fixture()

      candidate_fixture(source, %{
        advertiser_id: "adv-notes",
        advertiser_name: "Reviewed Merchant",
        review_status: "shortlisted",
        review_note: "manual-review-note-body",
        source_feed_type: "SHOPPING",
        product_count: 1,
        provider_feed_id: "feed-notes"
      })

      output = capture_io(fn -> CjApplicationCohortMarkdown.run([]) end)

      assert output =~ "| present |"
      refute output =~ "manual-review-note-body"
    end

    test "does not print raw metadata, tokens, account ids, tracking, or provider payload markers" do
      source = source_fixture()

      candidate_fixture(source, %{
        advertiser_id: "adv-secret",
        advertiser_name: "Secret Merchant",
        review_status: "shortlisted",
        raw_metadata: %{
          "account_id_marker" => "account-id-marker",
          "provider_payload_marker" => "provider-payload-marker",
          "token_marker" => "credential-token-marker",
          "tracking_parameter_marker" => "tracking-parameter-marker"
        },
        review_note: "review-note-body",
        product_count: 10_000,
        provider_feed_id: "feed-secret"
      })

      output = capture_io(fn -> CjApplicationCohortMarkdown.run([]) end)

      refute output =~ "account-id-marker"
      refute output =~ "provider-payload-marker"
      refute output =~ "credential-token-marker"
      refute output =~ "tracking-parameter-marker"
      refute output =~ "review-note-body"
    end

    test "escapes pipe characters and renders nil fields as empty strings" do
      source = source_fixture()

      candidate_fixture(source, %{
        advertiser_id: "adv-pipes",
        advertiser_name: "Pipe|Merchant",
        feed_name: "Pipe|Feed",
        currency: nil,
        language: nil,
        source_feed_type: nil,
        product_count: nil,
        review_status: "shortlisted",
        provider_feed_id: "feed-pipes"
      })

      output = capture_io(fn -> CjApplicationCohortMarkdown.run(["--limit", "1"]) end)

      assert output =~ "Pipe\\|Merchant"
      assert output =~ "Pipe\\|Feed"
      assert output =~ "US |  |  | Pipe\\|Feed"
      assert output =~ "| blank |"
    end
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
          last_seen_at: ~U[2026-06-26 12:00:00Z],
          product_count: 1,
          provider: "cj",
          provider_feed_id: "feed-#{System.unique_integer([:positive])}",
          provider_last_updated_at: ~U[2026-06-26 11:00:00Z],
          raw_metadata: %{},
          review_status: "pending",
          source_feed_type: "SHOPPING"
        },
        attrs
      )

    assert {:ok, %MerchantFeedCandidate{} = candidate} =
             Ingestion.upsert_merchant_feed_candidate(source, attrs)

    candidate
  end

  defp source_fixture(attrs \\ %{}) do
    suffix = "#{System.unique_integer([:positive])}-#{System.system_time(:nanosecond)}"

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
end
