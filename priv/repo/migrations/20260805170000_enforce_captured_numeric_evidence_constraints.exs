defmodule ProductCompare.Repo.Migrations.EnforceCapturedNumericEvidenceConstraints do
  use Ecto.Migration

  def up do
    create constraint(
             :comparison_snapshot_attributes,
             :comparison_snapshot_attributes_confidence_range,
             check: "confidence IS NULL OR (confidence >= 0 AND confidence <= 1)"
           )

    create constraint(
             :comparison_snapshot_offers,
             :comparison_snapshot_offers_amounts_non_negative,
             check:
               "item_price >= 0 AND item_price < 'Infinity'::numeric AND shipping >= 0 AND shipping < 'Infinity'::numeric AND landed_price >= 0 AND landed_price < 'Infinity'::numeric"
           )

    create constraint(
             :comparison_snapshot_rankings,
             :comparison_snapshot_rankings_landed_price_non_negative,
             check: "landed_price >= 0 AND landed_price < 'Infinity'::numeric"
           )

    create constraint(
             :price_watch_rules,
             :price_watch_rules_baseline_landed_price_non_negative,
             check:
               "baseline_landed_price IS NULL OR (baseline_landed_price >= 0 AND baseline_landed_price < 'Infinity'::numeric)"
           )

    create constraint(:alert_events, :alert_events_numeric_evidence_bounds,
             check:
               "item_price >= 0 AND item_price < 'Infinity'::numeric AND shipping >= 0 AND shipping < 'Infinity'::numeric AND landed_price >= 0 AND landed_price < 'Infinity'::numeric AND (baseline_landed_price IS NULL OR (baseline_landed_price >= 0 AND baseline_landed_price < 'Infinity'::numeric)) AND (target_amount IS NULL OR (target_amount >= 0 AND target_amount < 'Infinity'::numeric)) AND (percentage_drop IS NULL OR (percentage_drop > 0 AND percentage_drop <= 100))"
           )
  end

  def down do
    drop constraint(:alert_events, :alert_events_numeric_evidence_bounds)
    drop constraint(:price_watch_rules, :price_watch_rules_baseline_landed_price_non_negative)

    drop constraint(
           :comparison_snapshot_rankings,
           :comparison_snapshot_rankings_landed_price_non_negative
         )

    drop constraint(:comparison_snapshot_offers, :comparison_snapshot_offers_amounts_non_negative)

    drop constraint(
           :comparison_snapshot_attributes,
           :comparison_snapshot_attributes_confidence_range
         )
  end
end
