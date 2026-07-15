import {
  apiTokenPagePath,
  apiTokensRouteLocationIdentity,
  buildApiTokenDisplayData,
  buildApiTokensViewState,
  buildCreateApiTokenVariables,
  buildRotateApiTokenVariables,
  markTokenRotated,
  summarizeMutationApiToken,
  upsertApiTokenSummary
} from "../../../../src/routes/account/api-tokens/api-token-route-data";

const SERVER_TOKEN = {
  id: "server-token",
  label: "Server token",
  tokenPrefix: "server-prefix",
  lastUsedAt: null,
  expiresAt: null,
  revokedAt: null,
  insertedAt: "2026-07-01T00:00:00Z"
};

const LOCAL_TOKEN = {
  ...SERVER_TOKEN,
  id: "local-token",
  label: "Local token",
  tokenPrefix: "local-prefix"
};

test("buildApiTokenDisplayData preserves labeled tokens and names null labels", () => {
  expect(buildApiTokenDisplayData(SERVER_TOKEN).displayLabel).toBe("Server token");
  expect(buildApiTokenDisplayData({ ...SERVER_TOKEN, label: null }).displayLabel).toBe(
    "Unlabeled token"
  );
});

test("buildApiTokenDisplayData formats offset-aware lifecycle timestamps in UTC", () => {
  expect(
    buildApiTokenDisplayData({
      ...SERVER_TOKEN,
      expiresAt: "2026-08-29T12:00:59.123Z",
      lastUsedAt: "2026-08-29T14:30:00+02:30",
      insertedAt: "2026-07-01T03:15:00-04:00"
    })
  ).toMatchObject({
    expiresAtLabel: "2026-08-29 12:00 UTC",
    lastUsedAtLabel: "2026-08-29 12:00 UTC",
    insertedAtLabel: "2026-07-01 07:15 UTC"
  });
});

test("buildApiTokenDisplayData uses optional lifecycle fallbacks", () => {
  expect(buildApiTokenDisplayData(SERVER_TOKEN)).toMatchObject({
    expiresAtLabel: "Never expires",
    lastUsedAtLabel: "Never used"
  });
});

test.each([
  "2026-02-30T10:15:00Z",
  "2026-08-29T12:00:00",
  "2026-08-29T12:00:59.1234567Z",
  "not-a-timestamp"
])("buildApiTokenDisplayData preserves noncanonical timestamp %s exactly", (value) => {
  expect(
    buildApiTokenDisplayData({
      ...SERVER_TOKEN,
      expiresAt: value,
      lastUsedAt: value,
      insertedAt: value
    })
  ).toMatchObject({
    expiresAtLabel: value,
    lastUsedAtLabel: value,
    insertedAtLabel: value
  });
});

test("buildApiTokenDisplayData gives revoked status precedence over active and expired", () => {
  expect(
    buildApiTokenDisplayData({
      ...SERVER_TOKEN,
      expiresAt: "2000-01-01T00:00:00Z",
      revokedAt: "2026-07-01T00:00:00Z"
    }).statusLabel
  ).toBe("Revoked token");
  expect(
    buildApiTokenDisplayData({
      ...SERVER_TOKEN,
      expiresAt: "2999-01-01T00:00:00Z"
    }).statusLabel
  ).toBe("Active token");
  expect(
    buildApiTokenDisplayData({
      ...SERVER_TOKEN,
      expiresAt: "2000-01-01T00:00:00Z"
    }).statusLabel
  ).toBe("Expired token");
});

test("apiTokensRouteLocationIdentity separates authorization, status, and cursor state", () => {
  expect(apiTokensRouteLocationIdentity({
    status: "unauthorized",
    tokenStatus: "all"
  })).toBe("unauthorized?status=all");
  expect(apiTokensRouteLocationIdentity({
    status: "ready",
    tokenStatus: "revoked",
    after: "cursor-next"
  })).toBe("authorized?status=revoked&after=cursor-next");
});

test("apiTokenPagePath preserves status and safely encodes an optional cursor", () => {
  expect(apiTokenPagePath("active", null)).toBe("/account/api-tokens?status=active");
  expect(apiTokenPagePath("revoked", "cursor/next?")).toBe(
    "/account/api-tokens?status=revoked&after=cursor%2Fnext%3F"
  );
});

test("buildCreateApiTokenVariables trims input and normalizes a manual expiry", () => {
  const formData = buildFormData({
    label: "  CLI automation  ",
    expiresAtPreset: "30 days",
    expiresAt: "2026-08-29T12:00"
  });

  expect(buildCreateApiTokenVariables(formData)).toEqual({
    label: "CLI automation",
    expiresAt: new Date("2026-08-29T12:00").toISOString()
  });
});

test("buildCreateApiTokenVariables distinguishes omitted, no-expiry, and invalid expiry", () => {
  expect(buildCreateApiTokenVariables(buildFormData({ label: "  " }))).toEqual({
    label: null
  });
  expect(buildCreateApiTokenVariables(buildFormData({ expiresAtPreset: "No expiration" }))).toEqual({
    label: null,
    expiresAt: null
  });
  expect(buildCreateApiTokenVariables(buildFormData({ expiresAt: "invalid-date" }))).toEqual({
    label: null,
    expiresAt: null
  });
});

test("buildRotateApiTokenVariables uses a trimmed replacement label or the existing label", () => {
  expect(buildRotateApiTokenVariables(SERVER_TOKEN, buildFormData({ label: "  Replacement  " }))).toEqual({
    tokenId: SERVER_TOKEN.id,
    label: "Replacement"
  });
  expect(buildRotateApiTokenVariables(SERVER_TOKEN, buildFormData({ label: "  " }))).toEqual({
    tokenId: SERVER_TOKEN.id,
    label: SERVER_TOKEN.label
  });
  expect(buildRotateApiTokenVariables(SERVER_TOKEN, buildFormData({ expiresAtPreset: "No expiration" }))).toEqual({
    tokenId: SERVER_TOKEN.id,
    label: SERVER_TOKEN.label,
    expiresAt: null
  });
});

test("summarizeMutationApiToken preserves token facts and normalizes nullable fields", () => {
  expect(summarizeMutationApiToken()).toBeNull();
  expect(summarizeMutationApiToken({
    id: "mutation-token",
    label: undefined,
    tokenPrefix: "mutation-prefix",
    lastUsedAt: undefined,
    expiresAt: null,
    revokedAt: undefined,
    insertedAt: "2026-07-14T00:00:00Z"
  })).toEqual({
    id: "mutation-token",
    label: null,
    tokenPrefix: "mutation-prefix",
    lastUsedAt: null,
    expiresAt: null,
    revokedAt: null,
    insertedAt: "2026-07-14T00:00:00Z"
  });
});

test("markTokenRotated revokes the predecessor at replacement creation without overwriting history", () => {
  expect(markTokenRotated(SERVER_TOKEN, {
    ...LOCAL_TOKEN,
    insertedAt: "2026-07-14T12:00:00Z"
  }).revokedAt).toBe("2026-07-14T12:00:00Z");
  expect(markTokenRotated({ ...SERVER_TOKEN, revokedAt: "2026-07-10T00:00:00Z" }, LOCAL_TOKEN).revokedAt)
    .toBe("2026-07-10T00:00:00Z");
});

test("upsertApiTokenSummary deduplicates by id and puts the newest snapshot first", () => {
  const replacement = { ...SERVER_TOKEN, label: "Replacement" };

  expect(upsertApiTokenSummary([LOCAL_TOKEN, SERVER_TOKEN], replacement)).toEqual([
    replacement,
    LOCAL_TOKEN
  ]);
});

test("buildApiTokensViewState gives server snapshots precedence over duplicate local state", () => {
  const staleLocalServerToken = { ...SERVER_TOKEN, label: "Stale local token" };
  const result = buildApiTokensViewState(
    {
      status: "ready",
      tokens: [SERVER_TOKEN],
      tokenStatus: "all"
    },
    [staleLocalServerToken, LOCAL_TOKEN]
  );

  expect(result.localTokens).toEqual([LOCAL_TOKEN]);
  expect(result.tokens).toEqual([LOCAL_TOKEN, SERVER_TOKEN]);
  expect(result.statusMessage).toBe("API token created.");
});

test("buildApiTokensViewState returns stable unauthorized and empty copy", () => {
  expect(buildApiTokensViewState({ status: "unauthorized", tokenStatus: "all" })).toEqual({
    localTokens: [],
    statusMessage: "Sign in to manage API tokens.",
    tokens: []
  });
  expect(buildApiTokensViewState({ status: "empty", tokens: [], tokenStatus: "all" })).toEqual({
    localTokens: [],
    statusMessage: "No API tokens yet.",
    tokens: []
  });
});

function buildFormData(values: Record<string, string>) {
  const formData = new FormData();
  Object.entries(values).forEach(([key, value]) => formData.set(key, value));
  return formData;
}
