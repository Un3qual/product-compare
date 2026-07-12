import { useMatches } from "react-router-dom";

export type RouteDocumentMetadata = {
  description: string;
  title: string;
};

export type RouteMetadataHandle = {
  metadata: RouteDocumentMetadata;
};

export function RouteMetadata() {
  const metadata = [...useMatches()]
    .reverse()
    .map((match) => metadataFromHandle(match.handle))
    .find((candidate) => candidate !== null);

  if (!metadata) {
    return null;
  }

  return (
    <>
      <title>{metadata.title}</title>
      <meta name="description" content={metadata.description} />
    </>
  );
}

function metadataFromHandle(handle: unknown): RouteDocumentMetadata | null {
  const handleRecord = recordFromUnknown(handle);

  if (!handleRecord) {
    return null;
  }

  const metadata = recordFromUnknown(handleRecord.metadata);

  if (!metadata) {
    return null;
  }

  const description = stringProperty(metadata, "description");
  const title = stringProperty(metadata, "title");

  return description === null || title === null ? null : { description, title };
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
