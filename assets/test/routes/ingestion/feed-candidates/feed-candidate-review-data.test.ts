import {
  candidateFitReasons,
  candidateFitScore,
  countByReviewStatus,
  feedCandidatesFirstPagePath,
  feedCandidatesNextPagePath,
  formatFeedCandidateName,
  formatFeedCandidateReviewStatus,
  formatProductCount,
  formatReviewedAt,
  reviewStatusTone
} from "../../../../src/routes/ingestion/feed-candidates/feed-candidate-review-data";

const completeCandidate = {
  advertiserCountry: " us ",
  advertiserName: "Trail Merchant",
  currency: " usd ",
  language: " en ",
  productCount: 1000,
  providerFeedId: "feed-1",
  reviewStatus: "SHORTLISTED",
  sourceFeedType: " PRODUCT "
};

test("formats candidate names without treating an empty advertiser name as missing", () => {
  expect(formatFeedCandidateName({ advertiserName: "", providerFeedId: "feed-fallback" })).toBe("");
  expect(formatFeedCandidateName({ advertiserName: null, providerFeedId: "feed-fallback" })).toBe(
    "feed-fallback"
  );
});

test("formats product counts for unavailable, singular, and plural values", () => {
  expect(formatProductCount(null)).toBe("Product count unavailable");
  expect(formatProductCount(1)).toBe("1 product");
  expect(formatProductCount(0)).toBe("0 products");
  expect(formatProductCount(2)).toBe("2 products");
});

test("scores product-count thresholds and normalized market fields in reason order", () => {
  expect(candidateFitScore(completeCandidate)).toBe(85);
  expect(candidateFitReasons(completeCandidate)).toEqual([
    "1000+ products",
    "US market",
    "USD",
    "English",
    "feed type present"
  ]);
  expect(candidateFitScore({ ...completeCandidate, productCount: 10000 })).toBe(100);
  expect(candidateFitScore({ ...completeCandidate, productCount: 100 })).toBe(70);
  expect(candidateFitScore({ ...completeCandidate, productCount: 1 })).toBe(60);
  expect(candidateFitScore({ ...completeCandidate, productCount: 0 })).toBe(50);
  expect(candidateFitReasons({ ...completeCandidate, sourceFeedType: "  " })).not.toContain(
    "feed type present"
  );
});

test("formats review statuses, tones, and counts with unknown values pending", () => {
  expect(formatFeedCandidateReviewStatus("SHORTLISTED")).toBe("Shortlisted");
  expect(formatFeedCandidateReviewStatus("DISMISSED")).toBe("Dismissed");
  expect(formatFeedCandidateReviewStatus("unknown")).toBe("Pending");
  expect(reviewStatusTone("SHORTLISTED")).toBe("positive");
  expect(reviewStatusTone("DISMISSED")).toBe("neutral");
  expect(reviewStatusTone(null)).toBe("warning");
  expect(
    countByReviewStatus([
      { reviewStatus: "SHORTLISTED" },
      { reviewStatus: "DISMISSED" },
      { reviewStatus: "PENDING" },
      { reviewStatus: "unknown" },
      { reviewStatus: null }
    ])
  ).toEqual({ dismissed: 1, pending: 3, shortlisted: 1 });
});

test("formats only valid reviewed times", () => {
  expect(formatReviewedAt("2026-06-04T21:15:00.000000Z")).toBe("Jun 4, 2026, 9:15 PM");
  expect(formatReviewedAt("not-a-date")).toBe("");
  expect(formatReviewedAt(null)).toBe("");
});

test("builds first and next paths with normalized filters", () => {
  const pagination = {
    after: "previous-cursor",
    first: 30,
    reviewStatus: "SHORTLISTED" as const,
    sort: "PRODUCT_COUNT_DESC" as const
  };

  expect(feedCandidatesFirstPagePath(pagination)).toBe(
    "/ingestion/feed-candidates?first=30&reviewStatus=shortlisted&sort=product_count_desc"
  );
  expect(feedCandidatesNextPagePath(pagination, "next-cursor")).toBe(
    "/ingestion/feed-candidates?first=30&after=next-cursor&reviewStatus=shortlisted&sort=product_count_desc"
  );
  expect(
    feedCandidatesFirstPagePath({ ...pagination, reviewStatus: null, sort: "UNSUPPORTED" as never })
  ).toBe("/ingestion/feed-candidates?first=30&sort=name_asc");
});

test("does not mutate candidate arrays or pagination inputs", () => {
  const candidate = { ...completeCandidate };
  const candidates = [candidate, { ...candidate, reviewStatus: "DISMISSED" }];
  const pagination = {
    after: "previous-cursor",
    first: 30,
    reviewStatus: "SHORTLISTED" as const,
    sort: "PRODUCT_COUNT_DESC" as const
  };
  const candidateBefore = structuredClone(candidate);
  const candidatesBefore = structuredClone(candidates);
  const paginationBefore = structuredClone(pagination);

  candidateFitScore(candidate);
  candidateFitReasons(candidate);
  countByReviewStatus(candidates);
  feedCandidatesFirstPagePath(pagination);
  feedCandidatesNextPagePath(pagination, "next-cursor");

  expect(candidate).toEqual(candidateBefore);
  expect(candidates).toEqual(candidatesBefore);
  expect(pagination).toEqual(paginationBefore);
});
