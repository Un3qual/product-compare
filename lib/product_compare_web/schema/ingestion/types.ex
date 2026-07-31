defmodule ProductCompareWeb.Schema.Ingestion.Types do
  use Absinthe.Schema.Notation
  use Absinthe.Relay.Schema.Notation, :modern

  alias ProductCompareWeb.GraphQL.GlobalId
  alias ProductCompareWeb.Resolvers.IngestionResolver

  input_object :update_cj_program_input do
    field :id, non_null(:id)
    field :stage, non_null(:cj_program_stage)
    field :note, :string
    field :expected_changed_at, non_null(:datetime)
  end

  object :update_cj_program_payload do
    field :program, :cj_program
    field :errors, non_null(list_of(non_null(:mutation_error)))
  end

  enum :cj_program_stage, name: "CJProgramStage" do
    value(:new, as: :new)
    value(:considering, as: :considering)
    value(:selected, as: :selected)
    value(:applied, as: :applied)
    value(:accepted, as: :accepted)
    value(:not_pursuing, as: :not_pursuing)
    value(:declined, as: :declined)
  end

  enum :cj_program_sort, name: "CJProgramSort" do
    value(:name_asc, as: :name_asc)
    value(:last_changed_desc, as: :last_changed_desc)
    value(:feed_count_desc, as: :feed_count_desc)
  end

  enum :cj_program_warning_code, name: "CJProgramWarningCode" do
    value(:missing_advertiser_name, as: "missing_advertiser_name")
    value(:missing_product_count, as: "missing_product_count")
    value(:non_us_market, as: "non_us_market")
    value(:non_usd_currency, as: "non_usd_currency")
    value(:non_english_language, as: "non_english_language")
  end

  node object(:cj_program, name: "CJProgram", id_fetcher: &GlobalId.fetch_entropy_id/2) do
    field :advertiser_id, non_null(:string)
    field :advertiser_name, :string, resolve: &IngestionResolver.cj_program_advertiser_name/3
    field :stage, non_null(:cj_program_stage)
    field :note, :string

    field :last_changed, non_null(:datetime),
      resolve: fn program, _, _ -> {:ok, program.changed_at} end

    field :feed_count, :integer, resolve: &IngestionResolver.cj_program_feed_count/3

    field :warning_codes, non_null(list_of(non_null(:cj_program_warning_code))),
      resolve: &IngestionResolver.cj_program_warning_codes/3

    connection field :feeds,
                 node_type: :merchant_feed_candidate,
                 non_null_connection: true,
                 paginate: :forward do
      resolve(&IngestionResolver.cj_program_feeds/3)
    end
  end

  object :cj_program_stage_counts, name: "CJProgramStageCounts" do
    field :new, non_null(:integer)
    field :considering, non_null(:integer)
    field :selected, non_null(:integer)
    field :applied, non_null(:integer)
    field :accepted, non_null(:integer)
    field :not_pursuing, non_null(:integer)
    field :declined, non_null(:integer)
  end

  connection node_type: :cj_program, non_null_edges: true, non_null_edge: true do
    edge do
      field :node, non_null(:cj_program)
      field :cursor, non_null(:string)
    end
  end

  node object(:merchant_feed_candidate) do
    field :provider, non_null(:string)
    field :provider_feed_id, non_null(:string)
    field :advertiser_id, :string
    field :advertiser_name, :string
    field :advertiser_country, :string
    field :source_feed_type, :string
    field :currency, :string
    field :language, :string
    field :feed_name, :string
    field :product_count, :integer
    field :provider_last_updated_at, :datetime
    field :last_seen_at, non_null(:datetime)
  end

  connection node_type: :merchant_feed_candidate, non_null_edges: true, non_null_edge: true do
    edge do
      field :node, non_null(:merchant_feed_candidate)
      field :cursor, non_null(:string)
    end
  end
end
