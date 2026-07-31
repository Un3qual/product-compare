type SavedProductFixture = {
  name: string;
  slug: string;
};

const DEFAULT_SAVED_PRODUCTS: readonly SavedProductFixture[] = [
  { name: "Chair", slug: "chair" },
  { name: "Desk", slug: "desk" },
  { name: "Keyboard", slug: "keyboard" },
  { name: "Lamp", slug: "lamp" },
  { name: "Monitor", slug: "monitor" },
  { name: "Mouse", slug: "mouse" },
  { name: "Rucksack", slug: "rucksack" },
  { name: "Storage Bin", slug: "storage-bin" },
  { name: "Table", slug: "table" },
  { name: "Tent", slug: "tent" },
];

export function savedProductsForSlugs(
  slugs: readonly string[],
  additionalProducts: readonly SavedProductFixture[] = [],
) {
  const productsBySlug = new Map(
    [...DEFAULT_SAVED_PRODUCTS, ...additionalProducts].map((product) => [product.slug, product]),
  );

  return slugs.map((slug) => {
    const product = productsBySlug.get(slug);

    if (!product) {
      throw new Error(`Missing saved-product fixture for slug: ${slug}`);
    }

    return { name: product.name, slug: product.slug };
  });
}
