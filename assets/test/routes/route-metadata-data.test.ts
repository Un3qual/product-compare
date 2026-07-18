import {
  projectRouteMetadataTagPolicy,
  resolveRouteDocumentMetadata
} from "../../src/routes/route-metadata-data";

function metadata(title: string) {
  return {
    description: `${title} description`,
    title
  };
}

test("projectRouteMetadataTagPolicy only indexes explicitly indexable metadata", () => {
  expect(projectRouteMetadataTagPolicy({ indexable: true })).toEqual({
    robots: "index,follow",
    twitterCard: "summary"
  });
  expect(projectRouteMetadataTagPolicy({})).toEqual({
    robots: "noindex,follow",
    twitterCard: "summary"
  });
  expect(projectRouteMetadataTagPolicy({ indexable: false })).toEqual({
    robots: "noindex,follow",
    twitterCard: "summary"
  });
});

test("projectRouteMetadataTagPolicy uses a large Twitter card only for a non-empty image URL", () => {
  expect(
    projectRouteMetadataTagPolicy({ imageUrl: "https://example.test/product.jpg" })
  ).toEqual({
    robots: "noindex,follow",
    twitterCard: "summary_large_image"
  });
  expect(projectRouteMetadataTagPolicy({ imageUrl: undefined })).toEqual({
    robots: "noindex,follow",
    twitterCard: "summary"
  });
  expect(projectRouteMetadataTagPolicy({ imageUrl: null })).toEqual({
    robots: "noindex,follow",
    twitterCard: "summary"
  });
  expect(projectRouteMetadataTagPolicy({ imageUrl: "" })).toEqual({
    robots: "noindex,follow",
    twitterCard: "summary"
  });
});

test("projectRouteMetadataTagPolicy does not mutate frozen normalized metadata", () => {
  const normalizedMetadata = Object.freeze({
    imageUrl: "https://example.test/product.jpg",
    indexable: true
  });

  expect(projectRouteMetadataTagPolicy(normalizedMetadata)).toEqual({
    robots: "index,follow",
    twitterCard: "summary_large_image"
  });
  expect(normalizedMetadata).toEqual({
    imageUrl: "https://example.test/product.jpg",
    indexable: true
  });
});

test("resolveRouteDocumentMetadata selects the deepest valid route metadata", () => {
  const matches = [
    { handle: { metadata: metadata("Root") } },
    { handle: { metadata: metadata("Catalog") } },
    { handle: { metadata: metadata("Product") } }
  ];

  expect(resolveRouteDocumentMetadata(matches)).toEqual({
    ...metadata("Product"),
    indexable: false
  });
  expect(matches.map((match) => match.handle.metadata.title)).toEqual([
    "Root",
    "Catalog",
    "Product"
  ]);
});

test("resolveRouteDocumentMetadata skips an invalid deepest match", () => {
  expect(
    resolveRouteDocumentMetadata([
      { handle: { metadata: metadata("Root") } },
      { data: { metadata: metadata("Loaded catalog") } },
      {
        data: { metadata: { description: "Missing a title" } },
        handle: { metadata: { title: "Missing a description" } }
      }
    ])
  ).toEqual({
    ...metadata("Loaded catalog"),
    indexable: false
  });
});

test("resolveRouteDocumentMetadata prefers loader metadata over the same match handle", () => {
  expect(
    resolveRouteDocumentMetadata([
      {
        data: { metadata: metadata("Loaded product") },
        handle: { metadata: metadata("Static product") }
      }
    ])
  ).toEqual({
    ...metadata("Loaded product"),
    indexable: false
  });
});

test("resolveRouteDocumentMetadata falls back to the same match handle when loader metadata is invalid", () => {
  expect(
    resolveRouteDocumentMetadata([
      {
        data: {
          metadata: {
            description: "Missing a title"
          }
        },
        handle: { metadata: metadata("Static fallback") }
      }
    ])
  ).toEqual({
    ...metadata("Static fallback"),
    indexable: false
  });
});

test("resolveRouteDocumentMetadata requires string title and description fields", () => {
  expect(
    resolveRouteDocumentMetadata([
      { handle: { metadata: { description: "Valid", title: 42 } } },
      { handle: { metadata: { description: null, title: "Invalid" } } }
    ])
  ).toBeNull();
});

test("resolveRouteDocumentMetadata parses optional strings and only explicit true indexability", () => {
  expect(
    resolveRouteDocumentMetadata([
      {
        data: {
          metadata: {
            canonicalUrl: "https://example.test/products/example",
            description: "Example description",
            imageUrl: "https://example.test/example.jpg",
            indexable: true,
            structuredData: '{"@type":"Product"}',
            title: "Example product"
          }
        }
      }
    ])
  ).toEqual({
    canonicalUrl: "https://example.test/products/example",
    description: "Example description",
    imageUrl: "https://example.test/example.jpg",
    indexable: true,
    structuredData: '{"@type":"Product"}',
    title: "Example product"
  });

  expect(
    resolveRouteDocumentMetadata([
      {
        data: {
          metadata: {
            canonicalUrl: 123,
            description: "Example description",
            imageUrl: null,
            indexable: "true",
            structuredData: {},
            title: "Example product"
          }
        }
      }
    ])
  ).toEqual({
    canonicalUrl: undefined,
    description: "Example description",
    imageUrl: undefined,
    indexable: false,
    structuredData: undefined,
    title: "Example product"
  });
});

test("resolveRouteDocumentMetadata returns null when no match contains valid metadata", () => {
  expect(
    resolveRouteDocumentMetadata([
      {},
      { data: null, handle: "not a handle" },
      { data: { metadata: [] } }
    ])
  ).toBeNull();
});
