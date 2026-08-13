import {
  CJ_PROGRAM_STAGES,
  cjProgramStageLabel,
  cjProgramWarningCopy,
} from "../../../../src/routes/ingestion/cj-programs/programs/lifecycle-policy";
import {
  formatCJDateTime,
  formatFeedProductCount,
} from "../../../../src/routes/ingestion/cj-programs/formatting";
import {
  buildCJProgramPaginationData,
  cjProgramStageToUrlParam,
  cjProgramsPaginationFromUrl,
} from "../../../../src/routes/ingestion/cj-programs/pagination";

test.each(CJ_PROGRAM_STAGES)(
  "normalizes the $value program stage from its $urlValue URL value",
  ({ label, urlValue, value }) => {
    expect(
      cjProgramsPaginationFromUrl(
        new URL(`https://app.example.test/ingestion/cj-programs?stage=${urlValue}`),
      ),
    ).toEqual({
      first: 20,
      after: null,
      stage: value,
      sort: "NAME_ASC",
      unmatchedFirst: 10,
      unmatchedAfter: null,
    });
    expect(cjProgramStageToUrlParam(value)).toBe(urlValue);
    expect(cjProgramStageLabel(value)).toBe(label);
  },
);

test("normalizes page sizes, cursors, stage, and sort independently", () => {
  expect(
    cjProgramsPaginationFromUrl(
      new URL(
        "https://app.example.test/ingestion/cj-programs?first=0&after=%20%20&stage=approved&sort=unknown&unmatchedFirst=51&unmatchedAfter=%20",
      ),
    ),
  ).toEqual({
    first: 20,
    after: null,
    stage: null,
    sort: "NAME_ASC",
    unmatchedFirst: 10,
    unmatchedAfter: null,
  });

  expect(
    cjProgramsPaginationFromUrl(
      new URL(
        "https://app.example.test/ingestion/cj-programs?first=%2050%20&after=%20program-cursor%20&stage=applied&sort=feed_count_desc&unmatchedFirst=1&unmatchedAfter=%20unmatched-cursor%20",
      ),
    ),
  ).toEqual({
    first: 50,
    after: "program-cursor",
    stage: "APPLIED",
    sort: "FEED_COUNT_DESC",
    unmatchedFirst: 1,
    unmatchedAfter: "unmatched-cursor",
  });
});

test("builds independent program and unmatched pagination links without dropping state", () => {
  const pagination = {
    first: 25,
    after: "program-current",
    stage: "APPLIED" as const,
    sort: "FEED_COUNT_DESC" as const,
    unmatchedFirst: 13,
    unmatchedAfter: "unmatched-current",
  };

  expect(
    buildCJProgramPaginationData(pagination, {
      program: {
        endCursor: "program-next",
        hasNextPage: true,
        hasPreviousPage: true,
      },
      unmatched: {
        endCursor: "unmatched-next",
        hasNextPage: true,
        hasPreviousPage: true,
      },
    }),
  ).toEqual({
    program: {
      firstHref:
        "/ingestion/cj-programs?first=25&stage=applied&sort=feed_count_desc&unmatchedFirst=13&unmatchedAfter=unmatched-current",
      nextHref:
        "/ingestion/cj-programs?first=25&after=program-next&stage=applied&sort=feed_count_desc&unmatchedFirst=13&unmatchedAfter=unmatched-current",
    },
    unmatched: {
      firstHref:
        "/ingestion/cj-programs?first=25&after=program-current&stage=applied&sort=feed_count_desc&unmatchedFirst=13",
      nextHref:
        "/ingestion/cj-programs?first=25&after=program-current&stage=applied&sort=feed_count_desc&unmatchedFirst=13&unmatchedAfter=unmatched-next",
    },
  });
});

test("does not build a next link that repeats either connection cursor", () => {
  const pagination = {
    first: 20,
    after: "program-current",
    stage: null,
    sort: "NAME_ASC" as const,
    unmatchedFirst: 10,
    unmatchedAfter: "unmatched-current",
  };

  expect(
    buildCJProgramPaginationData(pagination, {
      program: {
        endCursor: "program-current",
        hasNextPage: true,
        hasPreviousPage: false,
      },
      unmatched: {
        endCursor: "unmatched-current",
        hasNextPage: true,
        hasPreviousPage: false,
      },
    }),
  ).toEqual({
    program: { firstHref: null, nextHref: null },
    unmatched: { firstHref: null, nextHref: null },
  });
});

test("renders factual program and feed details without inventing fit signals", () => {
  expect(formatFeedProductCount(null)).toBe("Product count unavailable");
  expect(formatFeedProductCount(1)).toBe("1 product");
  expect(formatFeedProductCount(2)).toBe("2 products");
  expect(formatCJDateTime("2026-07-20T10:00:00.000000Z")).toBe("Jul 20, 2026, 10:00 AM");
  expect(formatCJDateTime("not-a-date")).toBe("");
});

test("maps mixed-feed warning codes to truthful any-feed copy", () => {
  expect(cjProgramWarningCopy("MISSING_ADVERTISER_NAME")).toBe(
    "At least one observed feed is missing an advertiser name.",
  );
  expect(cjProgramWarningCopy("MISSING_PRODUCT_COUNT")).toBe(
    "At least one observed feed has no positive product count.",
  );
  expect(cjProgramWarningCopy("NON_US_MARKET")).toBe(
    "At least one observed feed is not marked for the US market.",
  );
  expect(cjProgramWarningCopy("NON_USD_CURRENCY")).toBe(
    "At least one observed feed is not marked with USD currency.",
  );
  expect(cjProgramWarningCopy("NON_ENGLISH_LANGUAGE")).toBe(
    "At least one observed feed is not marked as English.",
  );
  expect(cjProgramWarningCopy("%future added value")).toBeNull();
});

test("does not relabel Relay future enum values as New", () => {
  expect(cjProgramStageLabel("%future added value")).toBeNull();
  expect(cjProgramWarningCopy("%future added value")).toBeNull();
});
