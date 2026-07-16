import type { ReviewMerchantFeedCandidateInput } from "../../../../src/__generated__/ReviewMerchantFeedCandidateMutation.graphql";
import {
  buildFeedCandidateReviewMutationInput,
  omitReviewNoteDraft
} from "../../../../src/routes/ingestion/feed-candidates/feed-candidate-review-mutation-data";

const CANDIDATE = {
  id: "candidate-1",
  reviewNote: "Persisted review note"
};

test("returns the generated Relay mutation input contract", () => {
  expectTypeOf(
    buildFeedCandidateReviewMutationInput(CANDIDATE, "SHORTLISTED", {})
  ).toEqualTypeOf<ReviewMerchantFeedCandidateInput>();
});

test("builds a trimmed input from an explicit nonblank draft", () => {
  const input = buildFeedCandidateReviewMutationInput(
    CANDIDATE,
    "SHORTLISTED",
    { "candidate-1": "  Draft review note  " }
  );

  expect(input).toEqual({
    id: "candidate-1",
    status: "SHORTLISTED",
    note: "Draft review note"
  });
});

test("includes an explicit blank draft so a persisted note is cleared", () => {
  const input = buildFeedCandidateReviewMutationInput(
    CANDIDATE,
    "DISMISSED",
    { "candidate-1": "" }
  );

  expect(input).toEqual({
    id: "candidate-1",
    status: "DISMISSED",
    note: ""
  });
});

test("includes a whitespace-only draft as a blank note", () => {
  const input = buildFeedCandidateReviewMutationInput(
    CANDIDATE,
    "PENDING",
    { "candidate-1": "   " }
  );

  expect(input).toEqual({
    id: "candidate-1",
    status: "PENDING",
    note: ""
  });
});

test("uses a trimmed persisted note when no draft exists", () => {
  const input = buildFeedCandidateReviewMutationInput(
    { id: "candidate-1", reviewNote: "  Persisted review note  " },
    "SHORTLISTED",
    {}
  );

  expect(input).toEqual({
    id: "candidate-1",
    status: "SHORTLISTED",
    note: "Persisted review note"
  });
});

test.each([
  ["whitespace-only", "   "],
  ["empty", ""],
  ["nullish", null]
])("omits a %s persisted note when no draft exists", (_description, reviewNote) => {
  const input = buildFeedCandidateReviewMutationInput(
    { id: "candidate-1", reviewNote },
    "PENDING",
    {}
  );

  expect(input).toEqual({
    id: "candidate-1",
    status: "PENDING"
  });
  expect(input).not.toHaveProperty("note");
});

test("ignores an inherited draft and uses the persisted note", () => {
  const reviewNotes = Object.create({ "candidate-1": "Inherited draft" }) as Record<
    string,
    string
  >;
  const input = buildFeedCandidateReviewMutationInput(CANDIDATE, "SHORTLISTED", reviewNotes);

  expect(input).toEqual({
    id: "candidate-1",
    status: "SHORTLISTED",
    note: "Persisted review note"
  });
});

test.each([
  ["first", "candidate-1"],
  ["middle", "candidate-2"],
  ["last", "candidate-3"]
])("removes the %s draft without changing source order or source data", (_position, candidateId) => {
  const reviewNotes = {
    "candidate-1": "First",
    "candidate-2": "Middle",
    "candidate-3": "Last"
  };
  const result = omitReviewNoteDraft(reviewNotes, candidateId);

  expect(Object.entries(result)).toEqual(
    Object.entries(reviewNotes).filter(([id]) => id !== candidateId)
  );
  expect(result).not.toBe(reviewNotes);
  expect(reviewNotes).toEqual({
    "candidate-1": "First",
    "candidate-2": "Middle",
    "candidate-3": "Last"
  });
});

test("returns an ordered new object when the successful review has no draft", () => {
  const reviewNotes = {
    "candidate-1": "First",
    "candidate-2": "Second"
  };
  const result = omitReviewNoteDraft(reviewNotes, "candidate-3");

  expect(result).toEqual(reviewNotes);
  expect(Object.keys(result)).toEqual(["candidate-1", "candidate-2"]);
  expect(result).not.toBe(reviewNotes);
  expect(reviewNotes).toEqual({
    "candidate-1": "First",
    "candidate-2": "Second"
  });
});
