export type RouteDocumentMetadata = {
  canonicalUrl?: string;
  description: string;
  imageUrl?: string | null;
  indexable?: boolean;
  structuredData?: string | null;
  title: string;
};

export type RouteMetadataHandle = {
  metadata: RouteDocumentMetadata;
};

export type RouteMetadataMatch = {
  readonly data?: unknown;
  readonly handle?: unknown;
};

export type RouteMetadataTagPolicy = {
  robots: "index,follow" | "noindex,follow";
  twitterCard: "summary" | "summary_large_image";
};

export function projectRouteMetadataTagPolicy(
  metadata: Pick<RouteDocumentMetadata, "imageUrl" | "indexable">,
): RouteMetadataTagPolicy {
  return {
    robots: metadata.indexable === true ? "index,follow" : "noindex,follow",
    twitterCard: metadata.imageUrl ? "summary_large_image" : "summary",
  };
}

export function resolveRouteDocumentMetadata(
  matches: ReadonlyArray<RouteMetadataMatch>,
): RouteDocumentMetadata | null {
  for (let index = matches.length - 1; index >= 0; index -= 1) {
    const match = matches[index];
    const metadata = metadataFromContainer(match.data) ?? metadataFromContainer(match.handle);

    if (metadata) {
      return metadata;
    }
  }

  return null;
}

function metadataFromContainer(value: unknown): RouteDocumentMetadata | null {
  const container = recordFromUnknown(value);

  return container ? metadataFromRecord(recordFromUnknown(container.metadata)) : null;
}

function metadataFromRecord(
  metadata: Record<string, unknown> | null,
): RouteDocumentMetadata | null {
  if (!metadata) return null;
  const description = stringProperty(metadata, "description");
  const title = stringProperty(metadata, "title");
  if (description === null || title === null) return null;

  return {
    canonicalUrl: optionalStringProperty(metadata, "canonicalUrl"),
    description,
    imageUrl: optionalStringProperty(metadata, "imageUrl"),
    indexable: metadata.indexable === true,
    structuredData: optionalStringProperty(metadata, "structuredData"),
    title,
  };
}

function recordFromUnknown(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function stringProperty(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "string" ? value : null;
}

function optionalStringProperty(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
}
