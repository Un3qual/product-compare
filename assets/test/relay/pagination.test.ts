import { nextPageCursor } from "../../src/relay/pagination";

test.each([
  [undefined, null],
  [null, null],
  [{ endCursor: "cursor-2", hasNextPage: false }, null],
  [{ endCursor: null, hasNextPage: true }, null],
  [{ endCursor: "", hasNextPage: true }, null],
  [{ endCursor: "cursor-1", hasNextPage: true }, "cursor-1"],
] as const)("nextPageCursor rejects non-advancing page info %#", (pageInfo, currentAfter) => {
  expect(nextPageCursor(pageInfo, currentAfter)).toBeNull();
});

test("nextPageCursor returns the advancing Relay cursor", () => {
  expect(nextPageCursor({ endCursor: "cursor-2", hasNextPage: true }, "cursor-1")).toBe("cursor-2");
});
