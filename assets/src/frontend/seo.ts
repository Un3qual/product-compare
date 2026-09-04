import type { MetaDescriptor } from "react-router";

type RouteDocumentMetadata = {
  canonicalUrl?: string;
  description: string;
  imageUrl?: string | null;
  indexable?: boolean;
  structuredData?: Readonly<Record<string, unknown>> | null;
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
};

export function staticRouteMetaDescriptors(metadata: Partial<RouteDocumentMetadata> = {}) {
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
) {
  return {
    canonicalUrl: new URL(seo.canonicalPath, requestUrl).toString(),
    description: seo.description,
    imageUrl: seo.imageUrl ? new URL(seo.imageUrl, requestUrl).toString() : null,
    indexable: seo.indexable && options.allowIndexing !== false,
    structuredData: seo.structuredData
      ? (JSON.parse(seo.structuredData) as Readonly<Record<string, unknown>>)
      : null,
    title: seo.title,
  };
}

export function routeMetaDescriptors(metadata: RouteDocumentMetadata) {
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
          { property: "og:url", content: metadata.canonicalUrl },
          { tagName: "link", rel: "canonical", href: metadata.canonicalUrl },
        ]
      : []),
    ...(metadata.imageUrl
      ? [
          { property: "og:image", content: metadata.imageUrl },
          { name: "twitter:image", content: metadata.imageUrl },
        ]
      : []),
    ...(metadata.structuredData ? [{ "script:ld+json": metadata.structuredData }] : []),
  ] satisfies MetaDescriptor[];
}
