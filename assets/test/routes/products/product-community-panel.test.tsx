import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useLazyLoadQuery, useMutation } from "react-relay";
import { ProductCommunityPanel } from "../../../src/routes/products/ProductCommunityPanel";
import submitProductReviewMutation from "../../../src/routes/products/queries/SubmitProductReviewMutation";

const { answerMock, askMock, reviewMock, useLazyLoadQueryMock, useMutationMock } = vi.hoisted(() => ({
  answerMock: vi.fn(),
  askMock: vi.fn(),
  reviewMock: vi.fn(),
  useLazyLoadQueryMock: vi.fn(),
  useMutationMock: vi.fn()
}));

vi.mock("react-relay", async () => {
  const actual = await vi.importActual<typeof import("react-relay")>("react-relay");
  return { ...actual, useLazyLoadQuery: useLazyLoadQueryMock, useMutation: useMutationMock };
});

const mockedUseLazyLoadQuery = vi.mocked(useLazyLoadQuery);
const mockedUseMutation = vi.mocked(useMutation);

beforeEach(() => {
  answerMock.mockReset();
  askMock.mockReset();
  reviewMock.mockReset();
  useLazyLoadQueryMock.mockReset();
  useMutationMock.mockReset();
  mockedUseLazyLoadQuery.mockReturnValue({
    product: {
      id: "product-1",
      reviewSummary: { count: 1, averageRating: "4.00" },
      reviews: {
        edges: [{ node: productReview }],
        pageInfo: { endCursor: null, hasNextPage: false }
      },
      questions: {
        edges: [{ node: productQuestion }],
        pageInfo: { endCursor: null, hasNextPage: false }
      }
    }
  } as never);
  mockedUseMutation.mockImplementation((mutation) =>
    (mutation === submitProductReviewMutation
      ? [reviewMock, false]
      : useMutationMock.mock.calls.length === 2
        ? [askMock, false]
        : [answerMock, false]) as never
  );
});

const productReview = {
  id: "review-1",
  rating: 4,
  title: "Useful outdoors",
  body: "<img src=x onerror=alert(1)> held up in rain.",
  verifiedPurchase: false,
  authorLabel: "Community member"
};

const productQuestion = {
  id: "question-1",
  title: "Weather sealed?",
  body: "Can it handle rain?",
  authorLabel: "Community member",
  acceptedAnswerId: "answer-1",
  answers: {
    edges: [{
      node: {
        id: "answer-1",
        body: "Yes, with the port cover closed.",
        authorLabel: "Community member"
      }
    }],
    pageInfo: { endCursor: null, hasNextPage: false }
  }
};

test("ProductCommunityPanel shows published trust signals and renders authored text without HTML injection", () => {
  const { container } = render(
    <ProductCommunityPanel productId="product-1" productSlug="field-camera" />
  );
  expect(screen.getByText(/4.00 out of 5 from 1 published review/)).toBeVisible();
  expect(screen.getByText("Purchase not verified", { exact: false })).toBeVisible();
  expect(screen.getByText("<img src=x onerror=alert(1)> held up in rain.")).toBeVisible();
  expect(container.querySelector("img")).toBeNull();
  expect(screen.getByText("Accepted answer", { exact: false })).toBeVisible();
});

test("ProductCommunityPanel submits an authenticated review into moderation", async () => {
  render(<ProductCommunityPanel productId="product-1" productSlug="field-camera" />);
  fireEvent.click(screen.getByText("Write a review"));
  fireEvent.change(screen.getByLabelText("Rating"), { target: { value: "3" } });
  fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Balanced" } });
  fireEvent.change(screen.getByLabelText("Review"), { target: { value: "Good, with caveats." } });
  fireEvent.click(screen.getByRole("button", { name: "Submit review" }));
  await waitFor(() => expect(reviewMock).toHaveBeenCalledWith(expect.objectContaining({ variables: { input: { productId: "product-1", rating: 3, title: "Balanced", body: "Good, with caveats." } } })));
  await act(async () => reviewMock.mock.calls[0]?.[0]?.onCompleted({ submitProductReview: { review: { id: "review-2", moderationStatus: "PENDING" }, errors: [] } }, []));
  expect(await screen.findByRole("status")).toHaveTextContent("submitted for moderation");
});
