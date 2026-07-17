export type ApiTokenStatusFacts = {
  readonly expiresAt: string | null;
  readonly revokedAt: string | null;
};

export function apiTokenIsActive(token: ApiTokenStatusFacts) {
  if (token.revokedAt) {
    return false;
  }

  if (!token.expiresAt) {
    return true;
  }

  const expiresAt = new Date(token.expiresAt).getTime();
  return Number.isNaN(expiresAt) || expiresAt > Date.now();
}
