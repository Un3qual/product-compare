defmodule ProductCompareWeb.Schema.Ingestion.Queries do
  use Absinthe.Schema.Notation
  use Absinthe.Relay.Schema.Notation, :modern

  alias ProductCompareWeb.Resolvers.IngestionResolver

  object :ingestion_queries do
    @desc "Returns CJ advertiser programs for lifecycle management."
    connection field :cj_programs,
                 node_type: :cj_program,
                 non_null_connection: true do
      arg(:stage, :cj_program_stage)
      arg(:sort, :cj_program_sort)
      resolve(&IngestionResolver.cj_programs/3)
    end

    @desc "Returns one CJ advertiser program by its opaque lifecycle ID."
    field :cj_program, :cj_program do
      arg(:id, non_null(:id))
      resolve(&IngestionResolver.cj_program/3)
    end

    @desc "Returns lifecycle counts across all CJ advertiser programs."
    field :cj_program_stage_counts, non_null(:cj_program_stage_counts),
      resolve: &IngestionResolver.cj_program_stage_counts/3

    @desc "Returns CJ feeds that cannot be associated with an advertiser program."
    connection field :unmatched_cj_feeds,
                 node_type: :merchant_feed_candidate,
                 non_null_connection: true do
      resolve(&IngestionResolver.unmatched_cj_feeds/3)
    end
  end
end
