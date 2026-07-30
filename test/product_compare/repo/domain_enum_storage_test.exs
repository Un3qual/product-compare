defmodule ProductCompare.Repo.DomainEnumStorageTest do
  use ProductCompare.DataCase, async: true

  @enum_columns [
    {"users_tokens", "context", "user_token_context"},
    {"product_taxons", "source_type", "product_taxon_source_type"},
    {"attributes", "data_type", "attribute_data_type"},
    {"product_attribute_claims", "source_type", "product_attribute_claim_source_type"},
    {"product_attribute_claims", "status", "product_attribute_claim_status"},
    {"coupons", "discount_type", "coupon_discount_type"},
    {"commerce_links", "link_type", "commerce_link_type"},
    {"commerce_click_sessions", "source_surface", "commerce_source_surface"},
    {"commerce_conversions", "status", "commerce_conversion_status"},
    {"commerce_conversions", "attribution_confidence", "commerce_attribution_confidence"},
    {"ingestion_runs", "status", "ingestion_run_status"},
    {"ingestion_runs", "reconciliation_status", "ingestion_reconciliation_status"},
    {"product_identifiers", "scheme", "product_identifier_scheme"},
    {"product_identifiers", "verification_status", "product_identifier_verification_status"},
    {"product_media", "role", "product_media_role"},
    {"category_mapping_candidates", "status", "category_mapping_status"},
    {"specification_corrections", "status", "specification_correction_status"},
    {"price_watch_rules", "rule_type", "price_watch_rule_type"},
    {"alert_events", "rule_type", "price_watch_rule_type"},
    {"alert_delivery_attempts", "transport", "alert_delivery_transport"},
    {"alert_delivery_attempts", "state", "alert_delivery_state"},
    {"product_reviews", "moderation_status", "community_moderation_status"},
    {"product_threads", "moderation_status", "community_moderation_status"},
    {"thread_posts", "moderation_status", "community_moderation_status"},
    {"community_reports", "status", "community_report_status"},
    {"community_write_receipts", "content_type", "community_content_type"},
    {"community_write_windows", "action_kind", "community_action_kind"},
    {"cj_programs", "stage", "cj_program_stage"},
    {"comparison_snapshot_attributes", "source_type", "product_attribute_claim_source_type"},
    {"comparison_snapshot_offers", "freshness", "offer_freshness"},
    {"comparison_snapshot_recommendations", "profile", "recommendation_profile"},
    {"comparison_snapshot_recommendations", "status", "recommendation_status"}
  ]

  test "closed domain columns use their native PostgreSQL enum types" do
    Enum.each(@enum_columns, fn {table, column, expected_udt} ->
      assert %{rows: [[data_type, udt_name]]} =
               Repo.query!(
                 """
                 SELECT data_type, udt_name
                 FROM information_schema.columns
                 WHERE table_schema = current_schema()
                   AND table_name = $1
                   AND column_name = $2
                 """,
                 [table, column]
               )

      assert data_type == "USER-DEFINED",
             "#{table}.#{column} uses #{data_type}, expected native enum #{expected_udt}"

      assert udt_name == expected_udt,
             "#{table}.#{column} uses #{udt_name}, expected #{expected_udt}"
    end)
  end
end
