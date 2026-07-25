defmodule ProductCompare.Ingestion do
  @moduledoc """
  Product data ingestion context.
  """

  alias ProductCompare.Ingestion.CJPrograms
  alias ProductCompare.Ingestion.CJProgramWarnings
  alias ProductCompare.Ingestion.FeedCandidates
  alias ProductCompare.Ingestion.ListingPersistence
  alias ProductCompare.Ingestion.MerchantIdentities
  alias ProductCompare.Ingestion.NormalizedListing
  alias ProductCompare.Ingestion.Runs
  alias ProductCompareSchemas.Catalog.Product
  alias ProductCompareSchemas.Ingestion.ImportRun
  alias ProductCompareSchemas.Ingestion.CJProgram
  alias ProductCompareSchemas.Ingestion.MerchantFeedCandidate
  alias ProductCompareSchemas.Ingestion.MerchantSourceIdentity
  alias ProductCompareSchemas.Pricing.MerchantProduct
  alias ProductCompareSchemas.Pricing.PricePoint
  alias ProductCompareSchemas.Specs.ExternalProduct
  alias ProductCompareSchemas.Specs.Source
  alias ProductCompareSchemas.Specs.SourceArtifact

  @spec start_import_run(map()) :: {:ok, ImportRun.t()} | {:error, Ecto.Changeset.t()}
  def start_import_run(attrs), do: Runs.start_import_run(attrs)

  @spec complete_import_run(ImportRun.t(), map()) ::
          {:ok, ImportRun.t()} | {:error, Ecto.Changeset.t()}
  def complete_import_run(%ImportRun{} = import_run, attrs),
    do: Runs.complete_import_run(import_run, attrs)

  @spec upsert_merchant_feed_candidate(Source.t(), map()) ::
          {:ok, MerchantFeedCandidate.t()} | {:error, Ecto.Changeset.t()}
  def upsert_merchant_feed_candidate(%Source{} = source, attrs),
    do: FeedCandidates.upsert_merchant_feed_candidate(source, attrs)

  @spec list_merchant_feed_candidates(Source.t()) :: [MerchantFeedCandidate.t()]
  def list_merchant_feed_candidates(%Source{} = source),
    do: FeedCandidates.list_merchant_feed_candidates(source)

  @spec list_merchant_feed_candidates_query() :: Ecto.Query.t()
  def list_merchant_feed_candidates_query,
    do: FeedCandidates.list_merchant_feed_candidates_query()

  @spec list_merchant_feed_candidates_query(keyword() | map()) :: Ecto.Query.t()
  def list_merchant_feed_candidates_query(opts),
    do: FeedCandidates.list_merchant_feed_candidates_query(opts)

  @spec get_cj_program_by_entropy_id(Ecto.UUID.t()) :: CJProgram.t() | nil
  def get_cj_program_by_entropy_id(entropy_id), do: CJPrograms.get_by_entropy_id(entropy_id)

  @spec update_cj_program_lifecycle(Ecto.UUID.t(), map()) ::
          {:ok, CJProgram.t()} | {:error, :not_found | Ecto.Changeset.t()}
  def update_cj_program_lifecycle(entropy_id, attrs),
    do: CJPrograms.update_lifecycle(entropy_id, attrs)

  @spec update_cj_program_lifecycle(Ecto.UUID.t(), map(), DateTime.t()) ::
          {:ok, CJProgram.t()} | {:error, :not_found | Ecto.Changeset.t()}
  def update_cj_program_lifecycle(entropy_id, attrs, now),
    do: CJPrograms.update_lifecycle(entropy_id, attrs, now)

  @spec list_cj_programs_query(keyword() | map()) :: Ecto.Query.t()
  def list_cj_programs_query(opts \\ []), do: CJPrograms.list_query(opts)

  @spec cj_program_stage_counts() :: %{required(atom()) => non_neg_integer()}
  def cj_program_stage_counts, do: CJPrograms.stage_counts()

  @spec list_cj_program_feeds_query(keyword() | map()) :: Ecto.Query.t()
  def list_cj_program_feeds_query(opts \\ []), do: CJPrograms.list_feeds_query(opts)

  @spec list_unmatched_cj_program_feeds_query() :: Ecto.Query.t()
  def list_unmatched_cj_program_feeds_query, do: CJPrograms.list_unmatched_feeds_query()

  @spec cj_program_warnings([term()]) :: %{optional(pos_integer()) => [String.t()]}
  def cj_program_warnings(program_ids), do: CJProgramWarnings.by_program_ids(program_ids)

  @spec resolve_merchant_identity(Source.t(), NormalizedListing.t()) ::
          {:ok, MerchantSourceIdentity.t()} | {:error, term()}
  def resolve_merchant_identity(%Source{} = source, %NormalizedListing{} = listing),
    do: MerchantIdentities.resolve(source, listing)

  @type persisted_listing :: %{
          source_artifact: SourceArtifact.t(),
          external_product: ExternalProduct.t(),
          product: Product.t() | nil,
          merchant_identity: MerchantSourceIdentity.t(),
          merchant_product: MerchantProduct.t() | nil,
          price_point: PricePoint.t() | nil
        }

  @spec persist_normalized_listing(Source.t(), NormalizedListing.t()) ::
          {:ok, persisted_listing()} | {:error, term()}
  def persist_normalized_listing(source, listing),
    do: persist_normalized_listing(source, listing, [])

  @spec persist_normalized_listing(Source.t(), NormalizedListing.t(), keyword()) ::
          {:ok, persisted_listing()} | {:error, term()}
  def persist_normalized_listing(%Source{} = source, %NormalizedListing{} = listing, opts),
    do: ListingPersistence.persist(source, listing, opts)
end
