defmodule ProductCompare.Recommendations.Result do
  @moduledoc false

  @spec new(
          atom() | String.t(),
          String.t(),
          DateTime.t() | String.t(),
          atom() | String.t(),
          pos_integer() | nil,
          String.t() | nil,
          [map()],
          [String.t()]
        ) :: map()
  def new(
        profile,
        algorithm_version,
        evaluated_at,
        status,
        winner_product_id,
        currency,
        rankings,
        missing_inputs
      ) do
    %{
      profile: profile,
      algorithm_version: algorithm_version,
      evaluated_at: evaluated_at,
      status: status,
      winner_product_id: winner_product_id,
      currency: currency,
      rankings: rankings,
      missing_inputs: missing_inputs
    }
  end
end
