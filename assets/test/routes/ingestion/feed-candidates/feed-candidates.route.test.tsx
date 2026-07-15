import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, useLoaderData, useRevalidator } from "react-router-dom";
import { useMutation, usePreloadedQuery } from "react-relay";
import {
  useRoutePreloadedQuery,
  type RelayRouteQueryDescriptor
} from "../../../../src/relay/route-preload";
import type { MerchantFeedCandidatesRouteQuery } from "../../../../src/__generated__/MerchantFeedCandidatesRouteQuery.graphql";
import type { FeedCandidate } from "../../../../src/routes/ingestion/feed-candidates/FeedCandidateReviewList";
import {
  formatFeedCandidateName,
  formatFeedCandidateReviewStatus
} from "../../../../src/routes/ingestion/feed-candidates/feed-candidate-review-data";
import { FeedCandidatesRoute } from "../../../../src/routes/ingestion/feed-candidates/FeedCandidatesRoute";
import type { FeedCandidatesLoaderData } from "../../../../src/routes/ingestion/feed-candidates/loader";

const {
  commitReviewMutationMock,
  graphqlMock,
  revalidateMock,
  useLoaderDataMock,
  useMutationMock,
  usePreloadedQueryMock,
  useRevalidatorMock,
  useRoutePreloadedQueryMock
} = vi.hoisted(() => ({
  commitReviewMutationMock: vi.fn(),
  graphqlMock: vi.fn(),
  revalidateMock: vi.fn(),
  useLoaderDataMock: vi.fn(),
  useMutationMock: vi.fn(),
  usePreloadedQueryMock: vi.fn(),
  useRevalidatorMock: vi.fn(),
  useRoutePreloadedQueryMock: vi.fn()
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");

  return {
    ...actual,
    useLoaderData: useLoaderDataMock,
    useRevalidator: useRevalidatorMock
  };
});

vi.mock("react-relay", async () => {
  const actual = await vi.importActual<typeof import("react-relay")>("react-relay");

  return {
    ...actual,
    graphql: graphqlMock,
    useMutation: useMutationMock,
    usePreloadedQuery: usePreloadedQueryMock
  };
});

vi.mock("../../../../src/relay/route-preload", async () => {
  const actual = await vi.importActual<typeof import("../../../../src/relay/route-preload")>(
    "../../../../src/relay/route-preload"
  );

  return {
    ...actual,
    useRoutePreloadedQuery: useRoutePreloadedQueryMock
  };
});

const mockedUseLoaderData = vi.mocked(useLoaderData);
const mockedUseMutation = vi.mocked(useMutation);
const mockedUsePreloadedQuery = vi.mocked(usePreloadedQuery);
const mockedUseRevalidator = vi.mocked(useRevalidator);
const mockedUseRoutePreloadedQuery = vi.mocked(useRoutePreloadedQuery);

const FEED_CANDIDATES_QUERY_DESCRIPTOR: RelayRouteQueryDescriptor<
  MerchantFeedCandidatesRouteQuery["variables"]
> = {
  __relayQuery: {
    operationName: "MerchantFeedCandidatesRouteQuery",
    text: "query MerchantFeedCandidatesRouteQuery($first: Int, $after: String, $reviewStatus: MerchantFeedCandidateReviewStatus, $sort: MerchantFeedCandidateSort) { merchantFeedCandidates(first: $first, after: $after, reviewStatus: $reviewStatus, sort: $sort) { edges { node { id } } } }",
    variables: {
      first: 20,
      after: null,
      reviewStatus: null,
      sort: "NAME_ASC"
    }
  }
};

const FEED_CANDIDATES_QUERY_REF = {
  dispose: vi.fn(),
  variables: FEED_CANDIDATES_QUERY_DESCRIPTOR.__relayQuery.variables
};

beforeEach(() => {
  commitReviewMutationMock.mockReset();
  useLoaderDataMock.mockReset();
  useMutationMock.mockReset();
  usePreloadedQueryMock.mockReset();
  revalidateMock.mockReset();
  useRevalidatorMock.mockReset();
  useRoutePreloadedQueryMock.mockReset();
  FEED_CANDIDATES_QUERY_REF.dispose.mockReset();
  mockedUseLoaderData.mockReturnValue(buildReadyLoaderData());
  mockedUseMutation.mockReturnValue([commitReviewMutationMock, false]);
  mockedUseRevalidator.mockReturnValue({ revalidate: revalidateMock, state: "idle" });
  mockedUseRoutePreloadedQuery.mockReturnValue(FEED_CANDIDATES_QUERY_REF as never);
  mockedUsePreloadedQuery.mockReturnValue(buildFeedCandidatesData());
});

test("feed candidates route renders review-safe candidate rows", () => {
  renderFeedCandidatesRoute();

  expect(screen.getByRole("heading", { name: "CJ feed candidates" })).toBeInTheDocument();
  expect(screen.getByRole("region", { name: "CJ feed candidates" })).toBeInTheDocument();
  expect(screen.getByRole("region", { name: "Feed candidate queue" })).toBeInTheDocument();
  expect(screen.getByRole("complementary", { name: "Candidate controls" })).toBeInTheDocument();
  const candidateList = screen.getByRole("list", { name: "CJ feed candidates" });

  expect(within(candidateList).getByText("Trail Merchant")).toBeInTheDocument();
  expect(within(candidateList).getByText("Trail Shopping")).toBeInTheDocument();
  expect(within(candidateList).getByText("5000 products")).toBeInTheDocument();
  expect(within(candidateList).getAllByText("US")).toHaveLength(2);
  expect(within(candidateList).getAllByText("USD").length).toBeGreaterThanOrEqual(2);
  expect(within(candidateList).getAllByText("EN")).toHaveLength(3);
  expect(within(candidateList).getByText("Pending")).toBeInTheDocument();
  expect(within(candidateList).getByText("Shortlisted")).toBeInTheDocument();
  expect(within(candidateList).getByText("Dismissed")).toBeInTheDocument();
  expect(within(candidateList).getByText("Fit score 85")).toBeInTheDocument();
  const trailReasons = within(candidateList).getByRole("list", {
    name: "Fit reasons for Trail Merchant"
  });
  expect(within(trailReasons).getByText("1000+ products")).toBeInTheDocument();
  expect(within(trailReasons).getByText("US market")).toBeInTheDocument();
  expect(within(trailReasons).getByText("USD")).toBeInTheDocument();
  expect(within(trailReasons).getByText("English")).toBeInTheDocument();
  expect(within(trailReasons).getByText("feed type present")).toBeInTheDocument();
  expect(within(candidateList).getByText("Fit score 20")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Dismiss City Gear" })).toHaveAttribute(
    "data-tone",
    "danger"
  );
  expect(
    within(candidateList).queryByText(/tracking|account|token|raw metadata|rawMetadata|raw_metadata/i)
  ).not.toBeInTheDocument();
  expect(mockedUseRoutePreloadedQuery).toHaveBeenCalledWith(
    expect.anything(),
    FEED_CANDIDATES_QUERY_DESCRIPTOR
  );
  expect(mockedUsePreloadedQuery).toHaveBeenCalledWith(
    expect.anything(),
    FEED_CANDIDATES_QUERY_REF
  );
});

test("feed candidate review presentation formats the candidate name and review status", () => {
  expect(
    formatFeedCandidateName({
      advertiserName: null,
      providerFeedId: "feed-fallback"
    } as FeedCandidate)
  ).toBe("feed-fallback");
  expect(formatFeedCandidateReviewStatus("SHORTLISTED")).toBe("Shortlisted");
});

test("feed candidates route renders current page review counts", () => {
  renderFeedCandidatesRoute();

  const reviewSummary = screen.getByLabelText("CJ feed candidate review summary");

  expect(within(reviewSummary).getByText("Pending")).toBeInTheDocument();
  expect(within(reviewSummary).getByText("Shortlisted")).toBeInTheDocument();
  expect(within(reviewSummary).getByText("Dismissed")).toBeInTheDocument();
  expect(within(reviewSummary).getAllByText("1")).toHaveLength(3);
});

test("feed candidates route renders filter controls", () => {
  renderFeedCandidatesRoute();

  expect(screen.getByRole("combobox", { name: "Review status" })).toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: "Sort candidates" })).toBeInTheDocument();
  expect(screen.getByRole("option", { name: "Fit score" })).toHaveValue(
    "fit_score_desc"
  );
});

test("feed candidates route reflects selected filter controls from loader data", () => {
  mockedUseLoaderData.mockReturnValue(
    buildReadyLoaderData({
      first: 20,
      after: null,
      reviewStatus: "SHORTLISTED",
      sort: "PRODUCT_COUNT_DESC"
    })
  );

  renderFeedCandidatesRoute();

  expect(screen.getByRole("combobox", { name: "Review status" })).toHaveValue(
    "shortlisted"
  );
  expect(screen.getByRole("combobox", { name: "Sort candidates" })).toHaveValue(
    "product_count_desc"
  );
});

test("feed candidates route reflects selected fit-score sort from loader data", () => {
  mockedUseLoaderData.mockReturnValue(
    buildReadyLoaderData({
      first: 20,
      after: null,
      reviewStatus: null,
      sort: "FIT_SCORE_DESC"
    })
  );

  renderFeedCandidatesRoute();

  expect(screen.getByRole("combobox", { name: "Sort candidates" })).toHaveValue(
    "fit_score_desc"
  );
});

test("feed candidates route renders existing review metadata", () => {
  renderFeedCandidatesRoute();

  expect(screen.getAllByText("Prioritized for launch review.")).toHaveLength(2);
  expect(screen.getByText("Reviewed Jun 4, 2026, 9:15 PM")).toBeInTheDocument();
});

test("feed candidates route omits review feedback before an action completes", () => {
  renderFeedCandidatesRoute();

  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});

test("feed candidates route commits review status changes", async () => {
  renderFeedCandidatesRoute();

  fireEvent.click(screen.getByRole("button", { name: "Shortlist City Gear" }));

  await waitFor(() => {
    expect(commitReviewMutationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          input: {
            id: "candidate-2",
            status: "SHORTLISTED"
          }
        }
      })
    );
  });

  fireEvent.click(screen.getByRole("button", { name: "Dismiss City Gear" }));
  fireEvent.click(screen.getByRole("button", { name: "Reset City Gear" }));

  await waitFor(() => {
    expect(commitReviewMutationMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        variables: {
          input: {
            id: "candidate-2",
            status: "DISMISSED"
          }
        }
      })
    );
    expect(commitReviewMutationMock).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        variables: {
          input: {
            id: "candidate-2",
            status: "PENDING"
          }
        }
      })
    );
  });
});

test("feed candidates route sends trimmed review notes when present", async () => {
  renderFeedCandidatesRoute();

  fireEvent.change(screen.getByLabelText("Review note for Trail Merchant"), {
    target: {
      value: "  High fit for launch cohort  "
    }
  });
  fireEvent.click(screen.getByRole("button", { name: "Shortlist Trail Merchant" }));

  await waitFor(() => {
    expect(commitReviewMutationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          input: {
            id: "candidate-1",
            status: "SHORTLISTED",
            note: "High fit for launch cohort"
          }
        }
      })
    );
  });
});

test("feed candidates route sends blank review notes when clearing a draft", async () => {
  renderFeedCandidatesRoute();

  fireEvent.change(screen.getByLabelText("Review note for City Gear"), {
    target: {
      value: "   "
    }
  });
  fireEvent.click(screen.getByRole("button", { name: "Dismiss City Gear" }));

  await waitFor(() => {
    expect(commitReviewMutationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          input: {
            id: "candidate-2",
            status: "DISMISSED",
            note: ""
          }
        }
      })
    );
  });
});

test("feed candidates route clears draft notes and revalidates after successful reviews", async () => {
  commitReviewMutationMock.mockImplementation(({ onCompleted }) => {
    onCompleted(
      {
        reviewMerchantFeedCandidate: {
          candidate: {
            reviewStatus: "SHORTLISTED"
          },
          errors: []
        }
      },
      null
    );
  });

  renderFeedCandidatesRoute();

  const reviewNote = screen.getByLabelText("Review note for Trail Merchant");

  fireEvent.change(reviewNote, {
    target: {
      value: "  High fit for launch cohort  "
    }
  });
  expect(reviewNote).toHaveValue("  High fit for launch cohort  ");

  fireEvent.click(screen.getByRole("button", { name: "Shortlist Trail Merchant" }));

  await waitFor(() => {
    expect(reviewNote).toHaveValue("Prioritized for launch review.");
    expect(revalidateMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Trail Merchant marked Shortlisted."
    );
  });
});

test("feed candidates route renders mutation payload errors", async () => {
  commitReviewMutationMock.mockImplementation(({ onCompleted }) => {
    onCompleted(
      {
        reviewMerchantFeedCandidate: {
          candidate: null,
          errors: [
            {
              code: "INVALID_ID",
              field: "id",
              message: "invalid candidate id"
            }
          ]
        }
      },
      null
    );
  });

  renderFeedCandidatesRoute();

  fireEvent.click(screen.getByRole("button", { name: "Shortlist Trail Merchant" }));

  await waitFor(() => {
    expect(screen.getByRole("status")).toHaveTextContent("invalid candidate id");
  });
});

test("feed candidates route renders an empty state", () => {
  mockedUsePreloadedQuery.mockReturnValue(buildFeedCandidatesData({ candidates: [] }));

  renderFeedCandidatesRoute();

  expect(screen.getByRole("heading", { name: "CJ feed candidates" })).toBeInTheDocument();
  expect(screen.getByText("No CJ feed candidates captured yet.")).toBeInTheDocument();
});

test("feed candidates route first-page link preserves filters and drops after", () => {
  mockedUseLoaderData.mockReturnValue(
    buildReadyLoaderData({
      first: 30,
      after: "previous-cursor",
      reviewStatus: "SHORTLISTED",
      sort: "PRODUCT_COUNT_DESC"
    })
  );
  mockedUsePreloadedQuery.mockReturnValue(
    buildFeedCandidatesData({
      hasNextPage: false,
      hasPreviousPage: true
    })
  );

  renderFeedCandidatesRoute();

  expect(screen.getByRole("link", { name: "First candidates" })).toHaveAttribute(
    "href",
    "/ingestion/feed-candidates?first=30&reviewStatus=shortlisted&sort=product_count_desc"
  );
});

test("feed candidates route next-page link preserves filters and page size", () => {
  mockedUseLoaderData.mockReturnValue(
    buildReadyLoaderData({
      first: 30,
      after: "previous-cursor",
      reviewStatus: "SHORTLISTED",
      sort: "PRODUCT_COUNT_DESC"
    })
  );
  mockedUsePreloadedQuery.mockReturnValue(
    buildFeedCandidatesData({
      endCursor: "next-cursor",
      hasNextPage: true,
      hasPreviousPage: true
    })
  );

  renderFeedCandidatesRoute();

  expect(screen.getByRole("link", { name: "Next candidates" })).toHaveAttribute(
    "href",
    "/ingestion/feed-candidates?first=30&after=next-cursor&reviewStatus=shortlisted&sort=product_count_desc"
  );
});

test("feed candidates route renders the loader error state", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "error",
    pagination: {
      first: 20,
      after: null,
      reviewStatus: null,
      sort: "NAME_ASC"
    }
  } satisfies FeedCandidatesLoaderData);

  renderFeedCandidatesRoute();

  expect(screen.getByRole("heading", { name: "CJ feed candidates" })).toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent("Feed candidates unavailable.");
  expect(mockedUseRoutePreloadedQuery).not.toHaveBeenCalled();
  expect(mockedUsePreloadedQuery).not.toHaveBeenCalled();
});

function renderFeedCandidatesRoute() {
  render(
    <MemoryRouter>
      <FeedCandidatesRoute />
    </MemoryRouter>
  );
}

function buildReadyLoaderData(
  pagination: Extract<FeedCandidatesLoaderData, { status: "ready" }>["pagination"] = {
    first: 20,
    after: null,
    reviewStatus: null,
    sort: "NAME_ASC"
  }
) {
  return {
    status: "ready",
    pagination,
    query: FEED_CANDIDATES_QUERY_DESCRIPTOR
  } satisfies FeedCandidatesLoaderData;
}

function buildFeedCandidatesData({
  candidates = [
    {
      id: "candidate-1",
      provider: "cj",
      providerFeedId: "feed-1",
      advertiserName: "Trail Merchant",
      advertiserCountry: "US",
      sourceFeedType: "PRODUCT",
      currency: "USD",
      language: "EN",
      feedName: "Trail Shopping",
      productCount: 5000,
      reviewStatus: "SHORTLISTED",
      reviewNote: "Prioritized for launch review.",
      reviewedAt: "2026-06-04T21:15:00.000000Z",
      providerLastUpdatedAt: "2026-06-04T20:00:00.000000Z",
      lastSeenAt: "2026-06-04T21:00:00.000000Z"
    },
    {
      id: "candidate-2",
      provider: "cj",
      providerFeedId: "feed-2",
      advertiserName: "City Gear",
      advertiserCountry: "CA",
      sourceFeedType: null,
      currency: "CAD",
      language: "EN",
      feedName: "City Gear Catalog",
      productCount: 50,
      reviewStatus: "PENDING",
      reviewNote: null,
      reviewedAt: null,
      providerLastUpdatedAt: "2026-06-04T20:00:00.000000Z",
      lastSeenAt: "2026-06-04T21:00:00.000000Z"
    },
    {
      id: "candidate-3",
      provider: "cj",
      providerFeedId: "feed-3",
      advertiserName: "Outlet Deals",
      advertiserCountry: "US",
      sourceFeedType: "SHOPPING",
      currency: "USD",
      language: "EN",
      feedName: "Outlet Deals Feed",
      productCount: 1,
      reviewStatus: "DISMISSED",
      reviewNote: null,
      reviewedAt: null,
      providerLastUpdatedAt: "2026-06-04T20:00:00.000000Z",
      lastSeenAt: "2026-06-04T21:00:00.000000Z"
    }
  ],
  endCursor = "candidate-cursor-1",
  hasNextPage = false,
  hasPreviousPage = false,
  startCursor = candidates.length === 0 ? null : "candidate-cursor-0"
}: {
  candidates?: Array<{
    id: string;
    provider: string;
    providerFeedId: string;
    advertiserName: string | null;
    advertiserCountry: string | null;
    sourceFeedType: string | null;
    currency: string | null;
    language: string | null;
    feedName: string | null;
    productCount: number | null;
    reviewStatus: "PENDING" | "SHORTLISTED" | "DISMISSED";
    reviewNote: string | null;
    reviewedAt: string | null;
    providerLastUpdatedAt: string | null;
    lastSeenAt: string;
  }>;
  endCursor?: string | null;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  startCursor?: string | null;
} = {}) {
  return {
    merchantFeedCandidates: {
      edges: candidates.map((candidate, index) => ({
        cursor: `candidate-cursor-${index + 1}`,
        node: candidate
      })),
      pageInfo: {
        hasNextPage,
        hasPreviousPage,
        startCursor,
        endCursor
      }
    }
  };
}
