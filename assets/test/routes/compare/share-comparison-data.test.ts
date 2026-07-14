import {
  appendComparisonSnapshotPage,
  buildComparisonSnapshotPublishInput,
  comparisonSnapshotLabel,
  mergeComparisonSnapshots,
  removeComparisonSnapshotId,
  type PublishedComparisonSnapshot
} from "../../../src/routes/compare/share-comparison-data";

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

function snapshot(id: string, title: string | null): PublishedComparisonSnapshot {
  return {
    id,
    path: `/compare/shared/${id}`,
    title
  };
}
