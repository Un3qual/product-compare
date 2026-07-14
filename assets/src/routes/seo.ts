import type { RouteDocumentMetadata } from "./RouteMetadata";

type GraphQLSeoMetadata = {
  readonly canonicalPath: string;
  readonly description: string;
  readonly imageUrl?: string | null;
  readonly indexable: boolean;
  readonly structuredData?: string | null;
  readonly title: string;
};

export function routeMetadataFromSeo(
  seo: GraphQLSeoMetadata,
  requestUrl: string,
  options: { allowIndexing?: boolean } = {}
): RouteDocumentMetadata {
  const canonicalUrl = new URL(seo.canonicalPath, requestUrl).toString();

  return {
    canonicalUrl,
    description: seo.description,
    imageUrl: seo.imageUrl ? new URL(seo.imageUrl, requestUrl).toString() : null,
    indexable: seo.indexable && options.allowIndexing !== false,
    structuredData: absoluteStructuredData(seo.structuredData, requestUrl),
    title: seo.title
  };
}

function absoluteStructuredData(value: string | null | undefined, requestUrl: string) {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as unknown;
    return JSON.stringify(absolutizeUrls(parsed, requestUrl)).replace(/</g, "\\u003c");
  } catch {
    return null;
  }
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
        absolutizeUrls(nestedValue, requestUrl, nestedKey)
      ])
    );
  }

  return value;
}
