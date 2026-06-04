import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, useLoaderData } from "react-router-dom";
import { usePreloadedQuery } from "react-relay";
import { useRoutePreloadedQuery } from "../../../../relay/route-preload";
import { FeedCandidatesRoute } from "../index";
import type { FeedCandidatesLoaderData } from "../loader";

const {
  useLoaderDataMock,
  usePreloadedQueryMock,
  useRoutePreloadedQueryMock
} = vi.hoisted(() => ({
  useLoaderDataMock: vi.fn(),
  usePreloadedQueryMock: vi.fn(),
  useRoutePreloadedQueryMock: vi.fn()
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");

  return {
    ...actual,
    useLoaderData: useLoaderDataMock
  };
});

vi.mock("react-relay", async () => {
  const actual = await vi.importActual<typeof import("react-relay")>("react-relay");

  return {
    ...actual,
    usePreloadedQuery: usePreloadedQueryMock
  };
});

vi.mock("../../../../relay/route-preload", async () => {
  const actual = await vi.importActual<typeof import("../../../../relay/route-preload")>(
    "../../../../relay/route-preload"
  );

  return {
    ...actual,
    useRoutePreloadedQuery: useRoutePreloadedQueryMock
  };
});

const mockedUseLoaderData = vi.mocked(useLoaderData);
const mockedUsePreloadedQuery = vi.mocked(usePreloadedQuery);
const mockedUseRoutePreloadedQuery = vi.mocked(useRoutePreloadedQuery);

const FEED_CANDIDATES_QUERY_DESCRIPTOR = {
  __relayQuery: {
    operationName: "MerchantFeedCandidatesRouteQuery",
    text: "query MerchantFeedCandidatesRouteQuery($first: Int, $after: String) { merchantFeedCandidates(first: $first, after: $after) { edges { node { id } } } }",
    variables: {
      first: 20,
      after: null
    }
  }
};

const FEED_CANDIDATES_QUERY_REF = {
  dispose: vi.fn(),
  variables: FEED_CANDIDATES_QUERY_DESCRIPTOR.__relayQuery.variables
};

beforeEach(() => {
  useLoaderDataMock.mockReset();
  usePreloadedQueryMock.mockReset();
  useRoutePreloadedQueryMock.mockReset();
  FEED_CANDIDATES_QUERY_REF.dispose.mockReset();
  mockedUseLoaderData.mockReturnValue(buildReadyLoaderData());
  mockedUseRoutePreloadedQuery.mockReturnValue(FEED_CANDIDATES_QUERY_REF as never);
  mockedUsePreloadedQuery.mockReturnValue(buildFeedCandidatesData());
});

test("feed candidates route renders review-safe candidate rows", () => {
  renderFeedCandidatesRoute();

  expect(screen.getByRole("heading", { name: "CJ feed candidates" })).toBeInTheDocument();
  const candidateList = screen.getByRole("list", { name: "CJ feed candidates" });

  expect(within(candidateList).getByText("Trail Merchant")).toBeInTheDocument();
  expect(within(candidateList).getByText("Trail Shopping")).toBeInTheDocument();
  expect(within(candidateList).getByText("10 products")).toBeInTheDocument();
  expect(within(candidateList).getByText("US")).toBeInTheDocument();
  expect(within(candidateList).getByText("USD")).toBeInTheDocument();
  expect(within(candidateList).getByText("EN")).toBeInTheDocument();
  expect(within(candidateList).queryByText(/tracking|account|token/i)).not.toBeInTheDocument();
  expect(mockedUseRoutePreloadedQuery).toHaveBeenCalledWith(
    expect.anything(),
    FEED_CANDIDATES_QUERY_DESCRIPTOR
  );
  expect(mockedUsePreloadedQuery).toHaveBeenCalledWith(
    expect.anything(),
    FEED_CANDIDATES_QUERY_REF
  );
});

test("feed candidates route renders an empty state", () => {
  mockedUsePreloadedQuery.mockReturnValue(buildFeedCandidatesData({ candidates: [] }));

  renderFeedCandidatesRoute();

  expect(screen.getByRole("heading", { name: "CJ feed candidates" })).toBeInTheDocument();
  expect(screen.getByText("No CJ feed candidates captured yet.")).toBeInTheDocument();
});

test("feed candidates route renders pagination links", () => {
  mockedUseLoaderData.mockReturnValue(
    buildReadyLoaderData({
      first: 30,
      after: "previous-cursor"
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

  expect(screen.getByRole("link", { name: "First candidates" })).toHaveAttribute(
    "href",
    "/ingestion/feed-candidates"
  );
  expect(screen.getByRole("link", { name: "Next candidates" })).toHaveAttribute(
    "href",
    "/ingestion/feed-candidates?first=30&after=next-cursor"
  );
});

test("feed candidates route renders the loader error state", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "error",
    pagination: {
      first: 20,
      after: null
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
    after: null
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
      sourceFeedType: "SHOPPING",
      currency: "USD",
      language: "EN",
      feedName: "Trail Shopping",
      productCount: 10,
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
