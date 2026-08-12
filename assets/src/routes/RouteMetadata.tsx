import { useMatches } from "react-router-dom";
import { projectRouteMetadataTagPolicy, resolveRouteDocumentMetadata } from "./route-metadata-data";

export type { RouteDocumentMetadata, RouteMetadataHandle } from "./route-metadata-data";

export function RouteMetadata() {
  const matches = useMatches();
  const metadata = resolveRouteDocumentMetadata(matches);

  if (!metadata) {
    return null;
  }

  const tagPolicy = projectRouteMetadataTagPolicy(metadata);

  return (
    <>
      <title>{metadata.title}</title>
      <meta name="description" content={metadata.description} />
      <meta name="robots" content={tagPolicy.robots} />
      {metadata.canonicalUrl ? <link rel="canonical" href={metadata.canonicalUrl} /> : null}
      <meta property="og:title" content={metadata.title} />
      <meta property="og:description" content={metadata.description} />
      {metadata.canonicalUrl ? <meta property="og:url" content={metadata.canonicalUrl} /> : null}
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content={tagPolicy.twitterCard} />
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
