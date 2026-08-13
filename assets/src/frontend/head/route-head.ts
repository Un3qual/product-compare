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

export type RouteMetadataMatch = {
  readonly data?: { readonly metadata?: RouteDocumentMetadata } | null;
  readonly handle?: RouteMetadataHandle | null;
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
    const metadata = match.data?.metadata ?? match.handle?.metadata;

    if (metadata) return metadata;
  }

  return null;
}

export function routeMetadata(title: string, description: string): RouteMetadataHandle {
  return { metadata: { description, title } };
}
