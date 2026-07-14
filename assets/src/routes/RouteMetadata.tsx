import { useMatches } from "react-router-dom";

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

export function RouteMetadata() {
  const matches = useMatches();
  const metadata = [...matches]
    .reverse()
    .map((match) => metadataFromData(match.data) ?? metadataFromHandle(match.handle))
    .find((candidate) => candidate !== null);

  if (!metadata) {
    return null;
  }

  return (
    <>
      <title>{metadata.title}</title>
      <meta name="description" content={metadata.description} />
      <meta name="robots" content={metadata.indexable === true ? "index,follow" : "noindex,follow"} />
      {metadata.canonicalUrl ? <link rel="canonical" href={metadata.canonicalUrl} /> : null}
      <meta property="og:title" content={metadata.title} />
      <meta property="og:description" content={metadata.description} />
      {metadata.canonicalUrl ? <meta property="og:url" content={metadata.canonicalUrl} /> : null}
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content={metadata.imageUrl ? "summary_large_image" : "summary"} />
      <meta name="twitter:title" content={metadata.title} />
      <meta name="twitter:description" content={metadata.description} />
      {metadata.imageUrl ? <meta property="og:image" content={metadata.imageUrl} /> : null}
      {metadata.imageUrl ? <meta name="twitter:image" content={metadata.imageUrl} /> : null}
      {metadata.structuredData ? (
        <script type="application/ld+json">{metadata.structuredData}</script>
      ) : null}
    </>
  );
}

function metadataFromData(data: unknown): RouteDocumentMetadata | null {
  const record = recordFromUnknown(data);
  return record ? metadataFromRecord(recordFromUnknown(record.metadata)) : null;
}

function metadataFromHandle(handle: unknown): RouteDocumentMetadata | null {
  const handleRecord = recordFromUnknown(handle);

  if (!handleRecord) {
    return null;
  }

  return metadataFromRecord(recordFromUnknown(handleRecord.metadata));
}

function metadataFromRecord(metadata: Record<string, unknown> | null): RouteDocumentMetadata | null {
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
    title
  };
}

function recordFromUnknown(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function stringProperty(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "string" ? value : null;
}

function optionalStringProperty(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
}
