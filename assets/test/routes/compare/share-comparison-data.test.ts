import {
  appendComparisonSnapshotPage,
  buildComparisonSnapshotPublishInput,
  comparisonSnapshotLabel,
  mergeComparisonSnapshots,
  nextComparisonSnapshotCursor,
  publishedSnapshotFromPayload,
  publishComparisonSnapshotState,
  removeComparisonSnapshotId,
  resolvePublishComparisonSnapshotMutationOutcome,
  resolveRevokeComparisonSnapshotMutationOutcome,
  revokeComparisonSnapshotState,
  snapshotRevocationCanStart,
  snapshotRevocationRowState,
  snapshotFromNode,
  type PublishedComparisonSnapshot,
} from "../../../src/routes/compare/share-comparison-data";
import { DEFAULT_MUTATION_ERROR_MESSAGE } from "../../../src/relay/mutation-errors";

const MUTATION_ERROR = {
  code: "INVALID_ARGUMENT",
  field: "snapshotId",
  message: "Comparison snapshot is unavailable.",
} as const;

const GRAPHQL_ERROR = { message: "Private GraphQL failure" } as const;
const PUBLISHED_PAYLOAD_SNAPSHOT = {
  capturedAt: "2026-08-12T12:00:00Z",
  id: "snapshot-1",
  searchIndexable: false,
  title: "Travel kit",
} as const;

test("buildComparisonSnapshotPublishInput preserves product order and maps profiles", () => {
  expect(
    buildComparisonSnapshotPublishInput({
      productIds: ["product-2", "product-1"],
      recommendationProfile: "best_value",
      searchIndexable: true,
      title: "  Travel kit  ",
    }),
  ).toEqual({
    productIds: ["product-2", "product-1"],
    recommendationProfile: "BEST_VALUE",
    searchIndexable: true,
    title: "Travel kit",
  });

  expect(
    buildComparisonSnapshotPublishInput({
      productIds: ["product-1", "product-2"],
      recommendationProfile: "lowest_current_cost",
      searchIndexable: false,
      title: "Comparison",
    }).recommendationProfile,
  ).toBe("LOWEST_CURRENT_COST");
});

test("buildComparisonSnapshotPublishInput omits blank optional titles", () => {
  expect(
    buildComparisonSnapshotPublishInput({
      productIds: ["first", "second"],
      recommendationProfile: "lowest_current_cost",
      searchIndexable: false,
      title: "   ",
    }),
  ).toEqual({
    productIds: ["first", "second"],
    recommendationProfile: "LOWEST_CURRENT_COST",
    searchIndexable: false,
  });
});

test("mergeComparisonSnapshots keeps the first occurrence and removes revoked ids", () => {
  const local = [snapshot("local", "Local"), snapshot("shared", "Local copy")];
  const loaded = [snapshot("shared", "Loaded copy"), snapshot("loaded", "Loaded")];
  const page = [snapshot("loaded", "Page copy"), snapshot("page", null)];

  expect(mergeComparisonSnapshots([local, loaded, page], new Set(["loaded"]))).toEqual([
    snapshot("local", "Local"),
    snapshot("shared", "Local copy"),
    snapshot("page", null),
  ]);
});

test("appendComparisonSnapshotPage preserves order without duplicate state", () => {
  const current = [snapshot("first", "First")];

  expect(
    appendComparisonSnapshotPage(current, [
      snapshot("first", "Duplicate"),
      snapshot("second", "Second"),
      snapshot("second", "Duplicate second"),
      snapshot("third", "Third"),
    ]),
  ).toEqual([snapshot("first", "First"), snapshot("second", "Second"), snapshot("third", "Third")]);
  expect(appendComparisonSnapshotPage(current, [snapshot("first", "Duplicate")])).toBe(current);
});

test("nextComparisonSnapshotCursor returns a non-empty advancing cursor for a next page", () => {
  expect(
    nextComparisonSnapshotCursor(
      { pageInfo: { endCursor: "cursor-40", hasNextPage: true } },
      "cursor-20",
    ),
  ).toBe("cursor-40");
});

test.each([
  ["a null connection", null],
  ["a false next-page flag", { pageInfo: { endCursor: "cursor-40", hasNextPage: false } }],
  ["a blank cursor", { pageInfo: { endCursor: "", hasNextPage: true } }],
  ["a whitespace-only cursor", { pageInfo: { endCursor: "   ", hasNextPage: true } }],
  ["a non-advancing cursor", { pageInfo: { endCursor: "cursor-20", hasNextPage: true } }],
] as const)("nextComparisonSnapshotCursor rejects %s", (_case, connection) => {
  expect(nextComparisonSnapshotCursor(connection, "cursor-20")).toBeNull();
});

test("comparison snapshot state helpers preserve fallback labels and immutable ids", () => {
  expect(comparisonSnapshotLabel(snapshot("untitled", null))).toBe("Open public comparison");
  expect(comparisonSnapshotLabel(snapshot("named", "Camera shortlist"))).toBe("Camera shortlist");

  const ids = new Set(["keep", "remove"]);
  const next = removeComparisonSnapshotId(ids, "remove");

  expect([...next]).toEqual(["keep"]);
  expect([...ids]).toEqual(["keep", "remove"]);
});

test("snapshot revocation row state isolates pending copy, disabled state, errors, and duplicate guards", () => {
  const pendingSnapshotIds = new Set(["snapshot-1"]);
  const errorsBySnapshotId = new Map([["snapshot-2", "Second snapshot cannot be revoked."]]);

  expect(snapshotRevocationRowState("snapshot-1", pendingSnapshotIds, errorsBySnapshotId)).toEqual({
    buttonCopy: "Revoking…",
    disabled: true,
    error: null,
  });
  expect(snapshotRevocationRowState("snapshot-2", pendingSnapshotIds, errorsBySnapshotId)).toEqual({
    buttonCopy: "Revoke public link",
    disabled: false,
    error: "Second snapshot cannot be revoked.",
  });
  expect(snapshotRevocationCanStart(pendingSnapshotIds, "snapshot-1")).toBe(false);
  expect(snapshotRevocationCanStart(pendingSnapshotIds, "snapshot-2")).toBe(true);
});

test("publishedSnapshotFromPayload projects only a complete publish payload", () => {
  expect(
    publishedSnapshotFromPayload(
      {
        snapshot: PUBLISHED_PAYLOAD_SNAPSHOT,
        sharePath: "/compare/shared/public-token",
        errors: [],
      },
      "Travel kit",
    ),
  ).toEqual({
    id: "snapshot-1",
    path: "/compare/shared/public-token",
    title: "Travel kit",
  });

  expect(
    publishedSnapshotFromPayload(
      { snapshot: null, sharePath: "/compare/shared/public-token", errors: [] },
      "Travel kit",
    ),
  ).toBeNull();
});

test("publish mutation outcome projects a complete error-free snapshot", () => {
  const payload = Object.freeze({
    errors: Object.freeze([]),
    sharePath: "/compare/shared/public-token",
    snapshot: Object.freeze(PUBLISHED_PAYLOAD_SNAPSHOT),
  });
  const graphQLErrors = Object.freeze([]);

  expect(
    resolvePublishComparisonSnapshotMutationOutcome(payload, "Travel kit", graphQLErrors),
  ).toEqual({
    error: null,
    snapshot: {
      id: "snapshot-1",
      path: "/compare/shared/public-token",
      title: "Travel kit",
    },
  });
  expect(payload).toEqual({
    errors: [],
    sharePath: "/compare/shared/public-token",
    snapshot: PUBLISHED_PAYLOAD_SNAPSHOT,
  });
  expect(graphQLErrors).toEqual([]);
});

test.each([
  [
    "null snapshot",
    { snapshot: null, sharePath: "/compare/shared/token", errors: [MUTATION_ERROR] },
    MUTATION_ERROR.message,
  ],
  [
    "null share path",
    { snapshot: PUBLISHED_PAYLOAD_SNAPSHOT, sharePath: null, errors: [MUTATION_ERROR] },
    MUTATION_ERROR.message,
  ],
] as const)("publish mutation outcome rejects a %s", (_case, payload, error) => {
  expect(resolvePublishComparisonSnapshotMutationOutcome(payload, null, [])).toEqual({
    error,
    snapshot: null,
  });
});

test("publish outcomes give top-level GraphQL errors precedence over complete data", () => {
  expect(
    resolvePublishComparisonSnapshotMutationOutcome(
      {
        snapshot: PUBLISHED_PAYLOAD_SNAPSHOT,
        sharePath: "/compare/shared/public-token",
        errors: [],
      },
      null,
      [GRAPHQL_ERROR],
    ),
  ).toEqual({ error: DEFAULT_MUTATION_ERROR_MESSAGE, snapshot: null });
});

test("revoke mutation outcome returns the original snapshot for an error-free payload", () => {
  const revoked = Object.freeze(snapshot("snapshot-1", "Travel kit"));
  const payload = Object.freeze({
    errors: Object.freeze([]),
    revokedSnapshotId: "snapshot-1",
  });
  const graphQLErrors = Object.freeze([]);
  const outcome = resolveRevokeComparisonSnapshotMutationOutcome(payload, revoked, graphQLErrors);

  expect(outcome).toEqual({ error: null, snapshot: revoked });
  expect(outcome.snapshot).toBe(revoked);
  expect(payload).toEqual({ errors: [], revokedSnapshotId: "snapshot-1" });
  expect(graphQLErrors).toEqual([]);
});

test.each([
  ["null fact", { revokedSnapshotId: null, errors: [MUTATION_ERROR] }, [], MUTATION_ERROR.message],
  [
    "mismatched fact",
    { revokedSnapshotId: "snapshot-2", errors: [] },
    [],
    DEFAULT_MUTATION_ERROR_MESSAGE,
  ],
  [
    "top-level GraphQL error",
    { revokedSnapshotId: "snapshot-1", errors: [] },
    [GRAPHQL_ERROR],
    DEFAULT_MUTATION_ERROR_MESSAGE,
  ],
] as const)("revoke mutation outcome rejects a %s", (_case, payload, graphQLErrors, error) => {
  expect(
    resolveRevokeComparisonSnapshotMutationOutcome(
      payload,
      snapshot("snapshot-1", "Travel kit"),
      graphQLErrors,
    ),
  ).toEqual({ error, snapshot: null });
});

test("snapshotFromNode projects structural source nodes and falls back to an untitled snapshot", () => {
  expect(
    snapshotFromNode({
      id: "snapshot-1",
      sharePath: "/compare/shared/public-token",
      title: null,
    }),
  ).toEqual({
    id: "snapshot-1",
    path: "/compare/shared/public-token",
    title: null,
  });
});

test("publishComparisonSnapshotState prepends a deduplicated snapshot, clears its tombstone, and preserves inputs", () => {
  const state = {
    message: "An earlier message",
    published: [snapshot("older", "Older"), snapshot("snapshot-1", "Outdated title")],
    revokedSnapshotIds: new Set(["snapshot-1", "other-revoked"]),
  };
  const published = snapshot("snapshot-1", "Travel kit");

  const next = publishComparisonSnapshotState(state, published);

  expect(next).toEqual({
    published: [published, snapshot("older", "Older")],
    revokedSnapshotIds: new Set(["other-revoked"]),
    message:
      "Public comparison link published. Its product details and prices will remain unchanged.",
  });
  expect(next.published).not.toBe(state.published);
  expect(next.revokedSnapshotIds).not.toBe(state.revokedSnapshotIds);
  expect(state).toEqual({
    message: "An earlier message",
    published: [snapshot("older", "Older"), snapshot("snapshot-1", "Outdated title")],
    revokedSnapshotIds: new Set(["snapshot-1", "other-revoked"]),
  });
});

test("revokeComparisonSnapshotState removes a published snapshot, adds its tombstone, and preserves inputs", () => {
  const state = {
    message: "An earlier message",
    published: [snapshot("snapshot-1", "Travel kit"), snapshot("other", "Other")],
    revokedSnapshotIds: new Set(["already-revoked"]),
  };
  const revoked = snapshot("snapshot-1", "Travel kit");

  const next = revokeComparisonSnapshotState(state, revoked);

  expect(next).toEqual({
    published: [snapshot("other", "Other")],
    revokedSnapshotIds: new Set(["already-revoked", "snapshot-1"]),
    message: "Public comparison link revoked. The old link now returns not found.",
  });
  expect(next.published).not.toBe(state.published);
  expect(next.revokedSnapshotIds).not.toBe(state.revokedSnapshotIds);
  expect(state).toEqual({
    message: "An earlier message",
    published: [snapshot("snapshot-1", "Travel kit"), snapshot("other", "Other")],
    revokedSnapshotIds: new Set(["already-revoked"]),
  });
});

function snapshot(id: string, title: string | null): PublishedComparisonSnapshot {
  return {
    id,
    path: `/compare/shared/${id}`,
    title,
  };
}
