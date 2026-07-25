import {
  buildUpdateCJProgramInput,
  cjProgramStageLabel,
  cjProgramWarningCopy,
  formatCJProgramLastChanged,
  formatCJProgramName,
  formatFeedProductCount
} from "../../../../src/routes/ingestion/cj-programs/cj-program-data";
import {
  buildCJProgramPaginationData,
  cjProgramFilterPath,
  cjProgramStageToUrlParam,
  cjProgramsPaginationFromUrl
} from "../../../../src/routes/ingestion/cj-programs/pagination";

const STAGES = [
  ["NEW", "new"],
  ["CONSIDERING", "considering"],
  ["SELECTED", "selected"],
  ["APPLIED", "applied"],
  ["ACCEPTED", "accepted"],
  ["NOT_PURSUING", "not_pursuing"],
  ["DECLINED", "declined"]
] as const;

test.each(STAGES)(
  "normalizes the %s program stage from its %s URL value",
  (stage, urlValue) => {
    expect(
      cjProgramsPaginationFromUrl(
        new URL(`https://app.example.test/ingestion/cj-programs?stage=${urlValue}`)
      )
    ).toEqual({
      first: 20,
      after: null,
      stage,
      sort: "NAME_ASC",
      unmatchedFirst: 10,
      unmatchedAfter: null
    });
    expect(cjProgramStageToUrlParam(stage)).toBe(urlValue);
    expect(cjProgramStageLabel(stage)).toBe(
      {
        NEW: "New",
        CONSIDERING: "Considering",
        SELECTED: "Selected",
        APPLIED: "Applied",
        ACCEPTED: "Accepted",
        NOT_PURSUING: "Not pursuing",
        DECLINED: "Declined"
      }[stage]
    );
  }
);

test("normalizes page sizes, cursors, stage, and sort independently", () => {
  expect(
    cjProgramsPaginationFromUrl(
      new URL(
        "https://app.example.test/ingestion/cj-programs?first=0&after=%20%20&stage=approved&sort=unknown&unmatchedFirst=51&unmatchedAfter=%20"
      )
    )
  ).toEqual({
    first: 20,
    after: null,
    stage: null,
    sort: "NAME_ASC",
    unmatchedFirst: 10,
    unmatchedAfter: null
  });

  expect(
    cjProgramsPaginationFromUrl(
      new URL(
        "https://app.example.test/ingestion/cj-programs?first=%2050%20&after=%20program-cursor%20&stage=applied&sort=feed_count_desc&unmatchedFirst=1&unmatchedAfter=%20unmatched-cursor%20"
      )
    )
  ).toEqual({
    first: 50,
    after: "program-cursor",
    stage: "APPLIED",
    sort: "FEED_COUNT_DESC",
    unmatchedFirst: 1,
    unmatchedAfter: "unmatched-cursor"
  });
});

test("builds independent program and unmatched pagination links without dropping state", () => {
  const pagination = {
    first: 25,
    after: "program-current",
    stage: "APPLIED" as const,
    sort: "FEED_COUNT_DESC" as const,
    unmatchedFirst: 13,
    unmatchedAfter: "unmatched-current"
  };

  expect(
    buildCJProgramPaginationData(pagination, {
      program: {
        endCursor: "program-next",
        hasNextPage: true,
        hasPreviousPage: true
      },
      unmatched: {
        endCursor: "unmatched-next",
        hasNextPage: true,
        hasPreviousPage: true
      }
    })
  ).toEqual({
    program: {
      firstHref:
        "/ingestion/cj-programs?first=25&stage=applied&sort=feed_count_desc&unmatchedFirst=13&unmatchedAfter=unmatched-current",
      nextHref:
        "/ingestion/cj-programs?first=25&after=program-next&stage=applied&sort=feed_count_desc&unmatchedFirst=13&unmatchedAfter=unmatched-current"
    },
    unmatched: {
      firstHref:
        "/ingestion/cj-programs?first=25&after=program-current&stage=applied&sort=feed_count_desc&unmatchedFirst=13",
      nextHref:
        "/ingestion/cj-programs?first=25&after=program-current&stage=applied&sort=feed_count_desc&unmatchedFirst=13&unmatchedAfter=unmatched-next"
    }
  });
});

test("resets only the program cursor when stage or sort controls change", () => {
  expect(
    cjProgramFilterPath(
      {
        first: 25,
        after: "program-current",
        stage: "APPLIED",
        sort: "NAME_ASC",
        unmatchedFirst: 13,
        unmatchedAfter: "unmatched-current"
      },
      { stage: "ACCEPTED", sort: "LAST_CHANGED_DESC" }
    )
  ).toBe(
    "/ingestion/cj-programs?first=25&stage=accepted&sort=last_changed_desc&unmatchedFirst=13&unmatchedAfter=unmatched-current"
  );
});

test("does not build a next link that repeats either connection cursor", () => {
  const pagination = {
    first: 20,
    after: "program-current",
    stage: null,
    sort: "NAME_ASC" as const,
    unmatchedFirst: 10,
    unmatchedAfter: "unmatched-current"
  };

  expect(
    buildCJProgramPaginationData(pagination, {
      program: {
        endCursor: "program-current",
        hasNextPage: true,
        hasPreviousPage: false
      },
      unmatched: {
        endCursor: "unmatched-current",
        hasNextPage: true,
        hasPreviousPage: false
      }
    })
  ).toEqual({
    program: { firstHref: null, nextHref: null },
    unmatched: { firstHref: null, nextHref: null }
  });
});

test("renders factual program and feed details without inventing fit signals", () => {
  expect(formatCJProgramName({ advertiserId: "trail", advertiserName: "Trail Merchant" })).toBe(
    "Trail Merchant"
  );
  expect(formatCJProgramName({ advertiserId: "trail", advertiserName: null })).toBe("trail");
  expect(formatFeedProductCount(null)).toBe("Product count unavailable");
  expect(formatFeedProductCount(1)).toBe("1 product");
  expect(formatFeedProductCount(2)).toBe("2 products");
  expect(formatCJProgramLastChanged("2026-07-20T10:00:00.000000Z")).toBe(
    "Jul 20, 2026, 10:00 AM"
  );
  expect(formatCJProgramLastChanged("not-a-date")).toBe("");
});

test("maps warning codes to their underlying missing information", () => {
  expect(cjProgramWarningCopy("MISSING_ADVERTISER_NAME")).toBe(
    "Advertiser name is unavailable."
  );
  expect(cjProgramWarningCopy("MISSING_PRODUCT_COUNT")).toBe(
    "Product count is unavailable."
  );
  expect(cjProgramWarningCopy("NON_US_MARKET")).toBe(
    "No observed feed is in the US market."
  );
  expect(cjProgramWarningCopy("NON_USD_CURRENCY")).toBe(
    "No observed feed uses USD."
  );
  expect(cjProgramWarningCopy("NON_ENGLISH_LANGUAGE")).toBe(
    "No observed feed is in English."
  );
  expect(cjProgramWarningCopy("UNKNOWN")).toBeNull();
});

test("does not relabel future or unknown Relay enum values as New", () => {
  expect(cjProgramStageLabel("%future added value")).toBeNull();
  expect(cjProgramStageLabel("RETIRED")).toBeNull();
  expect(cjProgramWarningCopy("%future added value")).toBeNull();
});

test("builds a mutation input from the directly selected stage and trimmed note", () => {
  expect(buildUpdateCJProgramInput("Q2pQcm9ncmFtOjE=", "DECLINED", "  Not a fit now  ")).toEqual(
    {
      id: "Q2pQcm9ncmFtOjE=",
      stage: "DECLINED",
      note: "Not a fit now"
    }
  );
  expect(buildUpdateCJProgramInput("Q2pQcm9ncmFtOjE=", "ACCEPTED", "   ")).toEqual({
    id: "Q2pQcm9ncmFtOjE=",
    stage: "ACCEPTED",
    note: null
  });
});
