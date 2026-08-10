defmodule ProductCompare.Repo.Migrations.EnforceCoreIdentifierStorageIntegrity do
  use Ecto.Migration

  def up do
    create constraint(:products, :products_slug_format_check,
             check: "(slug COLLATE \"C\") ~ '^[a-z0-9]+(-[a-z0-9]+)*$'"
           )

    create constraint(:product_slug_aliases, :product_slug_aliases_slug_format_check,
             check: "(slug COLLATE \"C\") ~ '^[a-z0-9]+(-[a-z0-9]+)*$'"
           )

    create constraint(:product_slug_reservations, :product_slug_reservations_slug_format_check,
             check: "(slug COLLATE \"C\") ~ '^[a-z0-9]+(-[a-z0-9]+)*$'"
           )

    create constraint(:merchants, :merchants_slug_format_check,
             check: "(slug COLLATE \"C\") ~ '^[a-z0-9]+(-[a-z0-9]+)*$'"
           )

    create constraint(:affiliate_networks, :affiliate_networks_code_format_check,
             check: "(code COLLATE \"C\") ~ '^[a-z0-9]+(_[a-z0-9]+)*$'"
           )

    create constraint(:taxons, :taxons_seo_slug_format_check,
             check: "seo_slug IS NULL OR (seo_slug COLLATE \"C\") ~ '^[a-z0-9]+(-[a-z0-9]+)*$'"
           )
  end

  def down do
    drop constraint(:taxons, :taxons_seo_slug_format_check)
    drop constraint(:affiliate_networks, :affiliate_networks_code_format_check)
    drop constraint(:merchants, :merchants_slug_format_check)

    drop constraint(
           :product_slug_reservations,
           :product_slug_reservations_slug_format_check
         )

    drop constraint(:product_slug_aliases, :product_slug_aliases_slug_format_check)
    drop constraint(:products, :products_slug_format_check)
  end
end
