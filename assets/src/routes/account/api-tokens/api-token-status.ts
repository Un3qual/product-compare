import type { ApiTokenSummary } from "./loader";

export function apiTokenIsActive(token: ApiTokenSummary) {
  if (token.revokedAt) {
    return false;
  }

  if (!token.expiresAt) {
    return true;
  }

  const expiresAt = new Date(token.expiresAt).getTime();
  return Number.isNaN(expiresAt) || expiresAt > Date.now();
}
