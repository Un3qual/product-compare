import {
  appendComparisonSnapshotPage,
  buildComparisonSnapshotPublishInput,
  comparisonSnapshotLabel,
  mergeComparisonSnapshots,
  publishedSnapshotFromPayload,
  publishComparisonSnapshotState,
  removeComparisonSnapshotId,
  resolvePublishComparisonSnapshotMutationOutcome,
  resolveRevokeComparisonSnapshotMutationOutcome,
  revokeComparisonSnapshotState,
  snapshotFromNode,
  type PublishedComparisonSnapshot
} from "../../../src/routes/compare/share-comparison-data";
import { DEFAULT_ROUTE_ERROR_MESSAGE } from "../../../src/routes/route-errors";

const MUTATION_ERROR = {
  code: "INVALID_ARGUMENT",
  field: "snapshotId",
  message: "Comparison snapshot is unavailable."
} as const;

const GRAPHQL_ERROR = { message: "Private GraphQL failure" } as const;

test("buildComparisonSnapshotPublishInput preserves product order and maps profiles", () => {
  expect(
    buildComparisonSnapshotPublishInput({
      productIds: ["product-2", "product-1"],
      recommendationProfile: "best_value",
      searchIndexable: true,
      title: "  Travel kit  "
    })
  ).toEqual({
    productIds: ["product-2", "product-1"],
    recommendationProfile: "BEST_VALUE",
    searchIndexable: true,
    title: "Travel kit"
  });

  expect(
    buildComparisonSnapshotPublishInput({
      productIds: ["product-1", "product-2"],
      recommendationProfile: "lowest_current_cost",
      searchIndexable: false,
      title: "Comparison"
    }).recommendationProfile
  ).toBe("LOWEST_CURRENT_COST");
});

test("buildComparisonSnapshotPublishInput omits blank optional titles", () => {
  expect(
    buildComparisonSnapshotPublishInput({
      productIds: ["first", "second"],
      recommendationProfile: "lowest_current_cost",
      searchIndexable: false,
      title: "   "
    })
  ).toEqual({
    productIds: ["first", "second"],
    recommendationProfile: "LOWEST_CURRENT_COST",
    searchIndexable: false
  });
});

test("mergeComparisonSnapshots keeps the first occurrence and removes revoked ids", () => {
  const local = [snapshot("local", "Local"), snapshot("shared", "Local copy")];
  const loaded = [snapshot("shared", "Loaded copy"), snapshot("loaded", "Loaded")];
  const page = [snapshot("loaded", "Page copy"), snapshot("page", null)];

  expect(
    mergeComparisonSnapshots([local, loaded, page], new Set(["loaded"]))
  ).toEqual([
    snapshot("local", "Local"),
    snapshot("shared", "Local copy"),
    snapshot("page", null)
  ]);
});

test("appendComparisonSnapshotPage preserves order without duplicate state", () => {
  const current = [snapshot("first", "First")];

  expect(
    appendComparisonSnapshotPage(current, [
      snapshot("first", "Duplicate"),
      snapshot("second", "Second"),
      snapshot("second", "Duplicate second"),
      snapshot("third", "Third")
    ])
  ).toEqual([
    snapshot("first", "First"),
    snapshot("second", "Second"),
    snapshot("third", "Third")
  ]);
  expect(appendComparisonSnapshotPage(current, [snapshot("first", "Duplicate")])).toBe(
    current
  );
});

test("comparison snapshot state helpers preserve fallback labels and immutable ids", () => {
  expect(comparisonSnapshotLabel(snapshot("untitled", null))).toBe(
    "Open public snapshot"
  );
  expect(comparisonSnapshotLabel(snapshot("named", "Camera shortlist"))).toBe(
    "Camera shortlist"
  );

  const ids = new Set(["keep", "remove"]);
  const next = removeComparisonSnapshotId(ids, "remove");

  expect([...next]).toEqual(["keep"]);
  expect([...ids]).toEqual(["keep", "remove"]);
});

test("publishedSnapshotFromPayload projects only a complete publish payload", () => {
  expect(
    publishedSnapshotFromPayload(
      { snapshot: { id: "snapshot-1" }, sharePath: "/compare/shared/public-token" },
      "Travel kit"
    )
  ).toEqual({
    id: "snapshot-1",
    path: "/compare/shared/public-token",
    title: "Travel kit"
  });

  expect(
    publishedSnapshotFromPayload({ snapshot: { id: "snapshot-1" } }, "Travel kit")
  ).toBeNull();
  expect(
    publishedSnapshotFromPayload({ sharePath: "/compare/shared/public-token" }, "Travel kit")
  ).toBeNull();
});

test("publish mutation outcome projects a complete snapshot ahead of payload and GraphQL errors", () => {
  const payload = Object.freeze({
    errors: Object.freeze([MUTATION_ERROR]),
    sharePath: "/compare/shared/public-token",
    snapshot: Object.freeze({ id: "snapshot-1" })
  });
  const graphQLErrors = Object.freeze([GRAPHQL_ERROR]);

  expect(
    resolvePublishComparisonSnapshotMutationOutcome(
      payload,
      "Travel kit",
      graphQLErrors
    )
  ).toEqual({
    error: null,
    snapshot: {
      id: "snapshot-1",
      path: "/compare/shared/public-token",
      title: "Travel kit"
    }
  });
  expect(payload).toEqual({
    errors: [MUTATION_ERROR],
    sharePath: "/compare/shared/public-token",
    snapshot: { id: "snapshot-1" }
  });
  expect(graphQLErrors).toEqual([GRAPHQL_ERROR]);
});

test.each([
  ["missing payload", undefined, DEFAULT_ROUTE_ERROR_MESSAGE],
  ["null payload", null, DEFAULT_ROUTE_ERROR_MESSAGE],
  ["missing snapshot", { sharePath: "/compare/shared/token" }, DEFAULT_ROUTE_ERROR_MESSAGE],
  [
    "missing snapshot id",
    { snapshot: {}, sharePath: "/compare/shared/token" },
    DEFAULT_ROUTE_ERROR_MESSAGE
  ],
  [
    "null snapshot id",
    { snapshot: { id: null }, sharePath: "/compare/shared/token", errors: [MUTATION_ERROR] },
    MUTATION_ERROR.message
  ],
  ["missing share path", { snapshot: { id: "snapshot-1" } }, DEFAULT_ROUTE_ERROR_MESSAGE],
  [
    "null share path",
    { snapshot: { id: "snapshot-1" }, sharePath: null, errors: [MUTATION_ERROR] },
    MUTATION_ERROR.message
  ]
] as const)("publish mutation outcome rejects a %s", (_case, payload, error) => {
  expect(resolvePublishComparisonSnapshotMutationOutcome(payload, null, [])).toEqual({
    error,
    snapshot: null
  });
});

test("incomplete publish outcomes give top-level GraphQL errors precedence", () => {
  expect(
    resolvePublishComparisonSnapshotMutationOutcome(
      { snapshot: null, errors: [MUTATION_ERROR] },
      null,
      [GRAPHQL_ERROR]
    )
  ).toEqual({ error: DEFAULT_ROUTE_ERROR_MESSAGE, snapshot: null });
});

test("revoke mutation outcome returns the original snapshot ahead of payload and GraphQL errors", () => {
  const revoked = Object.freeze(snapshot("snapshot-1", "Travel kit"));
  const payload = Object.freeze({
    errors: Object.freeze([MUTATION_ERROR]),
    revokedSnapshotId: "snapshot-1"
  });
  const graphQLErrors = Object.freeze([GRAPHQL_ERROR]);
  const outcome = resolveRevokeComparisonSnapshotMutationOutcome(
    payload,
    revoked,
    graphQLErrors
  );

  expect(outcome).toEqual({ error: null, snapshot: revoked });
  expect(outcome.snapshot).toBe(revoked);
  expect(payload).toEqual({ errors: [MUTATION_ERROR], revokedSnapshotId: "snapshot-1" });
  expect(graphQLErrors).toEqual([GRAPHQL_ERROR]);
});

test.each([
  ["missing payload", undefined, [], DEFAULT_ROUTE_ERROR_MESSAGE],
  ["null payload", null, [], DEFAULT_ROUTE_ERROR_MESSAGE],
  ["missing fact", { errors: [MUTATION_ERROR] }, [], MUTATION_ERROR.message],
  ["null fact", { revokedSnapshotId: null, errors: [MUTATION_ERROR] }, [], MUTATION_ERROR.message],
  [
    "top-level GraphQL error",
    { revokedSnapshotId: null, errors: [MUTATION_ERROR] },
    [GRAPHQL_ERROR],
    DEFAULT_ROUTE_ERROR_MESSAGE
  ]
] as const)(
  "revoke mutation outcome rejects a %s",
  (_case, payload, graphQLErrors, error) => {
    expect(
      resolveRevokeComparisonSnapshotMutationOutcome(
        payload,
        snapshot("snapshot-1", "Travel kit"),
        graphQLErrors
      )
    ).toEqual({ error, snapshot: null });
  }
);

test("snapshotFromNode projects structural source nodes and falls back to an untitled snapshot", () => {
  expect(
    snapshotFromNode({
      id: "snapshot-1",
      sharePath: "/compare/shared/public-token",
      title: undefined
    })
  ).toEqual({
    id: "snapshot-1",
    path: "/compare/shared/public-token",
    title: null
  });
});

test("publishComparisonSnapshotState prepends a deduplicated snapshot, clears its tombstone, and preserves inputs", () => {
  const state = {
    message: "An earlier message",
    published: [snapshot("older", "Older"), snapshot("snapshot-1", "Outdated title")],
    revokedSnapshotIds: new Set(["snapshot-1", "other-revoked"])
  };
  const published = snapshot("snapshot-1", "Travel kit");

  const next = publishComparisonSnapshotState(state, published);

  expect(next).toEqual({
    published: [published, snapshot("older", "Older")],
    revokedSnapshotIds: new Set(["other-revoked"]),
    message: "Public snapshot published. This link will keep the captured facts unchanged."
  });
  expect(next.published).not.toBe(state.published);
  expect(next.revokedSnapshotIds).not.toBe(state.revokedSnapshotIds);
  expect(state).toEqual({
    message: "An earlier message",
    published: [snapshot("older", "Older"), snapshot("snapshot-1", "Outdated title")],
    revokedSnapshotIds: new Set(["snapshot-1", "other-revoked"])
  });
});

test("revokeComparisonSnapshotState removes a published snapshot, adds its tombstone, and preserves inputs", () => {
  const state = {
    message: "An earlier message",
    published: [snapshot("snapshot-1", "Travel kit"), snapshot("other", "Other")],
    revokedSnapshotIds: new Set(["already-revoked"])
  };
  const revoked = snapshot("snapshot-1", "Travel kit");

  const next = revokeComparisonSnapshotState(state, revoked);

  expect(next).toEqual({
    published: [snapshot("other", "Other")],
    revokedSnapshotIds: new Set(["already-revoked", "snapshot-1"]),
    message: "Public snapshot revoked. The old link now returns not found."
  });
  expect(next.published).not.toBe(state.published);
  expect(next.revokedSnapshotIds).not.toBe(state.revokedSnapshotIds);
  expect(state).toEqual({
    message: "An earlier message",
    published: [snapshot("snapshot-1", "Travel kit"), snapshot("other", "Other")],
    revokedSnapshotIds: new Set(["already-revoked"])
  });
});

function snapshot(id: string, title: string | null): PublishedComparisonSnapshot {
  return {
    id,
    path: `/compare/shared/${id}`,
    title
  };
}
