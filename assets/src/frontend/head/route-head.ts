export type StructuredData =
  | Readonly<Record<string, unknown>>
  | readonly Readonly<Record<string, unknown>>[];

export type RouteDocumentMetadata = {
  canonicalUrl?: string;
  description: string;
  imageUrl?: string | null;
  indexable?: boolean;
  structuredData?: StructuredData | null;
  title: string;
};

export type RouteMetadataHandle = {
  metadata: RouteDocumentMetadata;
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
  matches: ReadonlyArray<unknown>,
): RouteDocumentMetadata | null {
  for (let index = matches.length - 1; index >= 0; index -= 1) {
    const match = matches[index];
    if (typeof match !== "object" || match === null) continue;

    const metadata =
      ("data" in match ? routeDocumentMetadataFrom(match.data) : null) ??
      ("handle" in match ? routeDocumentMetadataFrom(match.handle) : null);

    if (metadata) return metadata;
  }

  return null;
}

function routeDocumentMetadataFrom(value: unknown): RouteDocumentMetadata | null {
  if (typeof value !== "object" || value === null || !("metadata" in value)) return null;

  const metadata = value.metadata;

  if (
    typeof metadata !== "object" ||
    metadata === null ||
    !("description" in metadata) ||
    typeof metadata.description !== "string" ||
    !("title" in metadata) ||
    typeof metadata.title !== "string"
  ) {
    return null;
  }

  return {
    description: metadata.description,
    title: metadata.title,
    ...("canonicalUrl" in metadata && typeof metadata.canonicalUrl === "string"
      ? { canonicalUrl: metadata.canonicalUrl }
      : {}),
    ...("imageUrl" in metadata &&
    (typeof metadata.imageUrl === "string" || metadata.imageUrl === null)
      ? { imageUrl: metadata.imageUrl }
      : {}),
    ...("indexable" in metadata && typeof metadata.indexable === "boolean"
      ? { indexable: metadata.indexable }
      : {}),
    ...("structuredData" in metadata && isStructuredData(metadata.structuredData)
      ? { structuredData: metadata.structuredData }
      : {}),
  };
}

function isStructuredData(value: unknown): value is StructuredData {
  if (typeof value !== "object" || value === null) return false;
  if (!Array.isArray(value)) return true;

  return value.every((item) => typeof item === "object" && item !== null && !Array.isArray(item));
}

export function routeMetadata(title: string, description: string): RouteMetadataHandle {
  return { metadata: { description, title } };
}
