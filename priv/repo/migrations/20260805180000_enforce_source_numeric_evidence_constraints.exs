defmodule ProductCompare.Repo.Migrations.EnforceSourceNumericEvidenceConstraints do
  use Ecto.Migration

  def up do
    create constraint(
             :price_points,
             :price_points_price_finite_non_negative,
             check: "price >= 0 AND price < 'Infinity'::numeric"
           )

    create constraint(
             :price_points,
             :price_points_shipping_finite_non_negative,
             check: "shipping IS NULL OR (shipping >= 0 AND shipping < 'Infinity'::numeric)"
           )

    create constraint(
             :price_watch_rules,
             :price_watch_rules_target_amount_finite_non_negative,
             check:
               "target_amount IS NULL OR (target_amount >= 0 AND target_amount < 'Infinity'::numeric)"
           )
  end

  def down do
    drop constraint(
           :price_watch_rules,
           :price_watch_rules_target_amount_finite_non_negative
         )

    drop constraint(:price_points, :price_points_shipping_finite_non_negative)
    drop constraint(:price_points, :price_points_price_finite_non_negative)
  end
end
