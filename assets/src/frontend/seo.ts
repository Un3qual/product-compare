import type { MetaDescriptor } from "react-router";

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

type GraphQLSeoMetadata = {
  readonly canonicalPath: string;
  readonly description: string;
  readonly imageUrl?: string | null;
  readonly indexable: boolean;
  readonly structuredData?: string | null;
  readonly title: string;
};

const defaultRouteMetadata = {
  description: "Choose products with clearer specifications and current offers.",
  title: "Product Compare",
} satisfies RouteDocumentMetadata;

export function staticRouteMetaDescriptors(
  metadata: Partial<RouteDocumentMetadata> = {},
): MetaDescriptor[] {
  return routeMetaDescriptors({
    ...defaultRouteMetadata,
    ...metadata,
    title: metadata.title
      ? `${metadata.title} | ${defaultRouteMetadata.title}`
      : defaultRouteMetadata.title,
  });
}

export function routeMetadataFromSeo(
  seo: GraphQLSeoMetadata,
  requestUrl: string,
  options: { allowIndexing?: boolean } = {},
): RouteDocumentMetadata {
  return {
    canonicalUrl: new URL(seo.canonicalPath, requestUrl).toString(),
    description: seo.description,
    imageUrl: seo.imageUrl ? new URL(seo.imageUrl, requestUrl).toString() : null,
    indexable: seo.indexable && options.allowIndexing !== false,
    structuredData: absoluteStructuredData(seo.structuredData, requestUrl),
    title: seo.title,
  };
}

export function routeMetaDescriptors(metadata: RouteDocumentMetadata): MetaDescriptor[] {
  const hasImage = Boolean(metadata.imageUrl);

  return [
    { title: metadata.title },
    { name: "description", content: metadata.description },
    { name: "robots", content: metadata.indexable === true ? "index,follow" : "noindex,follow" },
    { property: "og:title", content: metadata.title },
    { property: "og:description", content: metadata.description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: hasImage ? "summary_large_image" : "summary" },
    { name: "twitter:title", content: metadata.title },
    { name: "twitter:description", content: metadata.description },
    ...(metadata.canonicalUrl
      ? [
          { property: "og:url", content: metadata.canonicalUrl } as const,
          { tagName: "link", rel: "canonical", href: metadata.canonicalUrl } as const,
        ]
      : []),
    ...(metadata.imageUrl
      ? [
          { property: "og:image", content: metadata.imageUrl } as const,
          { name: "twitter:image", content: metadata.imageUrl } as const,
        ]
      : []),
    ...(metadata.structuredData ? [{ "script:ld+json": metadata.structuredData }] : []),
  ];
}

function absoluteStructuredData(value: GraphQLSeoMetadata["structuredData"], requestUrl: string) {
  if (!value) return null;

  try {
    const parsed: unknown = JSON.parse(value);
    return structuredDataFromUnknown(absolutizeUrls(parsed, requestUrl));
  } catch {
    return null;
  }
}

function structuredDataFromUnknown(value: unknown): StructuredData | null {
  if (typeof value !== "object" || value === null) return null;
  if (!Array.isArray(value)) return Object.fromEntries(Object.entries(value));

  return value.every((item) => typeof item === "object" && item !== null && !Array.isArray(item))
    ? value
    : null;
}

function absolutizeUrls(value: unknown, requestUrl: string, key?: string): unknown {
  if (typeof value === "string" && (key === "url" || key === "image")) {
    try {
      return new URL(value, requestUrl).toString();
    } catch {
      return value;
    }
  }

  if (Array.isArray(value)) {
    return value.map((item) => absolutizeUrls(item, requestUrl));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([nestedKey, nestedValue]) => [
        nestedKey,
        absolutizeUrls(nestedValue, requestUrl, nestedKey),
      ]),
    );
  }

  return value;
}
