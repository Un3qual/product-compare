defmodule ProductCompare.Seo do
  @moduledoc """
  Owns public search qualification, metadata, and bounded sitemap reads.

  Search surfaces call this policy instead of independently guessing whether
  public catalog facts are complete and fresh enough to advertise.
  """

  alias ProductCompare.Seo.{Categories, Metadata, Sitemaps}
  alias ProductCompareSchemas.Catalog.{ComparisonSnapshot, Product}
  alias ProductCompareSchemas.Pricing.Merchant

  @type metadata :: %{
          canonical_path: String.t(),
          description: String.t(),
          image_url: String.t() | nil,
          indexable: boolean(),
          structured_data: map() | nil,
          title: String.t()
        }

  @spec product_metadata(Product.t(), keyword()) :: metadata()
  def product_metadata(%Product{} = product, opts \\ []), do: Metadata.product(product, opts)

  @spec product_metadata_batch([Product.t()], keyword()) :: %{Product.t() => metadata()}
  def product_metadata_batch(products, opts \\ []) when is_list(products),
    do: Metadata.product_batch(products, opts)

  @spec merchant_metadata(Merchant.t(), keyword()) :: metadata()
  def merchant_metadata(%Merchant{} = merchant, opts \\ []), do: Metadata.merchant(merchant, opts)

  @spec snapshot_metadata(ComparisonSnapshot.t()) :: metadata()
  def snapshot_metadata(%ComparisonSnapshot{} = snapshot), do: Metadata.snapshot(snapshot)

  @spec snapshot_qualified?(ComparisonSnapshot.t() | map()) :: boolean()
  def snapshot_qualified?(snapshot_or_payload),
    do: Metadata.snapshot_qualified?(snapshot_or_payload)

  @spec get_category(String.t(), keyword()) :: map() | nil
  def get_category(slug, opts \\ [])

  def get_category(slug, opts) when is_binary(slug), do: Categories.get(slug, opts)

  def get_category(_slug, _opts), do: nil

  @spec get_categories([String.t()], keyword()) :: %{String.t() => map() | nil}
  def get_categories(slugs, opts \\ []) when is_list(slugs), do: Categories.get_many(slugs, opts)

  @spec category_metadata(map()) :: metadata()
  def category_metadata(category), do: Metadata.category(category)

  @spec qualified_products_for_taxon_query(pos_integer(), DateTime.t()) :: Ecto.Query.t()
  def qualified_products_for_taxon_query(taxon_id, %DateTime{} = now),
    do: Categories.qualified_products_for_taxon_query(taxon_id, now)

  @spec qualified_product_pages(
          [pos_integer()],
          DateTime.t(),
          %{offset: non_neg_integer(), fetch_limit: non_neg_integer()}
        ) :: %{optional(pos_integer()) => [Product.t()]}
  def qualified_product_pages(taxon_ids, %DateTime{} = now, %{
        offset: offset,
        fetch_limit: fetch_limit
      })
      when is_list(taxon_ids) and is_integer(offset) and offset >= 0 and
             is_integer(fetch_limit) and fetch_limit >= 0,
      do:
        Categories.qualified_product_pages(taxon_ids, now, %{
          offset: offset,
          fetch_limit: fetch_limit
        })

  @spec sitemap_entries(:products | :merchants | :categories | :comparisons, keyword()) :: [map()]
  def sitemap_entries(kind, opts \\ []), do: Sitemaps.entries(kind, opts)
end
