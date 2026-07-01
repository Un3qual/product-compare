defmodule ProductCompare.Ingestion.FitScoreTest do
  use ProductCompare.DataCase, async: true

  import ProductCompare.Ingestion.FitScore, only: [merchant_feed_candidate_fit_score: 1]

  alias ProductCompareSchemas.Ingestion.MerchantFeedCandidate

  describe "merchant_feed_candidate_fit_score/1" do
    test "preserves the fragment field order" do
      query =
        from candidate in MerchantFeedCandidate,
          select: merchant_feed_candidate_fit_score(candidate)

      {sql, []} = Ecto.Adapters.SQL.to_sql(:all, Repo, query)

      assert Regex.match?(
               ~r/product_count.*product_count.*product_count.*product_count.*advertiser_country.*currency.*language.*source_feed_type/s,
               sql
             )
    end
  end
end
