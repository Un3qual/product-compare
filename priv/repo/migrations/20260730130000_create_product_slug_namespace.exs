defmodule ProductCompare.Repo.Migrations.CreateProductSlugNamespace do
  use Ecto.Migration

  def up do
    create table(:product_slug_reservations) do
      add :slug, :text, null: false
      add :product_id, references(:products, type: :bigint, on_delete: :delete_all), null: false

      timestamps(updated_at: false)
    end

    create unique_index(:product_slug_reservations, [:slug], name: :product_slug_namespace_uq)

    create index(:product_slug_reservations, [:product_id],
             name: :product_slug_reservations_product_idx
           )

    execute("""
    INSERT INTO product_slug_reservations (slug, product_id, inserted_at)
    SELECT slug, id, now()
    FROM products
    """)

    execute("""
    INSERT INTO product_slug_reservations (slug, product_id, inserted_at)
    SELECT slug, product_id, now()
    FROM product_slug_aliases
    """)

    execute("""
    CREATE FUNCTION maintain_product_slug_reservation()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
      IF TG_OP = 'INSERT' THEN
        INSERT INTO product_slug_reservations (slug, product_id, inserted_at)
        VALUES (NEW.slug, NEW.id, now());
        RETURN NEW;
      ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.slug IS DISTINCT FROM OLD.slug THEN
          DELETE FROM product_slug_reservations
          WHERE slug = OLD.slug AND product_id = OLD.id;

          INSERT INTO product_slug_reservations (slug, product_id, inserted_at)
          VALUES (NEW.slug, NEW.id, now());
        END IF;

        RETURN NEW;
      ELSE
        DELETE FROM product_slug_reservations
        WHERE slug = OLD.slug AND product_id = OLD.id;
        RETURN OLD;
      END IF;
    END
    $$;
    """)

    execute("""
    CREATE FUNCTION maintain_product_slug_alias_reservation()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
      IF TG_OP = 'INSERT' THEN
        INSERT INTO product_slug_reservations (slug, product_id, inserted_at)
        VALUES (NEW.slug, NEW.product_id, now());
        RETURN NEW;
      ELSE
        DELETE FROM product_slug_reservations
        WHERE slug = OLD.slug AND product_id = OLD.product_id;
        RETURN OLD;
      END IF;
    END
    $$;
    """)

    execute("""
    CREATE FUNCTION prevent_product_slug_alias_updates()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
      IF NEW.slug IS DISTINCT FROM OLD.slug
         OR NEW.product_id IS DISTINCT FROM OLD.product_id THEN
        RAISE EXCEPTION 'product slug aliases are immutable'
          USING ERRCODE = '23514',
                CONSTRAINT = 'product_slug_aliases_identity_immutable';
      END IF;

      RETURN NEW;
    END
    $$;
    """)

    execute("""
    CREATE TRIGGER products_maintain_slug_reservation
    AFTER INSERT OR UPDATE OF slug OR DELETE ON products
    FOR EACH ROW EXECUTE FUNCTION maintain_product_slug_reservation();
    """)

    execute("""
    CREATE TRIGGER product_slug_aliases_maintain_reservation
    AFTER INSERT OR DELETE ON product_slug_aliases
    FOR EACH ROW EXECUTE FUNCTION maintain_product_slug_alias_reservation();
    """)

    execute("""
    CREATE TRIGGER product_slug_aliases_prevent_updates
    BEFORE UPDATE ON product_slug_aliases
    FOR EACH ROW EXECUTE FUNCTION prevent_product_slug_alias_updates();
    """)
  end

  def down do
    execute("DROP TRIGGER product_slug_aliases_prevent_updates ON product_slug_aliases")
    execute("DROP TRIGGER product_slug_aliases_maintain_reservation ON product_slug_aliases")
    execute("DROP TRIGGER products_maintain_slug_reservation ON products")
    execute("DROP FUNCTION prevent_product_slug_alias_updates()")
    execute("DROP FUNCTION maintain_product_slug_alias_reservation()")
    execute("DROP FUNCTION maintain_product_slug_reservation()")

    drop table(:product_slug_reservations)
  end
end
