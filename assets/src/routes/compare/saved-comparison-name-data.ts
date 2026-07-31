export function buildSavedComparisonName(
  products: readonly {
    readonly name: string;
  }[],
) {
  const productNames = products.map((product) => product.name.trim()).filter((name) => name !== "");

  if (productNames.length === 0) {
    return "Saved comparison";
  }

  if (productNames.length === 1) {
    return `${productNames[0]} comparison`;
  }

  return productNames.join(" vs ");
}
