import { nextRelayPageCursor } from "../../src/routes/relay-pagination";

test.each([
  [undefined, null],
  [null, null],
  [{ endCursor: "cursor-2", hasNextPage: false }, null],
  [{ endCursor: null, hasNextPage: true }, null],
  [{ endCursor: "", hasNextPage: true }, null],
  [{ endCursor: "   ", hasNextPage: true }, null],
  [{ endCursor: "cursor-1", hasNextPage: true }, "cursor-1"]
] as const)("nextRelayPageCursor rejects non-advancing page info %#", (pageInfo, currentAfter) => {
  expect(nextRelayPageCursor(pageInfo, currentAfter)).toBeNull();
});

test("nextRelayPageCursor returns the exact advancing cursor without trimming it", () => {
  expect(
    nextRelayPageCursor(
      { endCursor: "  cursor-2  ", hasNextPage: true },
      "cursor-1"
    )
  ).toBe("  cursor-2  ");
});
