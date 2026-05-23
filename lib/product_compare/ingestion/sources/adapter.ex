defmodule ProductCompare.Ingestion.Sources.Adapter do
  @moduledoc """
  Behaviour for source-specific ingestion adapters.
  """

  alias ProductCompare.Ingestion.NormalizedListing

  @type cursor :: term()
  @type batch :: [map()]
  @type mapping_error :: %{required(:reason) => atom(), optional(:field) => atom()}

  @callback fetch_batch(cursor(), map() | keyword()) ::
              {:ok, batch(), cursor() | nil} | {:error, term()}

  @callback normalize(map()) :: {:ok, NormalizedListing.t()} | {:error, mapping_error()}
end
