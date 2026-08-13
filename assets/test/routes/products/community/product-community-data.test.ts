import {
  acceptedAnswerAuthorLabel,
  appendUniqueCommunityItems,
  buildProductAnswerInput,
  buildProductQuestionInput,
  buildProductReviewInput,
  nextCommunityPageCursor,
  publishedReviewRowDisplayData,
  publishedReviewSummary,
  resolveCommunityContentRemovalMessage,
  resolveProductAnswerMutationMessage,
  resolveProductAnswerUpdateMessage,
  resolveProductQuestionMutationMessage,
  resolveProductQuestionUpdateMessage,
  resolveProductReviewMutationMessage,
  resolveProductReviewUpdateMessage,
} from "../../../../src/routes/products/community/product-community-data";

const mutationError = {
  code: "INVALID_ARGUMENT",
  field: "body",
  message: "Authored text is invalid.",
} as const;

const graphQLError = { message: "Private GraphQL failure" } as const;
const rateLimitError = {
  code: "RATE_LIMITED",
  field: null,
  message: "Community write limit reached; try again later.",
} as const;
const createdReview = { id: "review-1", moderationStatus: "PENDING" } as const;
const createdQuestion = { id: "question-1", moderationStatus: "PENDING" } as const;
const createdAnswer = { id: "answer-1", moderationStatus: "PENDING" } as const;
const updatedReview = {
  body: null,
  id: "review-1",
  moderationStatus: "PENDING",
  rating: 4,
  title: null,
} as const;
const updatedQuestion = {
  body: null,
  id: "question-1",
  moderationStatus: "PENDING",
  title: "Question",
} as const;
const updatedAnswer = {
  body: "Answer",
  id: "answer-1",
  moderationStatus: "PENDING",
} as const;

test("community inputs trim required and optional authored text", () => {
  expect(
    buildProductReviewInput({
      body: "  Useful in rain.  ",
      idempotencyKey: "review-attempt-1",
      productId: "product-1",
      rating: "4",
      title: "  Field notes  ",
    }),
  ).toEqual({
    body: "Useful in rain.",
    idempotencyKey: "review-attempt-1",
    productId: "product-1",
    rating: 4,
    title: "Field notes",
  });

  expect(
    buildProductReviewInput({
      body: " ",
      idempotencyKey: "review-attempt-2",
      productId: "product-1",
      rating: 1,
      title: " ",
    }),
  ).toEqual({ idempotencyKey: "review-attempt-2", productId: "product-1", rating: 1 });

  expect(
    buildProductQuestionInput({
      body: "  Can it handle rain?  ",
      idempotencyKey: "question-attempt-1",
      productId: "product-1",
      title: "  Weather sealed?  ",
    }),
  ).toEqual({
    body: "Can it handle rain?",
    idempotencyKey: "question-attempt-1",
    productId: "product-1",
    title: "Weather sealed?",
  });
  expect(
    buildProductAnswerInput({
      body: "  Yes.  ",
      idempotencyKey: "answer-attempt-1",
      questionId: "question-1",
    }),
  ).toEqual({
    body: "Yes.",
    idempotencyKey: "answer-attempt-1",
    questionId: "question-1",
  });
});

test("community inputs omit blank optional bodies without hiding required fields", () => {
  expect(
    buildProductQuestionInput({
      body: " ",
      idempotencyKey: "question-attempt-2",
      productId: "product-1",
      title: "  Battery life?  ",
    }),
  ).toEqual({
    idempotencyKey: "question-attempt-2",
    productId: "product-1",
    title: "Battery life?",
  });
  expect(
    buildProductAnswerInput({
      body: " ",
      idempotencyKey: "answer-attempt-2",
      questionId: "question-1",
    }),
  ).toEqual({
    body: "",
    idempotencyKey: "answer-attempt-2",
    questionId: "question-1",
  });
});

test("publishedReviewSummary preserves empty, singular, and plural copy", () => {
  expect(publishedReviewSummary({ averageRating: "0.00", count: 0 })).toBe(
    "No published reviews yet.",
  );
  expect(publishedReviewSummary({ averageRating: "4.00", count: 1 })).toBe(
    "4.00 out of 5 from 1 published review.",
  );
  expect(publishedReviewSummary({ averageRating: "4.50", count: 2 })).toBe(
    "4.50 out of 5 from 2 published reviews.",
  );
});

test("publishedReviewRowDisplayData projects explicit and fallback titles with purchase verification copy", () => {
  const explicitTitleReview = Object.freeze({
    authorLabel: "Community member",
    rating: 4,
    title: "Useful outdoors",
    verifiedPurchase: true,
  });
  const fallbackTitleReview = Object.freeze({
    authorLabel: "Guest reviewer",
    rating: 2,
    title: null,
    verifiedPurchase: false,
  });

  expect(publishedReviewRowDisplayData(explicitTitleReview)).toEqual({
    authorCopy: "Community member · Verified purchase",
    ratingStars: "★★★★☆",
    title: "Useful outdoors",
  });
  expect(publishedReviewRowDisplayData(fallbackTitleReview)).toEqual({
    authorCopy: "Guest reviewer · Purchase not verified",
    ratingStars: "★★☆☆☆",
    title: "2 out of 5",
  });
  expect(explicitTitleReview).toEqual({
    authorLabel: "Community member",
    rating: 4,
    title: "Useful outdoors",
    verifiedPurchase: true,
  });
  expect(fallbackTitleReview).toEqual({
    authorLabel: "Guest reviewer",
    rating: 2,
    title: null,
    verifiedPurchase: false,
  });
});

test.each([
  [1, "★☆☆☆☆"],
  [2, "★★☆☆☆"],
  [3, "★★★☆☆"],
  [4, "★★★★☆"],
  [5, "★★★★★"],
])("publishedReviewRowDisplayData renders %i-star ratings", (rating, ratingStars) => {
  expect(
    publishedReviewRowDisplayData({
      authorLabel: "Community member",
      rating,
      title: "Rated review",
      verifiedPurchase: true,
    }).ratingStars,
  ).toBe(ratingStars);
});

test.each([
  [-1, "☆☆☆☆☆", "0 out of 5"],
  [2.6, "★★★☆☆", "3 out of 5"],
  [8, "★★★★★", "5 out of 5"],
  [Number.NaN, "☆☆☆☆☆", "0 out of 5"],
  [Number.POSITIVE_INFINITY, "★★★★★", "5 out of 5"],
  [Number.NEGATIVE_INFINITY, "☆☆☆☆☆", "0 out of 5"],
])(
  "publishedReviewRowDisplayData safely normalizes an invalid rating of %s",
  (rating, ratingStars, fallbackTitle) => {
    expect(
      publishedReviewRowDisplayData({
        authorLabel: "Community member",
        rating,
        title: null,
        verifiedPurchase: false,
      }),
    ).toMatchObject({ ratingStars, title: fallbackTitle });
  },
);

test("owner updates distinguish terminal success from typed payload failure", () => {
  expect(resolveProductReviewUpdateMessage({ errors: [], review: updatedReview }, [])).toBe(
    "Review updated and submitted for review.",
  );
  expect(resolveProductReviewUpdateMessage({ errors: [rateLimitError], review: null }, [])).toBe(
    rateLimitError.message,
  );
  expect(resolveProductQuestionUpdateMessage({ errors: [], question: updatedQuestion }, [])).toBe(
    "Question updated and submitted for review.",
  );
  expect(
    resolveProductQuestionUpdateMessage({ errors: [rateLimitError], question: null }, []),
  ).toBe(rateLimitError.message);
  expect(resolveProductAnswerUpdateMessage({ answer: updatedAnswer, errors: [] }, [])).toBe(
    "Answer updated and submitted for review.",
  );
  expect(resolveProductAnswerUpdateMessage({ answer: null, errors: [rateLimitError] }, [])).toBe(
    rateLimitError.message,
  );
});

test("community removal reports retained removal and typed lifecycle errors", () => {
  expect(
    resolveCommunityContentRemovalMessage({ removedContentId: "review-1", errors: [] }, []),
  ).toBe("Community content removed.");
  expect(
    resolveCommunityContentRemovalMessage(
      {
        removedContentId: null,
        errors: [
          {
            code: "INVALID_LIFECYCLE",
            field: null,
            message: "Removed community content cannot be changed.",
          },
        ],
      },
      [],
    ),
  ).toBe("Removed community content cannot be changed.");
});

test("acceptedAnswerAuthorLabel marks only the accepted answer", () => {
  expect(acceptedAnswerAuthorLabel("answer-1", "answer-1", "Community member")).toBe(
    "Accepted answer · Community member",
  );
  expect(acceptedAnswerAuthorLabel("answer-2", "answer-1", "Community member")).toBe(
    "Community member",
  );
  expect(acceptedAnswerAuthorLabel("answer-2", null, "Community member")).toBe("Community member");
});

test("nextCommunityPageCursor requires a nonblank advancing cursor", () => {
  expect(nextCommunityPageCursor({ endCursor: "cursor-1", hasNextPage: true })).toBe("cursor-1");
  expect(nextCommunityPageCursor({ endCursor: null, hasNextPage: true })).toBeNull();
  expect(nextCommunityPageCursor({ endCursor: " ", hasNextPage: true })).toBeNull();
  expect(nextCommunityPageCursor({ endCursor: "cursor-1", hasNextPage: false })).toBeNull();
  expect(
    nextCommunityPageCursor({ endCursor: "cursor-1", hasNextPage: true }, "cursor-1"),
  ).toBeNull();
});

test("appendUniqueCommunityItems keeps first occurrences and stable references", () => {
  const existing = [{ id: "first", value: "Existing" }];

  expect(
    appendUniqueCommunityItems(existing, [
      { id: "first", value: "Duplicate" },
      { id: "second", value: "Second" },
      { id: "second", value: "Duplicate second" },
      { id: "third", value: "Third" },
    ]),
  ).toEqual([
    { id: "first", value: "Existing" },
    { id: "second", value: "Second" },
    { id: "third", value: "Third" },
  ]);
  expect(appendUniqueCommunityItems(existing, [])).toBe(existing);
  expect(appendUniqueCommunityItems(existing, [{ id: "first", value: "Duplicate" }])).toBe(
    existing,
  );
});

test("community create completions use generated payload facts and shared errors", () => {
  expect(resolveProductReviewMutationMessage({ errors: [], review: createdReview }, [])).toBe(
    "Review submitted for review.",
  );
  expect(resolveProductQuestionMutationMessage({ errors: [], question: createdQuestion }, [])).toBe(
    "Question submitted for review.",
  );
  expect(resolveProductAnswerMutationMessage({ answer: createdAnswer, errors: [] }, [])).toBe(
    "Answer submitted for review.",
  );

  expect(resolveProductReviewMutationMessage({ errors: [mutationError], review: null }, [])).toBe(
    mutationError.message,
  );
  expect(
    resolveProductQuestionMutationMessage({ errors: [mutationError], question: null }, []),
  ).toBe(mutationError.message);
  expect(resolveProductAnswerMutationMessage({ answer: null, errors: [mutationError] }, [])).toBe(
    mutationError.message,
  );
});

test("community create completions reject partial data with top-level GraphQL errors", () => {
  const message = "Request failed. Please try again.";

  expect(
    resolveProductReviewMutationMessage({ errors: [], review: createdReview }, [graphQLError]),
  ).toBe(message);
  expect(
    resolveProductQuestionMutationMessage({ errors: [], question: createdQuestion }, [
      graphQLError,
    ]),
  ).toBe(message);
  expect(
    resolveProductAnswerMutationMessage({ answer: createdAnswer, errors: [] }, [graphQLError]),
  ).toBe(message);
});

test("community create completions handle absent payloads", () => {
  expect(resolveProductReviewMutationMessage(undefined, [])).toBe(
    "Request failed. Please try again.",
  );
  expect(resolveProductQuestionMutationMessage(null, [])).toBe("Request failed. Please try again.");
  expect(resolveProductAnswerMutationMessage(undefined, [])).toBe(
    "Request failed. Please try again.",
  );
});
