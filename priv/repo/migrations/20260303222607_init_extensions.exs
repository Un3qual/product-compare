defmodule ProductCompare.Repo.Migrations.InitExtensions do
  use Ecto.Migration

  @domain_enum_types [
    user_token_context: ~w(session confirm reset_password),
    product_taxon_source_type: ~w(scrape user derived editorial),
    attribute_data_type: ~w(bool int numeric text enum date timestamp json),
    product_attribute_claim_source_type: ~w(scrape user import derived),
    product_attribute_claim_status: ~w(proposed accepted rejected superseded),
    coupon_discount_type: ~w(percent amount free_shipping other),
    commerce_link_type: ~w(affiliate non_affiliate),
    commerce_source_surface: ~w(web api extension),
    commerce_conversion_status: ~w(pending approved reversed paid),
    commerce_attribution_confidence: ~w(high low unmatched),
    ingestion_run_status: ~w(running succeeded failed),
    ingestion_reconciliation_status:
      ~w(not_requested pending succeeded skipped_partial skipped_failed skipped_superseded),
    product_identifier_scheme: ~w(gtin mpn),
    product_identifier_verification_status: ~w(unverified validated rejected),
    product_media_role: ~w(primary gallery),
    category_mapping_status: ~w(pending mapped dismissed),
    specification_correction_status: ~w(pending accepted rejected),
    price_watch_rule_type: ~w(target_price percentage_drop back_in_stock newly_available),
    alert_delivery_transport: ~w(in_app email webhook),
    alert_delivery_state: ~w(pending delivered failed),
    community_moderation_status: ~w(pending published hidden rejected removed),
    community_report_status: ~w(pending resolved dismissed),
    community_content_type: ~w(review question answer),
    community_action_kind: ~w(review question answer report),
    cj_program_stage: ~w(new considering selected applied accepted not_pursuing declined)
  ]

  def change do
    execute(
      """
      DO $$
      BEGIN
        IF current_setting('server_version_num')::int < 180000 THEN
          RAISE EXCEPTION 'PostgreSQL 18+ is required for uuidv7() support';
        END IF;
      END
      $$;
      """,
      "SELECT 1"
    )

    execute("CREATE EXTENSION IF NOT EXISTS citext", "DROP EXTENSION IF EXISTS citext")

    Enum.each(@domain_enum_types, fn {name, values} ->
      labels = Enum.map_join(values, ", ", &"'#{&1}'")
      execute("CREATE TYPE #{name} AS ENUM (#{labels})", "DROP TYPE #{name}")
    end)
  end
end
