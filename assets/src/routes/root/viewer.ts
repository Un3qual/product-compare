import type { RootRouteQuery } from "$generated/RootRouteQuery.graphql";

export type RootViewer = NonNullable<RootRouteQuery["response"]["viewer"]>;

export function rootViewerFromRelayRecord(viewer: unknown): RootViewer | null {
  if (!viewer || typeof viewer !== "object") return null;

  const candidate = viewer as Partial<Record<keyof RootViewer, unknown>>;

  return typeof candidate.id === "string" &&
    typeof candidate.email === "string" &&
    typeof candidate.isOperator === "boolean"
    ? {
        id: candidate.id,
        email: candidate.email,
        isOperator: candidate.isOperator,
      }
    : null;
}
