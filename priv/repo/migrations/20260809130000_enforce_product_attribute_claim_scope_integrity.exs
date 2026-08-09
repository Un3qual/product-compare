defmodule ProductCompare.Repo.Migrations.EnforceProductAttributeClaimScopeIntegrity do
  use Ecto.Migration

  def up do
    create unique_index(
             :product_attribute_claims,
             [:product_id, :attribute_id, :id],
             name: :product_attribute_claims_product_attribute_id_uq
           )

    execute("""
    ALTER TABLE product_attribute_current
    DROP CONSTRAINT product_attribute_current_claim_id_fkey,
    ADD CONSTRAINT product_attribute_current_claim_scope_fkey
    FOREIGN KEY (product_id, attribute_id, claim_id)
    REFERENCES product_attribute_claims(product_id, attribute_id, id)
    ON DELETE CASCADE
    """)

    execute("""
    ALTER TABLE specification_corrections
    DROP CONSTRAINT specification_corrections_claim_id_fkey,
    ADD CONSTRAINT specification_corrections_claim_scope_fkey
    FOREIGN KEY (product_id, attribute_id, claim_id)
    REFERENCES product_attribute_claims(product_id, attribute_id, id)
    ON DELETE CASCADE
    """)
  end

  def down do
    execute("""
    ALTER TABLE product_attribute_current
    DROP CONSTRAINT product_attribute_current_claim_scope_fkey,
    ADD CONSTRAINT product_attribute_current_claim_id_fkey
    FOREIGN KEY (claim_id)
    REFERENCES product_attribute_claims(id)
    ON DELETE CASCADE
    """)

    execute("""
    ALTER TABLE specification_corrections
    DROP CONSTRAINT specification_corrections_claim_scope_fkey,
    ADD CONSTRAINT specification_corrections_claim_id_fkey
    FOREIGN KEY (claim_id)
    REFERENCES product_attribute_claims(id)
    ON DELETE CASCADE
    """)

    drop index(:product_attribute_claims, [:product_id, :attribute_id, :id],
           name: :product_attribute_claims_product_attribute_id_uq
         )
  end
end
