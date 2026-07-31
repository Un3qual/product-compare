defmodule ProductCompare.Repo.Migrations.CreateProductSlugNamespace do
  use Ecto.Migration

  def up do
    create table(:product_slug_reservations) do
      add :slug, :text, null: false
      add :product_id, references(:products, type: :bigint, on_delete: :delete_all), null: false
      add :is_alias, :boolean, null: false

      timestamps(updated_at: false)
    end

    create unique_index(:product_slug_reservations, [:slug], name: :product_slug_namespace_uq)

    create index(:product_slug_reservations, [:product_id],
             name: :product_slug_reservations_product_idx
           )

    execute("""
    INSERT INTO product_slug_reservations (slug, product_id, is_alias, inserted_at)
    SELECT slug, id, false, now()
    FROM products
    """)

    execute("""
    INSERT INTO product_slug_reservations (slug, product_id, is_alias, inserted_at)
    SELECT slug, product_id, true, now()
    FROM product_slug_aliases
    """)

    execute("""
    CREATE FUNCTION maintain_product_slug_reservation()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
      IF TG_OP = 'INSERT' THEN
        INSERT INTO product_slug_reservations (slug, product_id, is_alias, inserted_at)
        VALUES (NEW.slug, NEW.id, false, now());
        RETURN NEW;
      ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.slug IS DISTINCT FROM OLD.slug THEN
          DELETE FROM product_slug_reservations
          WHERE slug = OLD.slug AND product_id = OLD.id AND is_alias = false;

          INSERT INTO product_slug_reservations (slug, product_id, is_alias, inserted_at)
          VALUES (NEW.slug, NEW.id, false, now());
        END IF;

        RETURN NEW;
      ELSE
        DELETE FROM product_slug_reservations
        WHERE slug = OLD.slug AND product_id = OLD.id AND is_alias = false;
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
        INSERT INTO product_slug_reservations (slug, product_id, is_alias, inserted_at)
        VALUES (NEW.slug, NEW.product_id, true, now());
        RETURN NEW;
      ELSE
        DELETE FROM product_slug_reservations
        WHERE slug = OLD.slug AND product_id = OLD.product_id AND is_alias = true;
        RETURN OLD;
      END IF;
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
  end

  def down do
    execute("DROP TRIGGER product_slug_aliases_maintain_reservation ON product_slug_aliases")
    execute("DROP TRIGGER products_maintain_slug_reservation ON products")
    execute("DROP FUNCTION maintain_product_slug_alias_reservation()")
    execute("DROP FUNCTION maintain_product_slug_reservation()")

    drop table(:product_slug_reservations)
  end
end
