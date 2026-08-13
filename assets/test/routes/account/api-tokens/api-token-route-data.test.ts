import {
  apiTokenPagePath,
  apiTokensRouteLocationIdentity,
  buildApiTokenActionPolicy,
  buildApiTokenDisplayData,
  buildApiTokenPaginationData,
  buildApiTokenStatusFilterNavigationData,
  buildApiTokensViewState,
  buildCreateApiTokenVariables,
  buildRotateApiTokenVariables,
  markTokenRotated,
  resolveApiTokenCredentialMutationOutcome,
  resolveRevokeApiTokenMutationOutcome,
  summarizeMutationApiToken,
  upsertApiTokenSummary,
} from "../../../../src/routes/account/api-tokens/api-token-route-data";
import { DEFAULT_MUTATION_ERROR_MESSAGE } from "../../../../src/relay/mutation-errors";

const SERVER_TOKEN = {
  id: "server-token",
  label: "Server token",
  tokenPrefix: "server-prefix",
  lastUsedAt: null,
  expiresAt: null,
  revokedAt: null,
  insertedAt: "2026-07-01T00:00:00Z",
};

const LOCAL_TOKEN = {
  ...SERVER_TOKEN,
  id: "local-token",
  label: "Local token",
  tokenPrefix: "local-prefix",
};

const EXAMPLE_PLAIN_TEXT_TOKEN = ["example", "one", "time", "api", "value"].join("-");

test("buildApiTokenDisplayData preserves labeled tokens and names null labels", () => {
  expect(buildApiTokenDisplayData(SERVER_TOKEN).displayLabel).toBe("Server token");
  expect(buildApiTokenDisplayData({ ...SERVER_TOKEN, label: null }).displayLabel).toBe(
    "Unlabeled token",
  );
});

test("buildApiTokenDisplayData formats offset-aware lifecycle timestamps in UTC", () => {
  expect(
    buildApiTokenDisplayData({
      ...SERVER_TOKEN,
      expiresAt: "2026-08-29T12:00:59.123Z",
      lastUsedAt: "2026-08-29T14:30:00+02:30",
      insertedAt: "2026-07-01T03:15:00-04:00",
    }),
  ).toMatchObject({
    expiresAtLabel: "2026-08-29 12:00 UTC",
    lastUsedAtLabel: "2026-08-29 12:00 UTC",
    insertedAtLabel: "2026-07-01 07:15 UTC",
  });
});

test("buildApiTokenDisplayData formats microseconds in millisecond-only runtimes", () => {
  const NativeDate = Date;

  class MillisecondOnlyDate extends NativeDate {
    constructor(value?: string | number) {
      if (value === undefined) {
        super();
        return;
      }

      if (typeof value === "string" && /\.\d{4,6}(?=Z|[+-]\d{2}:\d{2}$)/.test(value)) {
        super(Number.NaN);
        return;
      }

      super(value);
    }
  }

  vi.stubGlobal("Date", MillisecondOnlyDate);

  try {
    expect(
      buildApiTokenDisplayData({
        ...SERVER_TOKEN,
        expiresAt: "2026-08-29T12:00:59.123456Z",
        lastUsedAt: "2026-08-29T14:30:00.654321+02:30",
        insertedAt: "2026-07-01T03:15:00.987654-04:00",
      }),
    ).toMatchObject({
      expiresAtLabel: "2026-08-29 12:00 UTC",
      lastUsedAtLabel: "2026-08-29 12:00 UTC",
      insertedAtLabel: "2026-07-01 07:15 UTC",
    });
  } finally {
    vi.unstubAllGlobals();
  }
});

test("buildApiTokenDisplayData uses optional lifecycle fallbacks", () => {
  expect(buildApiTokenDisplayData(SERVER_TOKEN)).toMatchObject({
    expiresAtLabel: "Never expires",
    lastUsedAtLabel: "Never used",
  });
});

test.each([
  "2026-02-30T10:15:00Z",
  "2026-08-29T12:00:00",
  "2026-08-29T12:00:59.1234567Z",
  "not-a-timestamp",
])("buildApiTokenDisplayData preserves noncanonical timestamp %s exactly", (value) => {
  expect(
    buildApiTokenDisplayData({
      ...SERVER_TOKEN,
      expiresAt: value,
      lastUsedAt: value,
      insertedAt: value,
    }),
  ).toMatchObject({
    expiresAtLabel: value,
    lastUsedAtLabel: value,
    insertedAtLabel: value,
  });
});

test.each([
  ["active", { expiresAt: "2999-01-01T00:00:00Z", revokedAt: null }, "Active token", "positive"],
  ["revoked", { expiresAt: null, revokedAt: "2026-07-01T00:00:00Z" }, "Revoked token", "neutral"],
  ["expired", { expiresAt: "2000-01-01T00:00:00Z", revokedAt: null }, "Expired token", "neutral"],
  [
    "revoked expired token",
    { expiresAt: "2000-01-01T00:00:00Z", revokedAt: "2026-07-01T00:00:00Z" },
    "Revoked token",
    "neutral",
  ],
] as const)(
  "buildApiTokenDisplayData projects the %s lifecycle label and badge tone without mutating input",
  (_caseName, lifecycleFacts, statusLabel, statusTone) => {
    const token = Object.freeze({ ...SERVER_TOKEN, ...lifecycleFacts });

    expect(buildApiTokenDisplayData(token)).toMatchObject({ statusLabel, statusTone });
    expect(token).toEqual({ ...SERVER_TOKEN, ...lifecycleFacts });
  },
);

test("buildApiTokenDisplayData derives status label and tone from one lifecycle snapshot", () => {
  const expiresAt = "2026-07-17T00:00:00Z";
  const dateNowSpy = vi
    .spyOn(Date, "now")
    .mockReturnValueOnce(Date.parse(expiresAt) - 1)
    .mockReturnValue(Date.parse(expiresAt));

  try {
    expect(buildApiTokenDisplayData(Object.freeze({ ...SERVER_TOKEN, expiresAt }))).toMatchObject({
      statusLabel: "Active token",
      statusTone: "positive",
    });
  } finally {
    dateNowSpy.mockRestore();
  }
});

test.each([
  [
    "active",
    SERVER_TOKEN,
    false,
    false,
    {
      revoke: { copy: "Revoke token", disabled: false, visible: true },
      rotate: { copy: "Rotate token", disabled: false, visible: true },
    },
  ],
  [
    "expired",
    { ...SERVER_TOKEN, expiresAt: "2000-01-01T00:00:00Z" },
    false,
    false,
    {
      revoke: { copy: "Revoke token", disabled: false, visible: true },
      rotate: { copy: "Rotate token", disabled: false, visible: false },
    },
  ],
  [
    "revoked",
    { ...SERVER_TOKEN, revokedAt: "2026-07-01T00:00:00Z" },
    false,
    false,
    {
      revoke: { copy: "Revoke token", disabled: false, visible: false },
      rotate: { copy: "Rotate token", disabled: false, visible: false },
    },
  ],
  [
    "rotate pending",
    SERVER_TOKEN,
    false,
    true,
    {
      revoke: { copy: "Revoke token", disabled: true, visible: true },
      rotate: { copy: "Rotating token...", disabled: true, visible: true },
    },
  ],
  [
    "revoke pending",
    SERVER_TOKEN,
    true,
    false,
    {
      revoke: { copy: "Revoking token...", disabled: true, visible: true },
      rotate: { copy: "Rotate token", disabled: true, visible: true },
    },
  ],
] as const)(
  "buildApiTokenActionPolicy projects %s row actions",
  (_caseName, token, revokePending, rotatePending, expected) => {
    expect(buildApiTokenActionPolicy(token, { revokePending, rotatePending })).toEqual(expected);
  },
);

test("apiTokensRouteLocationIdentity separates authorization, status, and cursor state", () => {
  expect(
    apiTokensRouteLocationIdentity({
      status: "unauthorized",
      tokenStatus: "all",
    }),
  ).toBe("unauthorized?status=all");
  expect(
    apiTokensRouteLocationIdentity({
      status: "ready",
      tokenStatus: "revoked",
      after: "cursor-next",
    }),
  ).toBe("authorized?status=revoked&after=cursor-next");
});

test("apiTokenPagePath preserves status and safely encodes an optional cursor", () => {
  expect(apiTokenPagePath("active", null)).toBe("/account/api-tokens?status=active");
  expect(apiTokenPagePath("revoked", "cursor/next?")).toBe(
    "/account/api-tokens?status=revoked&after=cursor%2Fnext%3F",
  );
});

test("buildApiTokenStatusFilterNavigationData projects ordered canonical navigation with one current filter", () => {
  const input = Object.freeze({ tokenStatus: "active" as const });

  expect(buildApiTokenStatusFilterNavigationData(input)).toEqual([
    { href: "/account/api-tokens?status=all", isCurrent: false, label: "All", status: "all" },
    {
      href: "/account/api-tokens?status=active",
      isCurrent: true,
      label: "Active",
      status: "active",
    },
    {
      href: "/account/api-tokens?status=revoked",
      isCurrent: false,
      label: "Revoked",
      status: "revoked",
    },
  ]);
  expect(input).toEqual({ tokenStatus: "active" });
});

test.each(["all", "active", "revoked"] as const)(
  "buildApiTokenStatusFilterNavigationData marks only %s current",
  (tokenStatus) => {
    const currentFilters = buildApiTokenStatusFilterNavigationData({ tokenStatus }).filter(
      (filter) => filter.isCurrent,
    );

    expect(currentFilters).toEqual([expect.objectContaining({ status: tokenStatus })]);
  },
);

test("buildApiTokenPaginationData returns status-preserving first and next paths", () => {
  expect(
    buildApiTokenPaginationData({
      after: "current-cursor",
      endCursor: "next/cursor?",
      hasNextPage: true,
      tokenStatus: "revoked",
    }),
  ).toEqual({
    firstHref: "/account/api-tokens?status=revoked",
    nextHref: "/account/api-tokens?status=revoked&after=next%2Fcursor%3F",
  });
});

test("buildApiTokenPaginationData hides the first path without a current cursor", () => {
  expect(
    buildApiTokenPaginationData({
      after: null,
      endCursor: "next-cursor",
      hasNextPage: true,
      tokenStatus: "active",
    }).firstHref,
  ).toBeNull();
});

test.each([
  [false, "next-cursor"],
  [true, null],
  [true, "  "],
  [true, "current-cursor"],
] as const)(
  "buildApiTokenPaginationData hides incomplete next-page facts",
  (hasNextPage, endCursor) => {
    expect(
      buildApiTokenPaginationData({
        after: "current-cursor",
        endCursor,
        hasNextPage,
        tokenStatus: "all",
      }).nextHref,
    ).toBeNull();
  },
);

test("buildApiTokenPaginationData does not mutate its input", () => {
  const input = Object.freeze({
    after: "current-cursor",
    endCursor: "next-cursor",
    hasNextPage: true,
    tokenStatus: "active" as const,
  });

  buildApiTokenPaginationData(input);

  expect(input).toEqual({
    after: "current-cursor",
    endCursor: "next-cursor",
    hasNextPage: true,
    tokenStatus: "active",
  });
});

test("buildCreateApiTokenVariables trims input and normalizes a manual expiry", () => {
  const formData = buildFormData({
    label: "  CLI automation  ",
    expiresAtPreset: "30 days",
    expiresAt: "2026-08-29T12:00",
  });

  expect(buildCreateApiTokenVariables(formData)).toEqual({
    label: "CLI automation",
    expiresAt: new Date("2026-08-29T12:00").toISOString(),
  });
});

test("buildCreateApiTokenVariables distinguishes omitted, no-expiry, and invalid expiry", () => {
  expect(buildCreateApiTokenVariables(buildFormData({ label: "  " }))).toEqual({
    label: null,
  });
  expect(buildCreateApiTokenVariables(buildFormData({ expiresAtPreset: "No expiration" }))).toEqual(
    {
      label: null,
      expiresAt: null,
    },
  );
  expect(buildCreateApiTokenVariables(buildFormData({ expiresAt: "invalid-date" }))).toEqual({
    label: null,
    expiresAt: null,
  });
});

test("buildRotateApiTokenVariables uses a trimmed replacement label or the existing label", () => {
  expect(
    buildRotateApiTokenVariables(SERVER_TOKEN, buildFormData({ label: "  Replacement  " })),
  ).toEqual({
    tokenId: SERVER_TOKEN.id,
    label: "Replacement",
  });
  expect(buildRotateApiTokenVariables(SERVER_TOKEN, buildFormData({ label: "  " }))).toEqual({
    tokenId: SERVER_TOKEN.id,
    label: SERVER_TOKEN.label,
  });
  expect(
    buildRotateApiTokenVariables(SERVER_TOKEN, buildFormData({ expiresAtPreset: "No expiration" })),
  ).toEqual({
    tokenId: SERVER_TOKEN.id,
    label: SERVER_TOKEN.label,
    expiresAt: null,
  });
});

test("resolveApiTokenCredentialMutationOutcome returns a credential for complete facts", () => {
  expect(
    resolveApiTokenCredentialMutationOutcome(
      {
        plainTextToken: EXAMPLE_PLAIN_TEXT_TOKEN,
        apiToken: SERVER_TOKEN,
        errors: [],
      },
      [],
    ),
  ).toEqual({
    error: null,
    plainTextToken: EXAMPLE_PLAIN_TEXT_TOKEN,
    token: SERVER_TOKEN,
  });
});

test.each([
  ["null", null],
  ["empty", ""],
] as const)(
  "resolveApiTokenCredentialMutationOutcome rejects %s plaintext credentials",
  (_caseName, plainTextToken) => {
    expect(
      resolveApiTokenCredentialMutationOutcome(
        { plainTextToken, apiToken: SERVER_TOKEN, errors: [] },
        [],
      ),
    ).toEqual({
      error: DEFAULT_MUTATION_ERROR_MESSAGE,
      plainTextToken: null,
      token: null,
    });
  },
);

test("resolveApiTokenCredentialMutationOutcome rejects a missing token despite plaintext", () => {
  expect(
    resolveApiTokenCredentialMutationOutcome(
      { plainTextToken: EXAMPLE_PLAIN_TEXT_TOKEN, apiToken: null, errors: [] },
      [],
    ),
  ).toEqual({
    error: DEFAULT_MUTATION_ERROR_MESSAGE,
    plainTextToken: null,
    token: null,
  });
});

test("resolveApiTokenCredentialMutationOutcome gives top-level GraphQL errors precedence", () => {
  expect(
    resolveApiTokenCredentialMutationOutcome(
      {
        plainTextToken: EXAMPLE_PLAIN_TEXT_TOKEN,
        apiToken: SERVER_TOKEN,
        errors: [{ code: "INVALID_ARGUMENT", field: null, message: "Payload error." }],
      },
      [{ message: "Top-level failure" }],
    ),
  ).toEqual({
    error: DEFAULT_MUTATION_ERROR_MESSAGE,
    plainTextToken: null,
    token: null,
  });
});

test("resolveApiTokenCredentialMutationOutcome uses payload errors", () => {
  expect(
    resolveApiTokenCredentialMutationOutcome(
      {
        plainTextToken: null,
        apiToken: null,
        errors: [{ code: "INVALID_ARGUMENT", field: null, message: "Label is invalid." }],
      },
      [],
    ),
  ).toMatchObject({ error: "Label is invalid.", plainTextToken: null, token: null });
});

test("resolveApiTokenCredentialMutationOutcome keeps complete payload facts successful despite payload errors", () => {
  const payload = {
    plainTextToken: EXAMPLE_PLAIN_TEXT_TOKEN,
    apiToken: SERVER_TOKEN,
    errors: [{ code: "INVALID_ARGUMENT", field: null, message: "Ignored payload error." }],
  };

  expect(resolveApiTokenCredentialMutationOutcome(payload, [])).toEqual({
    error: null,
    plainTextToken: EXAMPLE_PLAIN_TEXT_TOKEN,
    token: SERVER_TOKEN,
  });
  expect(payload).toEqual({
    plainTextToken: EXAMPLE_PLAIN_TEXT_TOKEN,
    apiToken: SERVER_TOKEN,
    errors: [{ code: "INVALID_ARGUMENT", field: null, message: "Ignored payload error." }],
  });
});

test("resolveRevokeApiTokenMutationOutcome returns a token for complete facts", () => {
  expect(
    resolveRevokeApiTokenMutationOutcome(
      { apiToken: { ...SERVER_TOKEN, revokedAt: "2026-07-14T00:00:00Z" }, errors: [] },
      [],
    ),
  ).toEqual({
    error: null,
    token: { ...SERVER_TOKEN, revokedAt: "2026-07-14T00:00:00Z" },
  });
});

test("resolveRevokeApiTokenMutationOutcome uses payload errors and top-level GraphQL precedence", () => {
  expect(
    resolveRevokeApiTokenMutationOutcome(
      {
        apiToken: null,
        errors: [{ code: "INVALID_ARGUMENT", field: null, message: "Token cannot be revoked." }],
      },
      [],
    ),
  ).toEqual({ error: "Token cannot be revoked.", token: null });
  expect(
    resolveRevokeApiTokenMutationOutcome(
      {
        apiToken: SERVER_TOKEN,
        errors: [{ code: "INVALID_ARGUMENT", field: null, message: "Ignored payload error." }],
      },
      [{ message: "Top-level failure" }],
    ),
  ).toEqual({ error: DEFAULT_MUTATION_ERROR_MESSAGE, token: null });
});

test("resolveRevokeApiTokenMutationOutcome keeps complete payload facts successful without mutating input", () => {
  const payload = {
    apiToken: SERVER_TOKEN,
    errors: [{ code: "INVALID_ARGUMENT", field: null, message: "Ignored payload error." }],
  };

  expect(resolveRevokeApiTokenMutationOutcome(payload, [])).toEqual({
    error: null,
    token: SERVER_TOKEN,
  });
  expect(payload).toEqual({
    apiToken: SERVER_TOKEN,
    errors: [{ code: "INVALID_ARGUMENT", field: null, message: "Ignored payload error." }],
  });
});

test("summarizeMutationApiToken preserves token facts and normalizes nullable fields", () => {
  expect(summarizeMutationApiToken(null)).toBeNull();
  expect(
    summarizeMutationApiToken({
      id: "mutation-token",
      label: null,
      tokenPrefix: "mutation-prefix",
      lastUsedAt: null,
      expiresAt: null,
      revokedAt: null,
      insertedAt: "2026-07-14T00:00:00Z",
    }),
  ).toEqual({
    id: "mutation-token",
    label: null,
    tokenPrefix: "mutation-prefix",
    lastUsedAt: null,
    expiresAt: null,
    revokedAt: null,
    insertedAt: "2026-07-14T00:00:00Z",
  });
});

test("markTokenRotated revokes the predecessor at replacement creation without overwriting history", () => {
  expect(
    markTokenRotated(SERVER_TOKEN, {
      ...LOCAL_TOKEN,
      insertedAt: "2026-07-14T12:00:00Z",
    }).revokedAt,
  ).toBe("2026-07-14T12:00:00Z");
  expect(
    markTokenRotated({ ...SERVER_TOKEN, revokedAt: "2026-07-10T00:00:00Z" }, LOCAL_TOKEN).revokedAt,
  ).toBe("2026-07-10T00:00:00Z");
});

test("upsertApiTokenSummary deduplicates by id and puts the newest snapshot first", () => {
  const replacement = { ...SERVER_TOKEN, label: "Replacement" };

  expect(upsertApiTokenSummary([LOCAL_TOKEN, SERVER_TOKEN], replacement)).toEqual([
    replacement,
    LOCAL_TOKEN,
  ]);
});

test("buildApiTokensViewState gives server snapshots precedence over duplicate local state", () => {
  const staleLocalServerToken = { ...SERVER_TOKEN, label: "Stale local token" };
  const result = buildApiTokensViewState(
    {
      after: null,
      status: "ready",
      tokens: [SERVER_TOKEN],
      tokenStatus: "all",
    },
    [staleLocalServerToken, LOCAL_TOKEN],
  );

  expect(result.localTokens).toEqual([LOCAL_TOKEN]);
  expect(result.tokens).toEqual([LOCAL_TOKEN, SERVER_TOKEN]);
  expect(result.statusMessage).toBe("API token created.");
});

test("buildApiTokensViewState returns stable unauthorized and empty copy", () => {
  expect(buildApiTokensViewState({ status: "unauthorized", tokenStatus: "all" })).toEqual({
    localTokens: [],
    statusMessage: "Sign in to manage API tokens.",
    tokens: [],
  });
  expect(
    buildApiTokensViewState({ after: null, status: "empty", tokens: [], tokenStatus: "all" }),
  ).toEqual({
    localTokens: [],
    statusMessage: "No API tokens yet.",
    tokens: [],
  });
});

function buildFormData(values: Record<string, string>) {
  const formData = new FormData();
  Object.entries(values).forEach(([key, value]) => formData.set(key, value));
  return formData;
}
