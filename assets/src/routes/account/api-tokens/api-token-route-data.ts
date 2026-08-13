import type { ApiTokenOperationsCreateApiTokenMutation } from "$generated/ApiTokenOperationsCreateApiTokenMutation.graphql";
import type { ApiTokenOperationsRevokeApiTokenMutation } from "$generated/ApiTokenOperationsRevokeApiTokenMutation.graphql";
import type { ApiTokenOperationsRotateApiTokenMutation } from "$generated/ApiTokenOperationsRotateApiTokenMutation.graphql";
import type { ApiTokensRouteQuery } from "$generated/ApiTokensRouteQuery.graphql";
import {
  hasGraphQLErrors,
  mutationErrorMessage,
  type MutationGraphQLErrors,
} from "$relay/mutation-errors";
import { nextPageCursor } from "$relay/pagination";
import { parseGraphQLDateTime } from "$relay/scalars";
import { apiTokenIsActive } from "./api-token-status";

export type ApiTokenStatus = "active" | "revoked" | "all";

type ApiTokenQueryNode = ApiTokensRouteQuery["response"]["myApiTokens"]["edges"][number]["node"];
type CreateApiTokenPayload = ApiTokenOperationsCreateApiTokenMutation["response"]["createApiToken"];
type RotateApiTokenPayload = ApiTokenOperationsRotateApiTokenMutation["response"]["rotateApiToken"];
type RevokeApiTokenPayload = ApiTokenOperationsRevokeApiTokenMutation["response"]["revokeApiToken"];

export type ApiTokenRecord = ReturnType<typeof normalizeApiToken>;

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

export type ApiTokensRouteData = AuthorizedApiTokensRouteData | UnauthorizedApiTokensRouteData;

export type ApiTokensRouteIdentityData = {
  status: "ready" | "empty" | "unauthorized";
  tokenStatus: ApiTokenStatus;
  after?: string | null;
};

export type MutationApiToken = NonNullable<CreateApiTokenPayload["apiToken"]>;
type ApiTokenCredentialMutationPayload = CreateApiTokenPayload | RotateApiTokenPayload;

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
  const isActive = apiTokenIsActive(token);

  return {
    displayLabel: token.label ?? "Unlabeled token",
    expiresAtLabel: formatOptionalDateTime(token.expiresAt, "Never expires"),
    lastUsedAtLabel: formatOptionalDateTime(token.lastUsedAt, "Never used"),
    insertedAtLabel: formatUtcDateTime(token.insertedAt),
    statusLabel: apiTokenStatusLabel(token, isActive),
    statusTone: isActive ? ("positive" as const) : ("neutral" as const),
  };
}

export function buildApiTokenActionPolicy(
  token: ApiTokenRecord,
  {
    revokePending,
    rotatePending,
  }: {
    readonly revokePending: boolean;
    readonly rotatePending: boolean;
  },
) {
  const disabled = revokePending || rotatePending;

  return {
    revoke: {
      copy: revokePending ? "Revoking token..." : "Revoke token",
      disabled,
      visible: token.revokedAt === null,
    },
    rotate: {
      copy: rotatePending ? "Rotating token..." : "Rotate token",
      disabled,
      visible: apiTokenIsActive(token),
    },
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

export function buildApiTokenStatusFilterNavigationData({
  tokenStatus,
}: {
  readonly tokenStatus: ApiTokenStatus;
}) {
  return (
    [
      { label: "All", status: "all" },
      { label: "Active", status: "active" },
      { label: "Revoked", status: "revoked" },
    ] as const
  ).map(({ label, status }) => ({
    href: apiTokenPagePath(status, null),
    isCurrent: tokenStatus === status,
    label,
    status,
  }));
}

export function buildApiTokenPaginationData({
  after,
  endCursor,
  hasNextPage,
  tokenStatus,
}: {
  readonly after: string | null;
  readonly endCursor: string | null;
  readonly hasNextPage: boolean;
  readonly tokenStatus: ApiTokenStatus;
}) {
  const nextCursor = nextPageCursor({ endCursor, hasNextPage }, after);

  return {
    firstHref: after ? apiTokenPagePath(tokenStatus, null) : null,
    nextHref: nextCursor ? apiTokenPagePath(tokenStatus, nextCursor) : null,
  };
}

export function buildApiTokensViewState(
  loaderData: ApiTokensRouteData,
  createdTokens: readonly ApiTokenRecord[] = [],
  apiTokenUpdates: ReadonlyMap<string, ApiTokenRecord> = new Map(),
) {
  if (loaderData.status === "unauthorized") {
    return {
      localTokens: [],
      statusMessage: "Sign in to manage API tokens.",
      tokens: [],
    };
  }

  const loaderTokens = applyApiTokenUpdates(
    loaderData.tokens,
    apiTokenUpdates,
    loaderData.tokenStatus,
  );
  const loaderTokenIds = new Set(loaderTokens.map((token) => token.id));
  const localTokens = applyApiTokenUpdates(
    createdTokens,
    apiTokenUpdates,
    loaderData.tokenStatus,
  ).filter((token) => !loaderTokenIds.has(token.id));
  const tokens = mergeApiTokenSummaries(localTokens, loaderTokens);

  if (tokens.length === 0) {
    return {
      localTokens,
      statusMessage: "No API tokens yet.",
      tokens: [],
    };
  }

  return {
    localTokens,
    statusMessage: localTokens.length > 0 ? "API token created." : "",
    tokens,
  };
}

export function buildCreateApiTokenVariables(formData: FormData) {
  const expiresAt = normalizeExpiresAtFormValue(formData);
  return {
    label: optionalFormText(formData.get("label")),
    ...(expiresAt === undefined ? {} : { expiresAt }),
  } satisfies ApiTokenOperationsCreateApiTokenMutation["variables"];
}

export function buildRotateApiTokenVariables(token: ApiTokenRecord, formData: FormData) {
  const expiresAt = normalizeExpiresAtFormValue(formData);
  return {
    tokenId: token.id,
    label: optionalFormText(formData.get("label")) ?? token.label,
    ...(expiresAt === undefined ? {} : { expiresAt }),
  } satisfies ApiTokenOperationsRotateApiTokenMutation["variables"];
}

export function resolveApiTokenCredentialMutationOutcome(
  payload: ApiTokenCredentialMutationPayload,
  graphQLErrors: MutationGraphQLErrors = null,
): ApiTokenCredentialMutationOutcome {
  if (hasGraphQLErrors(graphQLErrors)) {
    return credentialMutationFailure(payload, graphQLErrors);
  }

  const token = summarizeMutationApiToken(payload.apiToken);

  if (payload.plainTextToken && token) {
    return { error: null, plainTextToken: payload.plainTextToken, token };
  }

  return credentialMutationFailure(payload, graphQLErrors);
}

export function resolveRevokeApiTokenMutationOutcome(
  payload: RevokeApiTokenPayload,
  graphQLErrors: MutationGraphQLErrors = null,
): RevokeApiTokenMutationOutcome {
  if (hasGraphQLErrors(graphQLErrors)) {
    return revokeMutationFailure(payload, graphQLErrors);
  }

  const token = summarizeMutationApiToken(payload.apiToken);

  if (token) {
    return { error: null, token };
  }

  return revokeMutationFailure(payload, graphQLErrors);
}

export function summarizeMutationApiToken(token: MutationApiToken | null) {
  return token ? normalizeApiToken(token) : null;
}

export function summarizeApiTokensPage(data: ApiTokensRouteQuery["response"]) {
  const { edges, pageInfo } = data.myApiTokens;

  return {
    tokens: edges.map(({ node }) => normalizeApiToken(node)),
    hasNextPage: pageInfo.hasNextPage,
    endCursor: pageInfo.endCursor ?? null,
  };
}

function normalizeApiToken(node: ApiTokenQueryNode | MutationApiToken) {
  return {
    id: node.id,
    label: node.label ?? null,
    tokenPrefix: node.tokenPrefix,
    lastUsedAt: node.lastUsedAt ?? null,
    expiresAt: node.expiresAt ?? null,
    revokedAt: node.revokedAt ?? null,
    insertedAt: node.insertedAt,
  };
}

export function markTokenRotated(previousToken: ApiTokenRecord, rotatedToken: ApiTokenRecord) {
  return {
    ...previousToken,
    revokedAt: previousToken.revokedAt ?? rotatedToken.insertedAt,
  } satisfies ApiTokenRecord;
}

export function upsertApiTokenSummary(
  tokens: readonly ApiTokenRecord[],
  nextToken: ApiTokenRecord,
) {
  return [nextToken, ...tokens.filter((token) => token.id !== nextToken.id)];
}

export function upsertApiTokenSummaryMap(
  tokens: ReadonlyMap<string, ApiTokenRecord>,
  nextToken: ApiTokenRecord,
) {
  const nextTokens = new Map(tokens);
  nextTokens.set(nextToken.id, nextToken);
  return nextTokens;
}

export function applyApiTokenUpdates(
  tokens: readonly ApiTokenRecord[],
  apiTokenUpdates: ReadonlyMap<string, ApiTokenRecord>,
  status: ApiTokenStatus,
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
  payload: ApiTokenCredentialMutationPayload,
  graphQLErrors: MutationGraphQLErrors,
): ApiTokenCredentialMutationOutcome {
  return {
    error: mutationErrorMessage(payload.errors, graphQLErrors),
    plainTextToken: null,
    token: null,
  };
}

function revokeMutationFailure(
  payload: RevokeApiTokenPayload,
  graphQLErrors: MutationGraphQLErrors,
): RevokeApiTokenMutationOutcome {
  return {
    error: mutationErrorMessage(payload.errors, graphQLErrors),
    token: null,
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
  loaderTokens: readonly ApiTokenRecord[],
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

function mergeApiTokenUpdate(token: ApiTokenRecord, updatedToken: ApiTokenRecord | undefined) {
  if (!updatedToken) {
    return token;
  }

  return {
    ...token,
    revokedAt: token.revokedAt ?? updatedToken.revokedAt,
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
    date.getUTCDate(),
  )} ${padUtcPart(date.getUTCHours())}:${padUtcPart(date.getUTCMinutes())} UTC`;
}

function padUtcPart(value: number) {
  return value.toString().padStart(2, "0");
}

function apiTokenStatusLabel(token: ApiTokenRecord, isActive: boolean) {
  if (token.revokedAt) {
    return "Revoked token";
  }

  return isActive ? "Active token" : "Expired token";
}
