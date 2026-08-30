import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useFragment, useLazyLoadQuery, useMutation, usePaginationFragment } from "react-relay";
import { communityQuestionAnswersFragment } from "../../../../src/routes/products/community/CommunityQuestionAnswers";
import {
  answerProductQuestionMutation,
  askProductQuestionMutation,
  productCommunityQuestionsFragment,
  productCommunityReviewsFragment,
  removeCommunityContentMutation,
  submitProductReviewMutation,
  updateProductAnswerMutation,
  updateProductQuestionMutation,
  updateProductReviewMutation,
} from "../../../../src/routes/products/community/ProductCommunityOperations";
import { ProductCommunityPanel } from "../../../../src/routes/products/community/ProductCommunityPanel";
import { chooseSelectOption } from "../../../helpers/base-select";

const {
  answerMock,
  askMock,
  removeMock,
  reviewMock,
  updateAnswerMock,
  updateQuestionMock,
  updateReviewMock,
  useFragmentMock,
  useLazyLoadQueryMock,
  useMutationMock,
  usePaginationFragmentMock,
  uuidMock,
} = vi.hoisted(() => ({
  answerMock: vi.fn(),
  askMock: vi.fn(),
  removeMock: vi.fn(),
  reviewMock: vi.fn(),
  updateAnswerMock: vi.fn(),
  updateQuestionMock: vi.fn(),
  updateReviewMock: vi.fn(),
  useFragmentMock: vi.fn(),
  useLazyLoadQueryMock: vi.fn(),
  useMutationMock: vi.fn(),
  usePaginationFragmentMock: vi.fn(),
  uuidMock: vi.fn(),
}));

vi.mock("react-relay", async () => {
  const actual = await vi.importActual<typeof import("react-relay")>("react-relay");
  return {
    ...actual,
    useFragment: useFragmentMock,
    useLazyLoadQuery: useLazyLoadQueryMock,
    useMutation: useMutationMock,
    usePaginationFragment: usePaginationFragmentMock,
  };
});

const mockedUseFragment = vi.mocked(useFragment);
const mockedUseLazyLoadQuery = vi.mocked(useLazyLoadQuery);
const mockedUseMutation = vi.mocked(useMutation);
const mockedUsePaginationFragment = vi.mocked(usePaginationFragment);

const productReview = {
  id: "review-1",
  rating: 4,
  title: "Useful outdoors",
  body: "<img src=x onerror=alert(1)> held up in rain.",
  verifiedPurchase: false,
  authorLabel: "Community member",
  viewerCanEdit: true,
  viewerCanRemove: true,
};

const productQuestion = {
  id: "question-1",
  title: "Weather sealed?",
  body: "Can it handle rain?",
  authorLabel: "Community member",
  acceptedAnswerId: "answer-1" as string | null,
  answers: {
    edges: [
      {
        node: {
          id: "answer-1",
          body: "Yes, with the port cover closed.",
          authorLabel: "Community member",
          viewerCanEdit: true,
          viewerCanRemove: true,
        },
      },
    ],
    pageInfo: { endCursor: null, hasNextPage: false },
  },
  viewerCanEdit: true,
  viewerCanRemove: true,
};

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
  mockedUseFragment.mockReset();
  mockedUseFragment.mockImplementation((_fragment, fragmentRef) => fragmentRef as never);
  useLazyLoadQueryMock.mockReset();
  useMutationMock.mockReset();
  usePaginationFragmentMock.mockReset();
  mockedUseLazyLoadQuery.mockReturnValue({
    product: {
      id: "product-1",
      reviewSummary: { count: 1, averageRating: "4.00" },
      reviews: {
        edges: [{ node: productReview }],
        pageInfo: { endCursor: null, hasNextPage: false },
      },
      questions: {
        edges: [{ node: productQuestion }],
        pageInfo: { endCursor: null, hasNextPage: false },
      },
      viewerCommunitySubmissions: { answers: [], questions: [], reviews: [] },
    },
  } as never);
  mockedUsePaginationFragment.mockImplementation((fragment, fragmentRef) => {
    if (
      fragment !== productCommunityReviewsFragment &&
      fragment !== productCommunityQuestionsFragment &&
      fragment !== communityQuestionAnswersFragment
    ) {
      throw new Error("Unexpected community pagination fragment");
    }

    return {
      data: fragmentRef,
      hasNext: false,
      isLoadingNext: false,
      loadNext: vi.fn(),
    } as never;
  });
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

test("ProductCommunityPanel shows published trust signals and renders authored text without HTML injection", () => {
  const { container } = render(
    <ProductCommunityPanel productId="product-1" productSlug="field-camera" />,
  );
  expect(screen.getByText(/4.00 out of 5 from 1 published review/)).toBeVisible();
  expect(screen.getByText("Purchase not verified", { exact: false })).toBeVisible();
  expect(screen.getByText("<img src=x onerror=alert(1)> held up in rain.")).toBeVisible();
  expect(container.querySelector("img")).toBeNull();
  expect(screen.getByText("Accepted answer", { exact: false })).toBeVisible();
});

test("ProductCommunityPanel explicitly associates every community form label with its control", () => {
  render(<ProductCommunityPanel productId="product-1" productSlug="field-camera" />);

  fireEvent.click(screen.getByRole("button", { name: "Edit review" }));
  fireEvent.click(screen.getByRole("button", { name: "Edit question" }));
  fireEvent.click(screen.getByRole("button", { name: "Edit answer" }));

  for (const label of [
    "Rating",
    "Title",
    "Review",
    "Question",
    "Details",
    "Answer",
    "Edit review rating",
    "Edit review title",
    "Edit review body",
    "Edit question title",
    "Edit question body",
    "Edit answer body",
  ]) {
    const control = screen.getByLabelText(label);
    const id = control.getAttribute("id");

    expect(id).toBeTruthy();
    expect(document.querySelector(`label[for="${id}"]`)).toHaveTextContent(label);
  }
});

test("ProductCommunityPanel exposes independent keyboard-accessible creation disclosures", async () => {
  const user = userEvent.setup();
  render(<ProductCommunityPanel productId="product-1" productSlug="field-camera" />);

  for (const [triggerName, fieldName, value] of [
    ["Write a review", "Review", "Useful review draft"],
    ["Ask a question", "Question", "Useful question draft"],
    ["Answer this question", "Answer", "Useful answer draft"],
  ] as const) {
    const trigger = screen.getByRole("button", { name: triggerName });
    const field = screen.getByLabelText(fieldName);

    expect(trigger).toHaveAttribute("data-slot", "collapsible-trigger");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(field).not.toBeVisible();

    trigger.focus();
    await user.keyboard("{Enter}");

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(trigger).toHaveFocus();
    expect(field).toBeVisible();

    fireEvent.change(field, { target: { value } });
    await user.keyboard(" ");

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(field).not.toBeVisible();
    expect(field).toHaveValue(value);

    fireEvent.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(field).toBeVisible();
    expect(field).toHaveValue(value);
  }
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
    title: "Balanced",
  };
  await waitFor(() =>
    expect(reviewMock).toHaveBeenCalledWith(
      expect.objectContaining({ variables: { input: firstInput } }),
    ),
  );
  await act(() => reviewMock.mock.calls[0]?.[0]?.onError(new Error("connection dropped")));
  fireEvent.click(screen.getByRole("button", { name: "Submit review" }));
  await waitFor(() =>
    expect(reviewMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ variables: { input: firstInput } }),
    ),
  );
  await act(() =>
    reviewMock.mock.calls[1]?.[0]?.onCompleted(
      {
        submitProductReview: {
          review: { id: "review-2", moderationStatus: "PENDING" },
          errors: [],
        },
      },
      [],
    ),
  );
  expect(await screen.findByRole("status")).toHaveTextContent("submitted for review");
  fireEvent.click(screen.getByRole("button", { name: "Submit review" }));
  await waitFor(() =>
    expect(reviewMock).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        variables: {
          input: { ...firstInput, idempotencyKey: "018f0f45-31f3-7af0-8bb9-2e606355f102" },
        },
      }),
    ),
  );
});

test("ProductCommunityPanel exposes owner-only edit and confirmed removal controls", async () => {
  render(<ProductCommunityPanel productId="product-1" productSlug="field-camera" />);

  expect(screen.getByRole("button", { name: "Edit review" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Edit question" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Edit answer" })).toBeVisible();

  fireEvent.click(screen.getByRole("button", { name: "Edit review" }));
  fireEvent.change(screen.getByLabelText("Edit review title"), {
    target: { value: "Revised field notes" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save review" }));
  await waitFor(() =>
    expect(updateReviewMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          input: {
            id: "review-1",
            rating: 4,
            title: "Revised field notes",
            body: "<img src=x onerror=alert(1)> held up in rain.",
          },
        },
      }),
    ),
  );
  await act(() =>
    updateReviewMock.mock.calls[0]?.[0]?.onCompleted(
      {
        updateProductReview: {
          review: { id: "review-1", moderationStatus: "PENDING" },
          errors: [],
        },
      },
      [],
    ),
  );
  expect(await screen.findByText("Review updated and submitted for review.")).toBeVisible();
  expect(screen.queryByText("<img src=x onerror=alert(1)> held up in rain.")).toBeNull();
  expect(screen.queryByRole("button", { name: "Edit review" })).toBeNull();

  fireEvent.click(screen.getByRole("button", { name: "Remove question" }));
  expect(screen.getByText("Remove this question?")).toBeVisible();
  expect(screen.getByRole("group", { name: "Confirm removal of question" }).tagName).toBe(
    "FIELDSET",
  );
  fireEvent.click(screen.getByRole("button", { name: "Confirm remove question" }));
  await waitFor(() =>
    expect(removeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: { input: { contentId: "question-1", contentType: "QUESTION" } },
      }),
    ),
  );
});

test("ProductCommunityPanel hides owner controls without capabilities", () => {
  mockedUseLazyLoadQuery.mockReturnValue({
    product: {
      id: "product-1",
      reviewSummary: { count: 1, averageRating: "4.00" },
      reviews: {
        edges: [{ node: { ...productReview, viewerCanEdit: false, viewerCanRemove: false } }],
        pageInfo: { endCursor: null, hasNextPage: false },
      },
      questions: {
        edges: [
          {
            node: {
              ...productQuestion,
              viewerCanEdit: false,
              viewerCanRemove: false,
              answers: {
                ...productQuestion.answers,
                edges: [
                  {
                    node: {
                      ...productQuestion.answers.edges[0].node,
                      viewerCanEdit: false,
                      viewerCanRemove: false,
                    },
                  },
                ],
              },
            },
          },
        ],
        pageInfo: { endCursor: null, hasNextPage: false },
      },
      viewerCommunitySubmissions: { answers: [], questions: [], reviews: [] },
    },
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
        answers: [{ ...productQuestion.answers.edges[0].node, moderationStatus: "REJECTED" }],
      },
    },
  } as never);

  render(<ProductCommunityPanel productId="product-1" productSlug="field-camera" />);

  const ownerSection = screen.getByRole("region", {
    name: "Your non-public community submissions",
  });
  expect(within(ownerSection).getByRole("button", { name: "Edit review" })).toBeVisible();
  expect(within(ownerSection).getByRole("button", { name: "Edit question" })).toBeVisible();
  expect(within(ownerSection).getByRole("button", { name: "Edit answer" })).toBeVisible();
  expect(within(ownerSection).getByText("Hidden from shoppers")).toBeVisible();
  expect(within(ownerSection).getAllByText("Changes requested")).toHaveLength(2);
  expect(
    within(ownerSection).queryByText(/HIDDEN|REJECTED|PENDING_REVIEW/),
  ).not.toBeInTheDocument();
});

test("ProductCommunityPanel keeps lifecycle failures scoped to their content row", async () => {
  render(<ProductCommunityPanel productId="product-1" productSlug="field-camera" />);
  const reviewRow = screen.getByRole("article", { name: "Review: Useful outdoors" });
  const questionRow = screen.getByRole("article", { name: "Question: Weather sealed?" });

  fireEvent.click(within(reviewRow).getByRole("button", { name: "Edit review" }));
  fireEvent.click(within(reviewRow).getByRole("button", { name: "Save review" }));
  await act(() =>
    updateReviewMock.mock.calls[0]?.[0]?.onCompleted(
      {
        updateProductReview: {
          review: null,
          errors: [
            { code: "RATE_LIMITED", message: "Community write limit reached; try again later." },
          ],
        },
      },
      [],
    ),
  );

  expect(
    within(reviewRow).getByText("Community write limit reached; try again later."),
  ).toBeVisible();
  expect(
    within(questionRow).queryByText("Community write limit reached; try again later."),
  ).toBeNull();
  expect(within(questionRow).getByRole("button", { name: "Edit question" })).toBeEnabled();
});

test("ProductCommunityPanel paginates reviews, questions, and answers independently", () => {
  const secondReview = {
    ...productReview,
    id: "review-2",
    title: "Useful on long trips",
  };
  const secondQuestion = {
    ...productQuestion,
    id: "question-2",
    title: "How long does the battery last?",
    acceptedAnswerId: null,
    answers: { edges: [], pageInfo: { endCursor: null, hasNextPage: false } },
  };
  const secondAnswer = {
    ...productQuestion.answers.edges[0].node,
    id: "answer-2",
    body: "It lasted a full day in the field.",
  };
  let reviewNodes = [productReview];
  let questionNodes = [productQuestion];
  let answerNodes = productQuestion.answers.edges.map(({ node }) => node);
  let reviewsLoading = false;
  let questionsLoading = false;
  let answersLoading = false;
  const loadReviews = vi.fn(() => {
    reviewNodes = [productReview, secondReview];
    reviewsLoading = true;
  });
  const loadQuestions = vi.fn(() => {
    questionNodes = [productQuestion, secondQuestion];
    questionsLoading = true;
  });
  const loadAnswers = vi.fn(() => {
    answerNodes = [...productQuestion.answers.edges.map(({ node }) => node), secondAnswer];
    answersLoading = true;
  });

  mockedUsePaginationFragment.mockImplementation((fragment, fragmentRef) => {
    if (fragment === productCommunityReviewsFragment) {
      return {
        data: {
          id: "product-1",
          reviews: { edges: reviewNodes.map((node) => ({ node })) },
        },
        hasNext: true,
        isLoadingNext: reviewsLoading,
        loadNext: loadReviews,
      } as never;
    }

    if (fragment === productCommunityQuestionsFragment) {
      return {
        data: {
          id: "product-1",
          questions: { edges: questionNodes.map((node) => ({ node })) },
        },
        hasNext: true,
        isLoadingNext: questionsLoading,
        loadNext: loadQuestions,
      } as never;
    }

    if (fragment === communityQuestionAnswersFragment && Object.is(fragmentRef, productQuestion)) {
      return {
        data: {
          ...productQuestion,
          answers: { edges: answerNodes.map((node) => ({ node })) },
        },
        hasNext: true,
        isLoadingNext: answersLoading,
        loadNext: loadAnswers,
      } as never;
    }

    return {
      data: fragmentRef,
      hasNext: false,
      isLoadingNext: false,
      loadNext: vi.fn(),
    } as never;
  });

  const view = render(<ProductCommunityPanel productId="product-1" productSlug="field-camera" />);

  fireEvent.click(screen.getByRole("button", { name: "Show more reviews" }));
  view.rerender(<ProductCommunityPanel productId="product-1" productSlug="field-camera" />);

  expect(screen.getByText("Useful outdoors")).toBeVisible();
  expect(screen.getByText("Useful on long trips")).toBeVisible();
  const loadingReviews = screen.getByRole("button", { name: /Loading more reviews/ });
  expect(loadingReviews).toBeDisabled();
  fireEvent.click(loadingReviews);
  expect(loadReviews).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("button", { name: "Show more questions" })).toBeEnabled();

  reviewsLoading = false;
  fireEvent.click(screen.getByRole("button", { name: "Show more questions" }));
  view.rerender(<ProductCommunityPanel productId="product-1" productSlug="field-camera" />);

  expect(screen.getByText("Weather sealed?")).toBeVisible();
  expect(screen.getByText("How long does the battery last?")).toBeVisible();
  expect(screen.getByRole("button", { name: /Loading more questions/ })).toBeDisabled();
  expect(loadQuestions).toHaveBeenCalledTimes(1);

  questionsLoading = false;
  fireEvent.click(screen.getByRole("button", { name: "Show more answers" }));
  view.rerender(<ProductCommunityPanel productId="product-1" productSlug="field-camera" />);

  expect(screen.getByText("Yes, with the port cover closed.")).toBeVisible();
  expect(screen.getByText("It lasted a full day in the field.")).toBeVisible();
  expect(screen.getByRole("button", { name: /Loading more answers/ })).toBeDisabled();
  expect(loadAnswers).toHaveBeenCalledTimes(1);
});

test("ProductCommunityPanel keeps a failed review page scoped to reviews", async () => {
  const loadReviews = vi.fn();

  mockedUsePaginationFragment.mockImplementation((fragment, fragmentRef) => {
    if (fragment === productCommunityReviewsFragment) {
      return {
        data: fragmentRef,
        hasNext: true,
        isLoadingNext: false,
        loadNext: loadReviews,
      } as never;
    }

    return {
      data: fragmentRef,
      hasNext: false,
      isLoadingNext: false,
      loadNext: vi.fn(),
    } as never;
  });

  render(<ProductCommunityPanel productId="product-1" productSlug="field-camera" />);
  fireEvent.click(screen.getByRole("button", { name: "Show more reviews" }));

  await act(() => loadReviews.mock.calls[0]?.[1]?.onComplete(new Error("review page failed")));

  expect(screen.getByRole("alert")).toHaveTextContent("More reviews unavailable.");
  expect(screen.getByRole("button", { name: "Retry reviews" })).toBeEnabled();
  expect(screen.getByText("Weather sealed?")).toBeVisible();
  expect(screen.queryByText("More questions unavailable.")).toBeNull();
  expect(screen.queryByText("More answers unavailable.")).toBeNull();
});
