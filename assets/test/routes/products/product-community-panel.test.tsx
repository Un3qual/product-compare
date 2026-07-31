import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { useLazyLoadQuery, useMutation } from "react-relay";
import {
  removeCommunityContentMutation,
  updateProductAnswerMutation,
  updateProductQuestionMutation,
  updateProductReviewMutation
} from "../../../src/routes/products/ProductCommunityItems";
import {
  answerProductQuestionMutation,
  askProductQuestionMutation,
  ProductCommunityPanel,
  submitProductReviewMutation
} from "../../../src/routes/products/ProductCommunityPanel";
import { chooseSelectOption } from "../../helpers/radix-select";

const {
  answerMock,
  askMock,
  removeMock,
  reviewMock,
  updateAnswerMock,
  updateQuestionMock,
  updateReviewMock,
  useLazyLoadQueryMock,
  useMutationMock,
  uuidMock
} = vi.hoisted(() => ({
  answerMock: vi.fn(),
  askMock: vi.fn(),
  removeMock: vi.fn(),
  reviewMock: vi.fn(),
  updateAnswerMock: vi.fn(),
  updateQuestionMock: vi.fn(),
  updateReviewMock: vi.fn(),
  useLazyLoadQueryMock: vi.fn(),
  useMutationMock: vi.fn(),
  uuidMock: vi.fn()
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
  removeMock.mockReset();
  reviewMock.mockReset();
  updateAnswerMock.mockReset();
  updateQuestionMock.mockReset();
  updateReviewMock.mockReset();
  uuidMock.mockReset();
  uuidMock
    .mockReturnValueOnce("018f0f45-31f3-7af0-8bb9-2e606355f101")
    .mockReturnValueOnce("018f0f45-31f3-7af0-8bb9-2e606355f102")
    .mockReturnValue("018f0f45-31f3-7af0-8bb9-2e606355f103");
  vi.spyOn(globalThis.crypto, "randomUUID").mockImplementation(uuidMock);
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
      },
      viewerCommunitySubmissions: { answers: [], questions: [], reviews: [] }
    }
  } as never);
  mockedUseMutation.mockImplementation((mutation) => {
    if (mutation === submitProductReviewMutation) return [reviewMock, false] as never;
    if (mutation === askProductQuestionMutation) return [askMock, false] as never;
    if (mutation === answerProductQuestionMutation) return [answerMock, false] as never;
    if (mutation === updateProductReviewMutation) return [updateReviewMock, false] as never;
    if (mutation === updateProductQuestionMutation) return [updateQuestionMock, false] as never;
    if (mutation === updateProductAnswerMutation) return [updateAnswerMock, false] as never;
    if (mutation === removeCommunityContentMutation) return [removeMock, false] as never;
    throw new Error("Unexpected community mutation");
  });
});

const productReview = {
  id: "review-1",
  rating: 4,
  title: "Useful outdoors",
  body: "<img src=x onerror=alert(1)> held up in rain.",
  verifiedPurchase: false,
  authorLabel: "Community member",
  viewerCanEdit: true,
  viewerCanRemove: true
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
        authorLabel: "Community member",
        viewerCanEdit: true,
        viewerCanRemove: true
      }
    }],
    pageInfo: { endCursor: null, hasNextPage: false }
  },
  viewerCanEdit: true,
  viewerCanRemove: true
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

test("ProductCommunityPanel reuses a create key after transport failure and replaces it after a terminal payload", async () => {
  render(<ProductCommunityPanel productId="product-1" productSlug="field-camera" />);
  fireEvent.click(screen.getByText("Write a review"));
  chooseSelectOption(screen.getByLabelText("Rating"), "3");
  fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Balanced" } });
  fireEvent.change(screen.getByLabelText("Review"), { target: { value: "Good, with caveats." } });
  fireEvent.click(screen.getByRole("button", { name: "Submit review" }));
  const firstInput = {
    body: "Good, with caveats.",
    idempotencyKey: "018f0f45-31f3-7af0-8bb9-2e606355f101",
    productId: "product-1",
    rating: 3,
    title: "Balanced"
  };
  await waitFor(() => expect(reviewMock).toHaveBeenCalledWith(expect.objectContaining({ variables: { input: firstInput } })));
  await act(() => reviewMock.mock.calls[0]?.[0]?.onError(new Error("connection dropped")));
  fireEvent.click(screen.getByRole("button", { name: "Submit review" }));
  await waitFor(() => expect(reviewMock).toHaveBeenNthCalledWith(2, expect.objectContaining({ variables: { input: firstInput } })));
  await act(() => reviewMock.mock.calls[1]?.[0]?.onCompleted({ submitProductReview: { review: { id: "review-2", moderationStatus: "PENDING" }, errors: [] } }, []));
  expect(await screen.findByRole("status")).toHaveTextContent("submitted for moderation");
  fireEvent.click(screen.getByRole("button", { name: "Submit review" }));
  await waitFor(() => expect(reviewMock).toHaveBeenNthCalledWith(3, expect.objectContaining({ variables: { input: { ...firstInput, idempotencyKey: "018f0f45-31f3-7af0-8bb9-2e606355f102" } } })));
});

test("ProductCommunityPanel exposes owner-only edit and confirmed removal controls", async () => {
  render(<ProductCommunityPanel productId="product-1" productSlug="field-camera" />);

  expect(screen.getByRole("button", { name: "Edit review" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Edit question" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Edit answer" })).toBeVisible();

  fireEvent.click(screen.getByRole("button", { name: "Edit review" }));
  fireEvent.change(screen.getByLabelText("Edit review title"), { target: { value: "Revised field notes" } });
  fireEvent.click(screen.getByRole("button", { name: "Save review" }));
  await waitFor(() => expect(updateReviewMock).toHaveBeenCalledWith(expect.objectContaining({
    variables: { input: { id: "review-1", rating: 4, title: "Revised field notes", body: "<img src=x onerror=alert(1)> held up in rain." } }
  })));
  await act(() => updateReviewMock.mock.calls[0]?.[0]?.onCompleted({ updateProductReview: { review: { id: "review-1", moderationStatus: "PENDING" }, errors: [] } }, []));
  expect(await screen.findByText("Review updated and submitted for moderation.")).toBeVisible();
  expect(screen.queryByText("<img src=x onerror=alert(1)> held up in rain.")).toBeNull();
  expect(screen.queryByRole("button", { name: "Edit review" })).toBeNull();

  fireEvent.click(screen.getByRole("button", { name: "Remove question" }));
  expect(screen.getByText("Remove this question?")).toBeVisible();
  expect(screen.getByRole("group", { name: "Confirm removal of question" }).tagName).toBe("FIELDSET");
  fireEvent.click(screen.getByRole("button", { name: "Confirm remove question" }));
  await waitFor(() => expect(removeMock).toHaveBeenCalledWith(expect.objectContaining({
    variables: { input: { contentId: "question-1", contentType: "QUESTION" } }
  })));
});

test("ProductCommunityPanel hides owner controls without capabilities", () => {
  mockedUseLazyLoadQuery.mockReturnValue({
    product: {
      id: "product-1",
      reviewSummary: { count: 1, averageRating: "4.00" },
      reviews: { edges: [{ node: { ...productReview, viewerCanEdit: false, viewerCanRemove: false } }], pageInfo: { endCursor: null, hasNextPage: false } },
      questions: { edges: [{ node: { ...productQuestion, viewerCanEdit: false, viewerCanRemove: false, answers: { ...productQuestion.answers, edges: [{ node: { ...productQuestion.answers.edges[0].node, viewerCanEdit: false, viewerCanRemove: false } }] } } }], pageInfo: { endCursor: null, hasNextPage: false } },
      viewerCommunitySubmissions: { answers: [], questions: [], reviews: [] }
    }
  } as never);

  render(<ProductCommunityPanel productId="product-1" productSlug="field-camera" />);
  expect(screen.queryByRole("button", { name: /^Edit (review|question|answer)$/ })).toBeNull();
  expect(screen.queryByRole("button", { name: /^Remove (review|question|answer)$/ })).toBeNull();
});

test("ProductCommunityPanel gives owners a path to edit hidden and rejected submissions", () => {
  mockedUseLazyLoadQuery.mockReturnValue({
    product: {
      id: "product-1",
      reviewSummary: { count: 0, averageRating: null },
      reviews: { edges: [], pageInfo: { endCursor: null, hasNextPage: false } },
      questions: { edges: [], pageInfo: { endCursor: null, hasNextPage: false } },
      viewerCommunitySubmissions: {
        reviews: [{ ...productReview, moderationStatus: "HIDDEN" }],
        questions: [{ ...productQuestion, moderationStatus: "REJECTED" }],
        answers: [{ ...productQuestion.answers.edges[0].node, moderationStatus: "REJECTED" }]
      }
    }
  } as never);

  render(<ProductCommunityPanel productId="product-1" productSlug="field-camera" />);

  const ownerSection = screen.getByRole("region", { name: "Your non-public community submissions" });
  expect(within(ownerSection).getByRole("button", { name: "Edit review" })).toBeVisible();
  expect(within(ownerSection).getByRole("button", { name: "Edit question" })).toBeVisible();
  expect(within(ownerSection).getByRole("button", { name: "Edit answer" })).toBeVisible();
  expect(within(ownerSection).getByText("Hidden")).toBeVisible();
  expect(within(ownerSection).getAllByText("Rejected")).toHaveLength(2);
});

test("ProductCommunityPanel keeps lifecycle failures scoped to their content row", async () => {
  render(<ProductCommunityPanel productId="product-1" productSlug="field-camera" />);
  const reviewRow = screen.getByRole("article", { name: "Review: Useful outdoors" });
  const questionRow = screen.getByRole("article", { name: "Question: Weather sealed?" });

  fireEvent.click(within(reviewRow).getByRole("button", { name: "Edit review" }));
  fireEvent.click(within(reviewRow).getByRole("button", { name: "Save review" }));
  await act(() => updateReviewMock.mock.calls[0]?.[0]?.onCompleted({
    updateProductReview: {
      review: null,
      errors: [{ code: "RATE_LIMITED", message: "Community write limit reached; try again later." }]
    }
  }, []));

  expect(within(reviewRow).getByText("Community write limit reached; try again later.")).toBeVisible();
  expect(within(questionRow).queryByText("Community write limit reached; try again later.")).toBeNull();
  expect(within(questionRow).getByRole("button", { name: "Edit question" })).toBeEnabled();
});

test("ProductCommunityPanel removes review and question controls when a page repeats its cursor", async () => {
  mockedUseLazyLoadQuery.mockReturnValue({
    product: {
      id: "product-1",
      reviewSummary: { count: 1, averageRating: "4.00" },
      reviews: {
        edges: [{ node: productReview }],
        pageInfo: { endCursor: "review-cursor-1", hasNextPage: true }
      },
      questions: {
        edges: [{ node: productQuestion }],
        pageInfo: { endCursor: "question-cursor-1", hasNextPage: true }
      },
      viewerCommunitySubmissions: { answers: [], questions: [], reviews: [] }
    }
  } as never);
  render(<ProductCommunityPanel productId="product-1" productSlug="field-camera" />);

  fireEvent.click(screen.getByRole("button", { name: "Show more reviews" }));
  await waitFor(() => expect(screen.queryByRole("button", { name: "Show more reviews" })).toBeNull());
  expect(screen.getByRole("button", { name: "Show more questions" })).toBeVisible();

  fireEvent.click(screen.getByRole("button", { name: "Show more questions" }));
  await waitFor(() => expect(screen.queryByRole("button", { name: "Show more questions" })).toBeNull());
});

test("ProductCommunityPanel suppresses a blank initial answer cursor", () => {
  mockedUseLazyLoadQuery.mockReturnValue({
    product: {
      id: "product-1",
      reviewSummary: { count: 1, averageRating: "4.00" },
      reviews: { edges: [{ node: productReview }], pageInfo: { endCursor: null, hasNextPage: false } },
      questions: {
        edges: [{
          node: {
            ...productQuestion,
            answers: {
              ...productQuestion.answers,
              pageInfo: { endCursor: "   ", hasNextPage: true }
            }
          }
        }],
        pageInfo: { endCursor: null, hasNextPage: false }
      },
      viewerCommunitySubmissions: { answers: [], questions: [], reviews: [] }
    }
  } as never);

  render(<ProductCommunityPanel productId="product-1" productSlug="field-camera" />);
  expect(screen.queryByRole("button", { name: "Show more answers" })).toBeNull();
});
