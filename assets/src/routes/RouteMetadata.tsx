import { useMatches } from "react-router-dom";
import { resolveRouteDocumentMetadata, RouteHead, type RouteMetadataMatch } from "../frontend/head";

export type { RouteDocumentMetadata, RouteMetadataHandle } from "../frontend/head";

export function RouteMetadata() {
  const matches = useMatches() as ReadonlyArray<RouteMetadataMatch>;
  const metadata = resolveRouteDocumentMetadata(matches);

  return metadata ? <RouteHead metadata={metadata} /> : null;
}
