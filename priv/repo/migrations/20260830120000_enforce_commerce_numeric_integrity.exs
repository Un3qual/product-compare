defmodule ProductCompare.Repo.Migrations.EnforceCommerceNumericIntegrity do
  use Ecto.Migration

  def up do
    drop constraint(:commerce_conversions, :commerce_conversions_amounts_non_negative)

    create constraint(:commerce_conversions, :commerce_conversions_amounts_non_negative,
             check: """
             (order_amount IS NULL OR (order_amount >= 0 AND order_amount < 'Infinity'::numeric)) AND
             (commission_amount IS NULL OR (commission_amount >= 0 AND commission_amount < 'Infinity'::numeric)) AND
             (commission_rate IS NULL OR (commission_rate >= 0 AND commission_rate < 'Infinity'::numeric))
             """
           )

    drop constraint(:purchase_price_facts, :purchase_price_facts_amounts_non_negative)

    create constraint(:purchase_price_facts, :purchase_price_facts_amounts_non_negative,
             check: """
             reported_paid_price >= 0 AND reported_paid_price < 'Infinity'::numeric AND
             (listed_price_at_click IS NULL OR (listed_price_at_click >= 0 AND listed_price_at_click < 'Infinity'::numeric)) AND
             (shipping_amount IS NULL OR (shipping_amount >= 0 AND shipping_amount < 'Infinity'::numeric)) AND
             (tax_amount IS NULL OR (tax_amount >= 0 AND tax_amount < 'Infinity'::numeric)) AND
             (discount_amount IS NULL OR (discount_amount >= 0 AND discount_amount < 'Infinity'::numeric)) AND
             (observed_price IS NULL OR (observed_price >= 0 AND observed_price < 'Infinity'::numeric))
             """
           )

    create constraint(:purchase_price_facts, :purchase_price_facts_price_delta_finite,
             check:
               "price_delta IS NULL OR (price_delta > '-Infinity'::numeric AND price_delta < 'Infinity'::numeric)"
           )
  end

  def down do
    drop constraint(:purchase_price_facts, :purchase_price_facts_price_delta_finite)
    drop constraint(:purchase_price_facts, :purchase_price_facts_amounts_non_negative)

    create constraint(:purchase_price_facts, :purchase_price_facts_amounts_non_negative,
             check: """
             reported_paid_price >= 0 AND
             (listed_price_at_click IS NULL OR listed_price_at_click >= 0) AND
             (shipping_amount IS NULL OR shipping_amount >= 0) AND
             (tax_amount IS NULL OR tax_amount >= 0) AND
             (discount_amount IS NULL OR discount_amount >= 0) AND
             (observed_price IS NULL OR observed_price >= 0)
             """
           )

    drop constraint(:commerce_conversions, :commerce_conversions_amounts_non_negative)

    create constraint(:commerce_conversions, :commerce_conversions_amounts_non_negative,
             check: """
             (order_amount IS NULL OR order_amount >= 0) AND
             (commission_amount IS NULL OR commission_amount >= 0) AND
             (commission_rate IS NULL OR commission_rate >= 0)
             """
           )
  end
end
