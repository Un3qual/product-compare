import { parseGraphQLDateTime } from "../../graphql-datetime";
import {
  hasRouteGraphQLErrors,
  routeMutationErrorMessage
} from "../../route-errors";
import { apiTokenIsActive } from "./api-token-status";

export type ApiTokenStatus = "active" | "revoked" | "all";

export interface ApiTokenRecord {
  id: string;
  label: string | null;
  tokenPrefix: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  insertedAt: string;
}

type AuthorizedApiTokensRouteData = {
  status: "ready" | "empty";
  tokens: readonly ApiTokenRecord[];
  tokenStatus: ApiTokenStatus;
  after?: string | null;
};

type UnauthorizedApiTokensRouteData = {
  status: "unauthorized";
  tokenStatus: ApiTokenStatus;
};

export type ApiTokensRouteData =
  | AuthorizedApiTokensRouteData
  | UnauthorizedApiTokensRouteData;

export type ApiTokensRouteIdentityData = {
  status: "ready" | "empty" | "unauthorized";
  tokenStatus: ApiTokenStatus;
  after?: string | null;
};

export type CreateApiTokenVariables = {
  label: string | null;
  expiresAt?: string | null;
};

export type RotateApiTokenVariables = CreateApiTokenVariables & {
  tokenId: string;
};

export type RevokeApiTokenVariables = {
  tokenId: string;
};

export type MutationApiToken = {
  readonly id: string;
  readonly label: string | null | undefined;
  readonly tokenPrefix: string;
  readonly lastUsedAt: string | null | undefined;
  readonly expiresAt: string | null | undefined;
  readonly revokedAt: string | null | undefined;
  readonly insertedAt: string;
};

type ApiTokenMutationPayload = {
  readonly apiToken?: MutationApiToken | null;
  readonly errors?: unknown;
};

type ApiTokenCredentialMutationPayload = ApiTokenMutationPayload & {
  readonly plainTextToken?: string | null;
};

export type ApiTokenCredentialMutationOutcome =
  | {
      error: null;
      plainTextToken: string;
      token: ApiTokenRecord;
    }
  | {
      error: string;
      plainTextToken: null;
      token: null;
    };

export type RevokeApiTokenMutationOutcome =
  | {
      error: null;
      token: ApiTokenRecord;
    }
  | {
      error: string;
      token: null;
    };

export function buildApiTokenDisplayData(token: ApiTokenRecord) {
  return {
    displayLabel: token.label ?? "Unlabeled token",
    expiresAtLabel: formatOptionalDateTime(token.expiresAt, "Never expires"),
    lastUsedAtLabel: formatOptionalDateTime(token.lastUsedAt, "Never used"),
    insertedAtLabel: formatUtcDateTime(token.insertedAt),
    statusLabel: apiTokenStatusLabel(token)
  };
}

export function apiTokensRouteLocationIdentity(loaderData: ApiTokensRouteIdentityData) {
  const searchParams = new URLSearchParams({ status: loaderData.tokenStatus });

  if (loaderData.status !== "unauthorized" && loaderData.after) {
    searchParams.set("after", loaderData.after);
  }

  const access = loaderData.status === "unauthorized" ? "unauthorized" : "authorized";
  return `${access}?${searchParams.toString()}`;
}

export function apiTokenPagePath(tokenStatus: ApiTokenStatus, after: string | null) {
  const searchParams = new URLSearchParams({ status: tokenStatus });

  if (after) {
    searchParams.set("after", after);
  }

  return `/account/api-tokens?${searchParams.toString()}`;
}

export function buildApiTokensViewState(
  loaderData: ApiTokensRouteData,
  createdTokens: readonly ApiTokenRecord[] = [],
  apiTokenUpdates: ReadonlyMap<string, ApiTokenRecord> = new Map()
) {
  if (loaderData.status === "unauthorized") {
    return {
      localTokens: [],
      statusMessage: "Sign in to manage API tokens.",
      tokens: []
    };
  }

  const loaderTokens = applyApiTokenUpdates(
    loaderData.tokens,
    apiTokenUpdates,
    loaderData.tokenStatus
  );
  const loaderTokenIds = new Set(loaderTokens.map((token) => token.id));
  const localTokens = applyApiTokenUpdates(
    createdTokens,
    apiTokenUpdates,
    loaderData.tokenStatus
  ).filter((token) => !loaderTokenIds.has(token.id));
  const tokens = mergeApiTokenSummaries(localTokens, loaderTokens);

  if (tokens.length === 0) {
    return {
      localTokens,
      statusMessage: "No API tokens yet.",
      tokens: []
    };
  }

  return {
    localTokens,
    statusMessage: localTokens.length > 0 ? "API token created." : "",
    tokens
  };
}

export function buildCreateApiTokenVariables(formData: FormData): CreateApiTokenVariables {
  const expiresAt = normalizeExpiresAtFormValue(formData);
  const variables: CreateApiTokenVariables = {
    label: optionalFormText(formData.get("label"))
  };

  if (expiresAt !== undefined) {
    variables.expiresAt = expiresAt;
  }

  return variables;
}

export function buildRotateApiTokenVariables(
  token: ApiTokenRecord,
  formData: FormData
): RotateApiTokenVariables {
  const expiresAt = normalizeExpiresAtFormValue(formData);
  const variables: RotateApiTokenVariables = {
    tokenId: token.id,
    label: optionalFormText(formData.get("label")) ?? token.label
  };

  if (expiresAt !== undefined) {
    variables.expiresAt = expiresAt;
  }

  return variables;
}

export function buildRevokeApiTokenVariables(tokenId: string): RevokeApiTokenVariables {
  return { tokenId };
}

export function resolveApiTokenCredentialMutationOutcome(
  payload: ApiTokenCredentialMutationPayload | null | undefined,
  graphQLErrors?: readonly unknown[] | null
): ApiTokenCredentialMutationOutcome {
  if (hasRouteGraphQLErrors(graphQLErrors)) {
    return credentialMutationFailure(payload, graphQLErrors);
  }

  const token = summarizeMutationApiToken(payload?.apiToken);

  if (payload?.plainTextToken && token) {
    return { error: null, plainTextToken: payload.plainTextToken, token };
  }

  return credentialMutationFailure(payload, graphQLErrors);
}

export function resolveRevokeApiTokenMutationOutcome(
  payload: ApiTokenMutationPayload | null | undefined,
  graphQLErrors?: readonly unknown[] | null
): RevokeApiTokenMutationOutcome {
  if (hasRouteGraphQLErrors(graphQLErrors)) {
    return revokeMutationFailure(payload, graphQLErrors);
  }

  const token = summarizeMutationApiToken(payload?.apiToken);

  if (token) {
    return { error: null, token };
  }

  return revokeMutationFailure(payload, graphQLErrors);
}

export function summarizeMutationApiToken(token?: MutationApiToken | null) {
  if (!token) {
    return null;
  }

  const {
    id,
    label = null,
    tokenPrefix,
    lastUsedAt = null,
    expiresAt = null,
    revokedAt = null,
    insertedAt
  } = token;

  return {
    id,
    label,
    tokenPrefix,
    lastUsedAt,
    expiresAt,
    revokedAt,
    insertedAt
  } satisfies ApiTokenRecord;
}

export function markTokenRotated(
  previousToken: ApiTokenRecord,
  rotatedToken: ApiTokenRecord
) {
  return {
    ...previousToken,
    revokedAt: previousToken.revokedAt ?? rotatedToken.insertedAt
  } satisfies ApiTokenRecord;
}

export function upsertApiTokenSummary(
  tokens: readonly ApiTokenRecord[],
  nextToken: ApiTokenRecord
) {
  return [nextToken, ...tokens.filter((token) => token.id !== nextToken.id)];
}

export function upsertApiTokenSummaryMap(
  tokens: ReadonlyMap<string, ApiTokenRecord>,
  nextToken: ApiTokenRecord
) {
  const nextTokens = new Map(tokens);
  nextTokens.set(nextToken.id, nextToken);
  return nextTokens;
}

export function applyApiTokenUpdates(
  tokens: readonly ApiTokenRecord[],
  apiTokenUpdates: ReadonlyMap<string, ApiTokenRecord>,
  status: ApiTokenStatus
) {
  return tokens.flatMap((token) => {
    const updatedToken = mergeApiTokenUpdate(token, apiTokenUpdates.get(token.id));
    return apiTokenMatchesStatus(updatedToken, status) ? [updatedToken] : [];
  });
}

function normalizeExpiresAtFormValue(formData: FormData) {
  const preset = optionalFormText(formData.get("expiresAtPreset"));

  if (preset === "No expiration") {
    return null;
  }

  return normalizeDateTimeLocalValue(optionalFormText(formData.get("expiresAt")));
}

function credentialMutationFailure(
  payload: ApiTokenCredentialMutationPayload | null | undefined,
  graphQLErrors?: readonly unknown[] | null
): ApiTokenCredentialMutationOutcome {
  return {
    error: routeMutationErrorMessage(payload?.errors, graphQLErrors),
    plainTextToken: null,
    token: null
  };
}

function revokeMutationFailure(
  payload: ApiTokenMutationPayload | null | undefined,
  graphQLErrors?: readonly unknown[] | null
): RevokeApiTokenMutationOutcome {
  return {
    error: routeMutationErrorMessage(payload?.errors, graphQLErrors),
    token: null
  };
}

function optionalFormText(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

function normalizeDateTimeLocalValue(value: string | null) {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function mergeApiTokenSummaries(
  localTokens: readonly ApiTokenRecord[],
  loaderTokens: readonly ApiTokenRecord[]
) {
  if (localTokens.length === 0) {
    return [...loaderTokens];
  }

  const localTokenIds = new Set(localTokens.map((token) => token.id));
  return [...localTokens, ...loaderTokens.filter((token) => !localTokenIds.has(token.id))];
}

function apiTokenMatchesStatus(token: ApiTokenRecord, status: ApiTokenStatus) {
  if (status === "all") {
    return true;
  }

  if (status === "active") {
    return apiTokenIsActive(token);
  }

  return token.revokedAt !== null;
}

function mergeApiTokenUpdate(
  token: ApiTokenRecord,
  updatedToken: ApiTokenRecord | undefined
) {
  if (!updatedToken) {
    return token;
  }

  return {
    ...token,
    revokedAt: token.revokedAt ?? updatedToken.revokedAt
  } satisfies ApiTokenRecord;
}

function formatOptionalDateTime(value: string | null, emptyLabel: string) {
  return value ? formatUtcDateTime(value) : emptyLabel;
}

function formatUtcDateTime(value: string) {
  const date = parseGraphQLDateTime(value);

  if (!date) {
    return value;
  }

  return `${date.getUTCFullYear()}-${padUtcPart(date.getUTCMonth() + 1)}-${padUtcPart(
    date.getUTCDate()
  )} ${padUtcPart(date.getUTCHours())}:${padUtcPart(date.getUTCMinutes())} UTC`;
}

function padUtcPart(value: number) {
  return value.toString().padStart(2, "0");
}

function apiTokenStatusLabel(token: ApiTokenRecord) {
  if (token.revokedAt) {
    return "Revoked token";
  }

  return apiTokenIsActive(token) ? "Active token" : "Expired token";
}
