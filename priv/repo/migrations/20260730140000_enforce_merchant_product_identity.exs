defmodule ProductCompare.Repo.Migrations.EnforceMerchantProductIdentity do
  use Ecto.Migration

  def up do
    execute("""
    CREATE FUNCTION enforce_merchant_product_identity()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
      IF NEW.merchant_id IS DISTINCT FROM OLD.merchant_id
         OR NEW.product_id IS DISTINCT FROM OLD.product_id
         OR NEW.url IS DISTINCT FROM OLD.url
         OR NEW.currency_id IS DISTINCT FROM OLD.currency_id THEN
        RAISE EXCEPTION 'merchant offer identity is immutable'
          USING ERRCODE = '23514',
                CONSTRAINT = 'merchant_products_identity_immutable';
      END IF;

      RETURN NEW;
    END
    $$;
    """)

    execute("""
    CREATE TRIGGER merchant_products_enforce_identity
    BEFORE UPDATE ON merchant_products
    FOR EACH ROW EXECUTE FUNCTION enforce_merchant_product_identity();
    """)
  end

  def down do
    execute("DROP TRIGGER merchant_products_enforce_identity ON merchant_products")
    execute("DROP FUNCTION enforce_merchant_product_identity()")
  end
end
