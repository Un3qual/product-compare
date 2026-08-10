defmodule ProductCompare.Repo.Migrations.EnforceProductAttributeClaimReferenceIntegrity do
  use Ecto.Migration

  def up do
    create constraint(
             :product_attribute_claims,
             :product_attribute_claims_numeric_companions_check,
             check: """
             (value_num IS NOT NULL AND unit_id IS NOT NULL AND value_num_base IS NOT NULL)
             OR
             (value_num IS NULL AND unit_id IS NULL AND value_num_base IS NULL
              AND value_num_base_min IS NULL AND value_num_base_max IS NULL)
             """
           )

    create constraint(
             :product_attribute_claims,
             :product_attribute_claims_numeric_range_order_check,
             check: """
             value_num_base_min IS NULL OR value_num_base_max IS NULL
             OR value_num_base_min <= value_num_base_max
             """
           )

    execute("""
    ALTER TABLE product_attribute_claims
    DROP CONSTRAINT product_attribute_claims_unit_id_fkey
    """)

    execute("""
    ALTER TABLE product_attribute_claims
    ADD CONSTRAINT product_attribute_claims_unit_id_fkey
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE RESTRICT
    """)
  end

  def down do
    drop constraint(
           :product_attribute_claims,
           :product_attribute_claims_numeric_range_order_check
         )

    drop constraint(
           :product_attribute_claims,
           :product_attribute_claims_numeric_companions_check
         )

    execute("""
    ALTER TABLE product_attribute_claims
    DROP CONSTRAINT product_attribute_claims_unit_id_fkey
    """)

    execute("""
    ALTER TABLE product_attribute_claims
    ADD CONSTRAINT product_attribute_claims_unit_id_fkey
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL
    """)
  end
end
