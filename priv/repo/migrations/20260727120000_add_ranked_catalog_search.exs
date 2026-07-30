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
      ts_delete(
        setweight(
          to_tsvector('simple', coalesce(brand_name, '')) ||
          $$'catalog search boundary':1$$::tsvector ||
          to_tsvector('simple', coalesce(product_name, '')) ||
          $$'catalog search boundary':1$$::tsvector ||
          to_tsvector('simple', coalesce(product_model_number, '')) ||
          $$'catalog search boundary':1$$::tsvector ||
          to_tsvector('simple', coalesce(replace(product_slug, '-', ' '), '')),
          'A'
        ) ||
        $$'catalog search boundary':1$$::tsvector ||
        setweight(
          to_tsvector('english', coalesce(brand_name, '')) ||
          $$'catalog search boundary':1$$::tsvector ||
          to_tsvector('english', coalesce(product_name, '')) ||
          $$'catalog search boundary':1$$::tsvector ||
          to_tsvector('english', coalesce(replace(product_slug, '-', ' '), '')),
          'B'
        ) ||
        $$'catalog search boundary':1$$::tsvector ||
        setweight(
          to_tsvector('simple', coalesce(product_description, '')),
          'C'
        ) ||
        $$'catalog search boundary':1$$::tsvector ||
        setweight(
          to_tsvector('english', coalesce(product_description, '')),
          'D'
        ),
        'catalog search boundary'
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
