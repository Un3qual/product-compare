defmodule ProductCompare.Ingestion.FitScore do
  @moduledoc false

  @merchant_feed_candidate_fit_score_fragment """
  (CASE
    WHEN ? >= 10000 THEN 50
    WHEN ? >= 1000 THEN 35
    WHEN ? >= 100 THEN 20
    WHEN ? > 0 THEN 10
    ELSE 0
  END) +
  (CASE WHEN upper(coalesce(?, '')) = 'US' THEN 20 ELSE 0 END) +
  (CASE WHEN upper(coalesce(?, '')) = 'USD' THEN 15 ELSE 0 END) +
  (CASE WHEN upper(coalesce(?, '')) = 'EN' THEN 10 ELSE 0 END) +
  (CASE WHEN coalesce(?, '') != '' THEN 5 ELSE 0 END)
  """

  @doc false
  defmacro merchant_feed_candidate_fit_score(candidate) do
    quote do
      fragment(
        unquote(@merchant_feed_candidate_fit_score_fragment),
        unquote(candidate).product_count,
        unquote(candidate).product_count,
        unquote(candidate).product_count,
        unquote(candidate).product_count,
        unquote(candidate).advertiser_country,
        unquote(candidate).currency,
        unquote(candidate).language,
        unquote(candidate).source_feed_type
      )
    end
  end
end
