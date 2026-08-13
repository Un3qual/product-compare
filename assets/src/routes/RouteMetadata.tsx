import { useMatches } from "react-router-dom";
import { resolveRouteDocumentMetadata, RouteHead } from "../frontend/head";

export type { RouteDocumentMetadata, RouteMetadataHandle } from "../frontend/head";

export function RouteMetadata() {
  const metadata = resolveRouteDocumentMetadata(useMatches());

  return metadata ? <RouteHead metadata={metadata} /> : null;
}
