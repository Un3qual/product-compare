import { resolveRouteDocumentMetadata } from "../../src/routes/route-metadata-data";

function metadata(title: string) {
  return {
    description: `${title} description`,
    title
  };
}

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
