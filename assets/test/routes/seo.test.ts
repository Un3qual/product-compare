import { routeMetadataFromSeo } from "../../src/routes/seo";

test("routeMetadataFromSeo emits an absolute canonical, truthful robots decision, and safe absolute JSON-LD URLs", () => {
  const metadata = routeMetadataFromSeo(
    {
      title: "A <careful> product | Product Compare",
      description: "Compare a factual product.",
      canonicalPath: "/products/careful-product",
      indexable: true,
      imageUrl: "/images/careful.jpg",
      structuredData: '{"@type":"Product","name":"</script><script>bad()</script>","url":"/products/careful-product"}'
    },
    "https://app.example.com/products/careful-product?offersAfter=cursor"
  );

  expect(metadata.canonicalUrl).toBe("https://app.example.com/products/careful-product");
  expect(metadata.imageUrl).toBe("https://app.example.com/images/careful.jpg");
  expect(metadata.indexable).toBe(true);
  expect(metadata.structuredData).toContain("https://app.example.com/products/careful-product");
  expect(metadata.structuredData).not.toContain("</script>");
  expect(metadata.structuredData).toContain("\\u003c/script>");
});

test("routeMetadataFromSeo can force parameterized variants to noindex without changing their canonical", () => {
  const metadata = routeMetadataFromSeo(
    {
      title: "Product",
      description: "Product description",
      canonicalPath: "/products/product",
      indexable: true,
      structuredData: null
    },
    "https://app.example.com/products/product?offersAfter=cursor",
    { allowIndexing: false }
  );

  expect(metadata.indexable).toBe(false);
  expect(metadata.canonicalUrl).toBe("https://app.example.com/products/product");
});
