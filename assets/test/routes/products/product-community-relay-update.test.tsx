import { Suspense } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { RelayEnvironmentProvider } from "react-relay";
import type { GraphQLResponse } from "relay-runtime";
import { createRelayEnvironment } from "../../../src/relay/environment";
import { ProductCommunityPanel } from "../../../src/routes/products/ProductCommunityPanel";
import { fetchGraphQL } from "../../../src/relay/fetch-graphql";

vi.mock("../../../src/relay/fetch-graphql", () => ({
  fetchGraphQL: vi.fn()
}));

const mockedFetchGraphQL = vi.mocked(fetchGraphQL);

beforeEach(() => {
  mockedFetchGraphQL.mockReset();
  mockedFetchGraphQL.mockImplementation((query) => {
    if (query.includes("mutation ProductCommunityItemsUpdateProductReviewMutation")) {
      return Promise.resolve(graphQLResponse({
        updateProductReview: {
          review: {
            id: "review-1",
            rating: 5,
            title: "Revised review",
            body: "Revised review body",
            moderationStatus: "PENDING"
          },
          errors: []
        }
      }));
    }

    if (query.includes("mutation ProductCommunityItemsUpdateProductQuestionMutation")) {
      return Promise.resolve(graphQLResponse({
        updateProductQuestion: {
          question: {
            id: "question-1",
            title: "Revised question",
            body: "Revised question body",
            moderationStatus: "PENDING"
          },
          errors: []
        }
      }));
    }

    if (query.includes("mutation ProductCommunityItemsUpdateProductAnswerMutation")) {
      return Promise.resolve(graphQLResponse({
        updateProductAnswer: {
          answer: {
            id: "answer-1",
            body: "Revised answer body",
            moderationStatus: "PENDING"
          },
          errors: []
        }
      }));
    }

    return Promise.resolve(graphQLResponse({
      product: {
        id: "product-1",
        reviewSummary: { count: 0, averageRating: null },
        reviews: {
          edges: [],
          pageInfo: { endCursor: null, hasNextPage: false }
        },
        questions: {
          edges: [],
          pageInfo: { endCursor: null, hasNextPage: false }
        },
        viewerCommunitySubmissions: {
          reviews: [{
            id: "review-1",
            rating: 2,
            title: "Original review",
            body: "Original review body",
            verifiedPurchase: false,
            authorLabel: "Community member",
            moderationStatus: "HIDDEN",
            viewerCanEdit: true,
            viewerCanRemove: true
          }],
          questions: [{
            id: "question-1",
            title: "Original question",
            body: "Original question body",
            authorLabel: "Community member",
            moderationStatus: "REJECTED",
            viewerCanEdit: true,
            viewerCanRemove: true
          }],
          answers: [{
            id: "answer-1",
            body: "Original answer body",
            authorLabel: "Community member",
            moderationStatus: "REJECTED",
            viewerCanEdit: true,
            viewerCanRemove: true
          }]
        }
      }
    }));
  });
});

test("owner resubmissions render the fields returned by Relay update mutations", async () => {
  const environment = createRelayEnvironment();

  render(
    <RelayEnvironmentProvider environment={environment}>
      <Suspense fallback={<p>Loading community content…</p>}>
        <ProductCommunityPanel productId="product-1" productSlug="field-camera" />
      </Suspense>
    </RelayEnvironmentProvider>
  );

  const ownerSection = await screen.findByRole("region", {
    name: "Your non-public community submissions"
  });

  fireEvent.click(within(ownerSection).getByRole("button", { name: "Edit review" }));
  fireEvent.change(within(ownerSection).getByLabelText("Edit review rating"), {
    target: { value: "5" }
  });
  fireEvent.change(within(ownerSection).getByLabelText("Edit review title"), {
    target: { value: "Revised review" }
  });
  fireEvent.change(within(ownerSection).getByLabelText("Edit review body"), {
    target: { value: "Revised review body" }
  });
  fireEvent.click(within(ownerSection).getByRole("button", { name: "Save review" }));

  const review = await within(ownerSection).findByRole("article", {
    name: "Review: Revised review"
  });
  expect(within(review).getByText("Revised review body")).toBeVisible();
  expect(within(review).getByText("★★★★★")).toBeVisible();

  fireEvent.click(within(ownerSection).getByRole("button", { name: "Edit question" }));
  fireEvent.change(within(ownerSection).getByLabelText("Edit question title"), {
    target: { value: "Revised question" }
  });
  fireEvent.change(within(ownerSection).getByLabelText("Edit question body"), {
    target: { value: "Revised question body" }
  });
  fireEvent.click(within(ownerSection).getByRole("button", { name: "Save question" }));

  const question = await within(ownerSection).findByRole("article", {
    name: "Question: Revised question"
  });
  expect(within(question).getByText("Revised question body")).toBeVisible();

  fireEvent.click(within(ownerSection).getByRole("button", { name: "Edit answer" }));
  fireEvent.change(within(ownerSection).getByLabelText("Edit answer body"), {
    target: { value: "Revised answer body" }
  });
  fireEvent.click(within(ownerSection).getByRole("button", { name: "Save answer" }));

  expect(await within(ownerSection).findByText("Revised answer body")).toBeVisible();
});

function graphQLResponse(data: Record<string, unknown>): GraphQLResponse {
  return { data };
}
