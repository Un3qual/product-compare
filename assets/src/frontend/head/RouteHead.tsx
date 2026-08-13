import { useHead, useSeoMeta } from "@unhead/react";
import { projectRouteMetadataTagPolicy, type RouteDocumentMetadata } from "./route-head";

export function RouteHead({ metadata }: { metadata: RouteDocumentMetadata }) {
  const tagPolicy = projectRouteMetadataTagPolicy(metadata);

  useSeoMeta({
    description: metadata.description,
    ogDescription: metadata.description,
    ogImage: metadata.imageUrl ?? undefined,
    ogTitle: metadata.title,
    ogType: "website",
    ogUrl: metadata.canonicalUrl,
    robots: tagPolicy.robots,
    title: metadata.title,
    twitterCard: tagPolicy.twitterCard,
    twitterDescription: metadata.description,
    twitterImage: metadata.imageUrl ?? undefined,
    twitterTitle: metadata.title,
  });

  useHead({
    link: metadata.canonicalUrl ? [{ href: metadata.canonicalUrl, rel: "canonical" }] : [],
    script: metadata.structuredData
      ? [
          {
            key: "route-structured-data",
            textContent: JSON.stringify(metadata.structuredData),
            type: "application/ld+json",
          },
        ]
      : [],
  });

  return null;
}
