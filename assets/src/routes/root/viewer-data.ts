export type RootViewer = {
  id: string;
  email: string;
  isOperator: boolean;
};

export function projectRootViewer(viewer: unknown): RootViewer | null {
  if (!viewer || typeof viewer !== "object") {
    return null;
  }

  const candidate = viewer as { email?: unknown; id?: unknown; isOperator?: unknown };

  if (
    typeof candidate.id !== "string" ||
    typeof candidate.email !== "string" ||
    typeof candidate.isOperator !== "boolean"
  ) {
    return null;
  }

  return {
    id: candidate.id,
    email: candidate.email,
    isOperator: candidate.isOperator
  };
}
