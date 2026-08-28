defmodule ProductCompareWeb.Schema.CommerceAttribution.Types do
  use Absinthe.Schema.Notation
  use Absinthe.Relay.Schema.Notation, :modern

  enum :commerce_click_source_surface do
    value(:web)
    value(:api)
    value(:extension)
  end

  enum :commerce_attribution_link_type do
    value(:affiliate)
    value(:non_affiliate)
  end

  enum :commerce_conversion_status do
    value(:pending)
    value(:approved)
    value(:reversed)
    value(:paid)
  end

  enum :commerce_attribution_confidence do
    value(:high)
    value(:low)
    value(:unmatched)
  end

  enum :cj_commission_ingestion_activity_state,
    name: "CJCommissionIngestionActivityState" do
    value(:suspended)
    value(:available)
    value(:scheduled)
    value(:executing)
    value(:retryable)
  end

  enum :cj_commission_sync_run_status, name: "CJCommissionSyncRunStatus" do
    value(:running)
    value(:succeeded)
    value(:failed)
  end

  enum :cj_commission_sync_run_trigger, name: "CJCommissionSyncRunTrigger" do
    value(:scheduled)
    value(:operator)
    value(:cli)
  end

  input_object :track_commerce_click_input do
    field :merchant_product_id, non_null(:id)
  end

  input_object :revenue_summary_input do
    field :merchant_id, :id
    field :product_id, :id
    field :network, :string
    field :currency, :string
    field :from, :string
    field :to, :string
  end

  input_object :update_cj_commission_ingestion_settings_input,
    name: "UpdateCJCommissionIngestionSettingsInput" do
    field :enabled, :boolean
    field :interval_minutes, :integer
    field :lookback_days, :integer
    field :max_pages, :integer
  end

  object :revenue_summary do
    field :filters, non_null(:revenue_summary_filters)
    field :metrics, non_null(:revenue_summary_metrics)
  end

  object :revenue_summary_filters do
    field :currency, :string
    field :from, :string
    field :merchant_id, :id
    field :network, :string
    field :product_id, :id
    field :to, :string
  end

  object :revenue_summary_metrics do
    field :average_paid_price, :string
    field :clicks, :integer
    field :commission_revenue, :string
    field :conversions, :integer
    field :currency, :string
    field :gross_order_value, :string
  end

  object :commerce_attribution_click do
    field :click_id, non_null(:id)
    field :inserted_at, non_null(:datetime)
    field :source_surface, non_null(:commerce_click_source_surface)
    field :user_id, :id
    field :user_email, :string
    field :anonymous_visitor, non_null(:boolean)
    field :referrer, :string
    field :user_agent, :string
    field :ip_address, :string
    field :merchant_id, non_null(:id)
    field :merchant_name, non_null(:string)
    field :product_id, :id
    field :product_name, :string
    field :merchant_product_id, :id
    field :merchant_product_external_sku, :string
    field :affiliate_program_id, :id
    field :affiliate_program_code, :string
    field :affiliate_network_id, :id
    field :affiliate_network_code, :string
    field :affiliate_network_name, :string
    field :link_type, non_null(:commerce_attribution_link_type)

    field :matched_conversions,
          non_null(list_of(non_null(:commerce_attribution_matched_conversion)))
  end

  object :commerce_attribution_matched_conversion do
    field :affiliate_network_id, :id
    field :affiliate_network_code, :string
    field :affiliate_network_name, :string
    field :merchant_id, :id
    field :merchant_name, :string
    field :product_id, :id
    field :product_name, :string
    field :network_conversion_ref, non_null(:string)
    field :status, non_null(:commerce_conversion_status)
    field :attribution_confidence, non_null(:commerce_attribution_confidence)
    field :currency, non_null(:string)
    field :order_amount, :decimal
    field :commission_amount, :decimal
    field :purchased_at, :datetime
    field :reported_at, non_null(:datetime)
  end

  object :cj_commission_ingestion, name: "CJCommissionIngestion" do
    field :settings, non_null(:cj_commission_ingestion_settings)
    field :credentials, non_null(:cj_commission_credential_status)
    field :activity, :cj_commission_ingestion_activity
    field :latest_success, :cj_commission_sync_run
    field :latest_failure, :cj_commission_sync_run
  end

  object :cj_commission_ingestion_settings, name: "CJCommissionIngestionSettings" do
    field :enabled, non_null(:boolean)
    field :interval_minutes, non_null(:integer)
    field :lookback_days, non_null(:integer)
    field :max_pages, non_null(:integer)
    field :next_run_at, :datetime
    field :updated_at, non_null(:datetime)
    field :updated_by_email, :string
  end

  object :cj_commission_credential_status, name: "CJCommissionCredentialStatus" do
    field :api_token_configured, non_null(:boolean)
    field :account_id_configured, non_null(:boolean)
    field :ready, non_null(:boolean)
  end

  object :cj_commission_ingestion_activity, name: "CJCommissionIngestionActivity" do
    field :state, non_null(:cj_commission_ingestion_activity_state)
    field :window_start, :datetime
    field :window_end, :datetime
    field :scheduled_at, :datetime
    field :attempted_at, :datetime
  end

  object :cj_commission_sync_run, name: "CJCommissionSyncRun" do
    field :id, non_null(:id)
    field :status, non_null(:cj_commission_sync_run_status)
    field :trigger, non_null(:cj_commission_sync_run_trigger)
    field :requester_email, :string
    field :window_start, non_null(:datetime)
    field :window_end, non_null(:datetime)
    field :cursor, :string
    field :pages_fetched, non_null(:integer)
    field :records_fetched, non_null(:integer)
    field :records_persisted, non_null(:integer)
    field :records_failed, non_null(:integer)
    field :started_at, non_null(:datetime)
    field :finished_at, :datetime
    field :error_summary, :string
  end

  connection node_type: :commerce_attribution_click,
             non_null_edges: true,
             non_null_edge: true do
    edge do
      field :node, non_null(:commerce_attribution_click)
      field :cursor, non_null(:string)
    end
  end

  connection node_type: :cj_commission_sync_run,
             name: "CJCommissionSyncRunConnection",
             non_null_edges: true,
             non_null_edge: true do
    @desc "A CJ commission sync run connection edge."
    edge name: "CJCommissionSyncRunEdge" do
      field :node, non_null(:cj_commission_sync_run)
      field :cursor, non_null(:string)
    end
  end

  object :track_commerce_click_payload do
    field :redirect_path, :string
    field :errors, non_null(list_of(non_null(:mutation_error)))
  end

  object :cj_commission_ingestion_payload, name: "CJCommissionIngestionPayload" do
    field :ingestion, :cj_commission_ingestion
    field :errors, non_null(list_of(non_null(:mutation_error)))
  end
end
