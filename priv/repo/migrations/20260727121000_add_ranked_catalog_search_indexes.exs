defmodule ProductCompare.Repo.Migrations.AddRankedCatalogSearchIndexes do
  use Ecto.Migration

  @disable_ddl_transaction true
  @disable_migration_lock true

  @indexes [
    {"products_search_document_idx", "ON products USING gin (search_document)"},
    {"products_name_trgm_idx", "ON products USING gin (lower(name) gin_trgm_ops)"},
    {"products_slug_trgm_idx", "ON products USING gin (lower(slug) gin_trgm_ops)"},
    {"products_model_number_trgm_idx",
     "ON products USING gin (lower(model_number) gin_trgm_ops)"},
    {"products_description_trgm_idx", "ON products USING gin (lower(description) gin_trgm_ops)"},
    {"brands_name_trgm_idx", "ON brands USING gin (lower(name) gin_trgm_ops)"},
    {"products_name_trigram_candidates_idx",
     "ON products USING gin (show_trgm(lower(coalesce(name, ''))))"},
    {"products_slug_trigram_candidates_idx",
     "ON products USING gin (show_trgm(lower(coalesce(slug, ''))))"},
    {"products_model_number_trigram_candidates_idx",
     "ON products USING gin (show_trgm(lower(coalesce(model_number, ''))))"},
    {"brands_name_trigram_candidates_idx", "ON brands USING gin (show_trgm(lower(name)))"}
  ]

  def up do
    for {name, definition} <- @indexes do
      execute("CREATE INDEX CONCURRENTLY IF NOT EXISTS #{name} #{definition}")
    end
  end

  def down do
    for {name, _definition} <- Enum.reverse(@indexes) do
      execute("DROP INDEX CONCURRENTLY IF EXISTS #{name}")
    end
  end
end
