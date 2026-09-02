import {
  routeMetadataFromSeo,
  routeMetaDescriptors,
  staticRouteMetaDescriptors,
} from "../../src/frontend/seo";

test("static route metadata owns the site defaults and title suffix", () => {
  expect(staticRouteMetaDescriptors()).toEqual(
    expect.arrayContaining([
      { title: "Product Compare" },
      {
        name: "description",
        content: "Choose products with clearer specifications and current offers.",
      },
      { property: "og:title", content: "Product Compare" },
      { name: "twitter:title", content: "Product Compare" },
    ]),
  );

  expect(
    staticRouteMetaDescriptors({
      title: "Browse products",
      description: "Browse by the attributes that matter.",
    }),
  ).toEqual(
    expect.arrayContaining([
      { title: "Browse products | Product Compare" },
      { name: "description", content: "Browse by the attributes that matter." },
      { property: "og:title", content: "Browse products | Product Compare" },
      { name: "twitter:title", content: "Browse products | Product Compare" },
    ]),
  );
});

test("routeMetadataFromSeo emits an absolute canonical, truthful robots decision, and structured JSON-LD URLs", () => {
  const metadata = routeMetadataFromSeo(
    {
      title: "A <careful> product | Product Compare",
      description: "Compare a factual product.",
      canonicalPath: "/products/careful-product",
      indexable: true,
      imageUrl: "/images/careful.jpg",
      structuredData:
        '{"@type":"Product","name":"</script><script>bad()</script>","url":"https://app.example.com/products/careful-product"}',
    },
    "https://app.example.com/products/careful-product?offersAfter=cursor",
  );

  expect(metadata.canonicalUrl).toBe("https://app.example.com/products/careful-product");
  expect(metadata.imageUrl).toBe("https://app.example.com/images/careful.jpg");
  expect(metadata.indexable).toBe(true);
  expect(metadata.structuredData).toEqual({
    "@type": "Product",
    name: "</script><script>bad()</script>",
    url: "https://app.example.com/products/careful-product",
  });
});

test("routeMetadataFromSeo can force parameterized variants to noindex without changing their canonical", () => {
  const metadata = routeMetadataFromSeo(
    {
      title: "Product",
      description: "Product description",
      canonicalPath: "/products/product",
      indexable: true,
      structuredData: null,
    },
    "https://app.example.com/products/product?offersAfter=cursor",
    { allowIndexing: false },
  );

  expect(metadata.indexable).toBe(false);
  expect(metadata.canonicalUrl).toBe("https://app.example.com/products/product");
});

test("routeMetaDescriptors projects canonical, robots, social, and JSON-LD framework metadata", () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: '</script><script>alert("metadata injection")</script>',
  };

  const descriptors = routeMetaDescriptors({
    canonicalUrl: "https://app.example.com/products/careful-product",
    description: "Compare a factual product.",
    imageUrl: "https://app.example.com/images/careful.jpg",
    indexable: true,
    structuredData,
    title: "Careful product | Product Compare",
  });

  expect(descriptors).toEqual(
    expect.arrayContaining([
      { title: "Careful product | Product Compare" },
      { name: "description", content: "Compare a factual product." },
      { name: "robots", content: "index,follow" },
      {
        property: "og:url",
        content: "https://app.example.com/products/careful-product",
      },
      { name: "twitter:card", content: "summary_large_image" },
      {
        tagName: "link",
        rel: "canonical",
        href: "https://app.example.com/products/careful-product",
      },
      { "script:ld+json": structuredData },
    ]),
  );
});
