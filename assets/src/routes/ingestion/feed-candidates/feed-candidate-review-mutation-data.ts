export type FeedCandidateReviewStatus = "PENDING" | "SHORTLISTED" | "DISMISSED";

export type FeedCandidateReviewMutationInput = {
  id: string;
  status: FeedCandidateReviewStatus;
  note?: string;
};

type FeedCandidateReviewNoteSource = {
  id: string;
  reviewNote?: string | null;
};

export function buildFeedCandidateReviewMutationInput(
  candidate: FeedCandidateReviewNoteSource,
  status: FeedCandidateReviewStatus,
  reviewNotes: Readonly<Record<string, string>>
): FeedCandidateReviewMutationInput {
  const hasDraftNote = Object.prototype.hasOwnProperty.call(reviewNotes, candidate.id);
  const note = (hasDraftNote ? reviewNotes[candidate.id] : candidate.reviewNote ?? "").trim();

  return hasDraftNote || note.length > 0
    ? {
        id: candidate.id,
        status,
        note
      }
    : {
        id: candidate.id,
        status
      };
}

export function omitReviewNoteDraft(
  reviewNotes: Readonly<Record<string, string>>,
  candidateId: string
): Record<string, string> {
  return Object.fromEntries(Object.entries(reviewNotes).filter(([id]) => id !== candidateId));
}
