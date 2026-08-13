import type { RootRouteQuery } from "$generated/RootRouteQuery.graphql";

export type RootViewer = NonNullable<RootRouteQuery["response"]["viewer"]>;

export function rootViewerFromRelayRecord(viewer: unknown): RootViewer | null {
  if (!viewer || typeof viewer !== "object") return null;
  if (!("id" in viewer) || !("email" in viewer) || !("isOperator" in viewer)) return null;

  return typeof viewer.id === "string" &&
    typeof viewer.email === "string" &&
    typeof viewer.isOperator === "boolean"
    ? {
        id: viewer.id,
        email: viewer.email,
        isOperator: viewer.isOperator,
      }
    : null;
}
