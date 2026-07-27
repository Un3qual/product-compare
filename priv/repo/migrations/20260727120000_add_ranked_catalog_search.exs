defmodule ProductCompare.Repo.Migrations.AddRankedCatalogSearch do
  use Ecto.Migration

  def up do
    execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")

    execute("""
    CREATE OR REPLACE FUNCTION catalog_search_document(
      product_name text,
      product_slug text,
      product_model_number text,
      product_description text,
      brand_name text
    ) RETURNS tsvector
    LANGUAGE sql
    IMMUTABLE
    PARALLEL SAFE
    RETURN
      setweight(
        to_tsvector(
          'simple',
          concat_ws(
            ' ',
            brand_name,
            product_name,
            product_model_number,
            replace(product_slug, '-', ' ')
          )
        ),
        'A'
      ) ||
      setweight(
        to_tsvector(
          'english',
          concat_ws(
            ' ',
            brand_name,
            product_name,
            replace(product_slug, '-', ' ')
          )
        ),
        'B'
      ) ||
      setweight(
        to_tsvector('simple', coalesce(product_description, '')),
        'C'
      ) ||
      setweight(
        to_tsvector('english', coalesce(product_description, '')),
        'D'
      )
    """)

    execute("""
    ALTER TABLE products
    ADD COLUMN search_document tsvector NOT NULL DEFAULT ''::tsvector
    """)

    execute("""
    UPDATE products AS product
    SET search_document = catalog_search_document(
      product.name,
      product.slug,
      product.model_number,
      product.description,
      (
        SELECT brand.name
        FROM brands AS brand
        WHERE brand.id = product.brand_id
      )
    )
    """)

    execute("CREATE INDEX products_search_document_idx ON products USING gin (search_document)")

    execute(
      "CREATE INDEX products_name_trgm_idx ON products USING gin (lower(name) gin_trgm_ops)"
    )

    execute(
      "CREATE INDEX products_slug_trgm_idx ON products USING gin (lower(slug) gin_trgm_ops)"
    )

    execute(
      "CREATE INDEX products_model_number_trgm_idx ON products USING gin (lower(model_number) gin_trgm_ops)"
    )

    execute("CREATE INDEX brands_name_trgm_idx ON brands USING gin (lower(name) gin_trgm_ops)")
  end

  def down do
    execute("DROP INDEX brands_name_trgm_idx")
    execute("DROP INDEX products_model_number_trgm_idx")
    execute("DROP INDEX products_slug_trgm_idx")
    execute("DROP INDEX products_name_trgm_idx")
    execute("DROP INDEX products_search_document_idx")
    execute("ALTER TABLE products DROP COLUMN search_document")
    execute("DROP FUNCTION catalog_search_document(text, text, text, text, text)")
  end
end
