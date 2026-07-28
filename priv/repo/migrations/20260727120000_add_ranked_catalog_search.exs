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
    ADD COLUMN search_document tsvector
    """)
  end

  def down do
    execute("ALTER TABLE products DROP COLUMN search_document")
    execute("DROP FUNCTION catalog_search_document(text, text, text, text, text)")
  end
end
