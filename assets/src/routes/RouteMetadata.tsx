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
  if (!handle || typeof handle !== "object" || !("metadata" in handle)) {
    return null;
  }

  const metadata = handle.metadata;

  if (
    !metadata ||
    typeof metadata !== "object" ||
    !("title" in metadata) ||
    typeof metadata.title !== "string" ||
    !("description" in metadata) ||
    typeof metadata.description !== "string"
  ) {
    return null;
  }

  return metadata as RouteDocumentMetadata;
}
