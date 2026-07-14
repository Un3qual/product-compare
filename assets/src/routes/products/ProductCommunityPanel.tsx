import { Suspense, type FormEvent, useEffect, useId, useMemo, useState } from "react";
import { create, props } from "@stylexjs/stylex";
import { useLazyLoadQuery, useMutation } from "react-relay";
import type { ProductCommunityQuery } from "../../__generated__/ProductCommunityQuery.graphql";
import type { ProductQuestionAnswersQuery } from "../../__generated__/ProductQuestionAnswersQuery.graphql";
import type { SubmitProductReviewMutation } from "../../__generated__/SubmitProductReviewMutation.graphql";
import type { AskProductQuestionMutation } from "../../__generated__/AskProductQuestionMutation.graphql";
import type { AnswerProductQuestionMutation } from "../../__generated__/AnswerProductQuestionMutation.graphql";
import { ResettableErrorBoundary } from "../../relay/ResettableErrorBoundary";
import { Button } from "../../ui/primitives/Button";
import { commitRouteMutationPromise } from "../relay-mutations";
import { DEFAULT_ROUTE_ERROR_MESSAGE, routeMutationErrorMessage } from "../route-errors";
import answerProductQuestionMutation from "./queries/AnswerProductQuestionMutation";
import askProductQuestionMutation from "./queries/AskProductQuestionMutation";
import productCommunityQuery from "./queries/ProductCommunityQuery";
import productQuestionAnswersQuery from "./queries/ProductQuestionAnswersQuery";
import submitProductReviewMutation from "./queries/SubmitProductReviewMutation";

const COMMUNITY_PAGE_SIZE = 10;
const ANSWER_PAGE_SIZE = 5;

type CommunityProduct = NonNullable<ProductCommunityQuery["response"]["product"]>;
type Review = CommunityProduct["reviews"]["edges"][number]["node"];
type Question = CommunityProduct["questions"]["edges"][number]["node"];
type Answer = Question["answers"]["edges"][number]["node"];

const styles = create({
  answer: { borderInlineStart: "2px solid var(--pc-border-quiet)", display: "grid", gap: "0.35rem", paddingInlineStart: "0.8rem" },
  content: { display: "grid", gap: "1.25rem" },
  field: { display: "grid", gap: "0.35rem" },
  form: { display: "grid", gap: "0.75rem", maxWidth: "38rem" },
  input: { backgroundColor: "var(--pc-surface)", border: "1px solid var(--pc-border-emphasized)", borderRadius: "0.4rem", color: "var(--pc-text)", minHeight: "2.6rem", padding: "0.65rem" },
  item: { display: "grid", gap: "0.5rem" },
  list: { display: "grid", gap: "1.2rem", listStyle: "none", margin: 0, padding: 0 },
  metadata: { color: "var(--pc-text-secondary)", margin: 0 },
  title: { fontSize: "1.25rem", margin: 0 }
});

export function ProductCommunityPanel({
  productId,
  productSlug
}: {
  productId: string;
  productSlug: string;
}) {
  const {
    product,
    questions,
    reviews,
    setQuestionsAfter,
    setReviewsAfter
  } = useCommunityPages(productSlug);

  if (!product) {
    return <p role="alert">Reviews and Q&amp;A unavailable.</p>;
  }

  return (
    <section aria-label="Reviews and product questions" {...props(styles.content)}>
      <ReviewSection
        onShowMore={nextCursor(product.reviews.pageInfo, setReviewsAfter)}
        productId={productId}
        reviews={reviews}
        summary={product.reviewSummary}
      />
      <QuestionSection
        onShowMore={nextCursor(product.questions.pageInfo, setQuestionsAfter)}
        productId={productId}
        questions={questions}
      />
    </section>
  );
}

function useCommunityPages(productSlug: string) {
  const [reviewsAfter, setReviewsAfter] = useState<string | null>(null);
  const [questionsAfter, setQuestionsAfter] = useState<string | null>(null);
  const [loadedReviews, setLoadedReviews] = useState<Review[]>([]);
  const [loadedQuestions, setLoadedQuestions] = useState<Question[]>([]);
  const data = useLazyLoadQuery<ProductCommunityQuery>(
    productCommunityQuery,
    {
      slug: productSlug,
      reviewFirst: COMMUNITY_PAGE_SIZE,
      reviewsAfter,
      questionFirst: COMMUNITY_PAGE_SIZE,
      questionsAfter,
      answerFirst: ANSWER_PAGE_SIZE
    },
    { fetchPolicy: "store-or-network" }
  );
  const product = data.product;
  const pageReviews = useMemo(
    () => product?.reviews.edges.map(({ node }) => node) ?? [],
    [product?.reviews]
  );
  const pageQuestions = useMemo(
    () => product?.questions.edges.map(({ node }) => node) ?? [],
    [product?.questions]
  );

  useEffect(() => {
    setLoadedReviews((current) => appendUnique(current, pageReviews));
  }, [pageReviews]);

  useEffect(() => {
    setLoadedQuestions((current) => appendUnique(current, pageQuestions));
  }, [pageQuestions]);

  return {
    product,
    questions: appendUnique(loadedQuestions, pageQuestions),
    reviews: appendUnique(loadedReviews, pageReviews),
    setQuestionsAfter,
    setReviewsAfter
  };
}

function ReviewSection({
  onShowMore,
  productId,
  reviews,
  summary
}: {
  onShowMore: (() => void) | null;
  productId: string;
  reviews: readonly Review[];
  summary: CommunityProduct["reviewSummary"];
}) {
  const [commitReview, pending] = useMutation<SubmitProductReviewMutation>(submitProductReviewMutation);
  const [message, setMessage] = useState<string | null>(null);
  const ratingId = useId();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const input = reviewInput(productId, new FormData(event.currentTarget));
      const { response, graphQLErrors } = await commitRouteMutationPromise(commitReview, { variables: { input } });
      const payload = response.submitProductReview;
      setMessage(payload?.review ? "Review submitted for moderation." : routeMutationErrorMessage(payload?.errors, graphQLErrors));
    } catch { setMessage(DEFAULT_ROUTE_ERROR_MESSAGE); }
  }

  return <section aria-labelledby="reviews-heading" {...props(styles.content)}>
    <h2 id="reviews-heading" {...props(styles.title)}>Reviews</h2>
    <p {...props(styles.metadata)}>{summary.count ? `${summary.averageRating} out of 5 from ${summary.count} published review${summary.count === 1 ? "" : "s"}.` : "No published reviews yet."}</p>
    <ul aria-label="Published product reviews" {...props(styles.list)}>{reviews.map((review) => <li key={review.id} {...props(styles.item)}><strong>{review.title ?? `${review.rating} out of 5`}</strong><span>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span>{review.body ? <p>{review.body}</p> : null}<p {...props(styles.metadata)}>{review.authorLabel}{review.verifiedPurchase ? " · Verified purchase" : " · Purchase not verified"}</p></li>)}</ul>
    {onShowMore ? <Button onClick={onShowMore} type="button">Show more reviews</Button> : null}
    <details><summary>Write a review</summary><form onSubmit={submit} {...props(styles.form)}>
      <label htmlFor={ratingId} {...props(styles.field)}>Rating<select id={ratingId} name="rating" defaultValue="5" {...props(styles.input)}>{[5,4,3,2,1].map((rating) => <option key={rating} value={rating}>{rating}</option>)}</select></label>
      <label {...props(styles.field)}>Title<input name="title" maxLength={120} {...props(styles.input)} /></label>
      <label {...props(styles.field)}>Review<textarea name="body" maxLength={5000} rows={4} {...props(styles.input)} /></label>
      <Button disabled={pending} type="submit">{pending ? "Submitting…" : "Submit review"}</Button>{message ? <p role="status">{message}</p> : null}
    </form></details>
  </section>;
}

function reviewInput(
  productId: string,
  form: FormData
): SubmitProductReviewMutation["variables"]["input"] {
  const title = String(form.get("title") ?? "").trim();
  const body = String(form.get("body") ?? "").trim();

  return {
    productId,
    rating: Number(form.get("rating")),
    ...(title ? { title } : {}),
    ...(body ? { body } : {})
  };
}

function questionInput(
  productId: string,
  form: FormData
): AskProductQuestionMutation["variables"]["input"] {
  const body = String(form.get("body") ?? "").trim();

  return {
    productId,
    title: String(form.get("title") ?? "").trim(),
    ...(body ? { body } : {})
  };
}

function QuestionSection({
  onShowMore,
  productId,
  questions
}: {
  onShowMore: (() => void) | null;
  productId: string;
  questions: readonly Question[];
}) {
  const [commitQuestion, pending] = useMutation<AskProductQuestionMutation>(askProductQuestionMutation);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const input = questionInput(productId, new FormData(event.currentTarget));
      const { response, graphQLErrors } = await commitRouteMutationPromise(commitQuestion, { variables: { input } });
      const payload = response.askProductQuestion;

      if (payload?.question) setMessage("Question submitted for moderation.");
      else setMessage(routeMutationErrorMessage(payload?.errors, graphQLErrors));
    } catch { setMessage(DEFAULT_ROUTE_ERROR_MESSAGE); }
  }

  return <section aria-labelledby="questions-heading" {...props(styles.content)}>
    <h2 id="questions-heading" {...props(styles.title)}>Product Q&amp;A</h2>
    {questions.length ? <ul aria-label="Published product questions" {...props(styles.list)}>{questions.map((question) => <li key={question.id} {...props(styles.item)}><strong>{question.title}</strong>{question.body ? <p>{question.body}</p> : null}<p {...props(styles.metadata)}>{question.authorLabel}</p><QuestionAnswers question={question} /><AnswerForm questionId={question.id} /></li>)}</ul> : <p>No published questions yet.</p>}
    {onShowMore ? <Button onClick={onShowMore} type="button">Show more questions</Button> : null}
    <details><summary>Ask a question</summary><form onSubmit={submit} {...props(styles.form)}><label {...props(styles.field)}>Question<input name="title" required maxLength={200} {...props(styles.input)} /></label><label {...props(styles.field)}>Details<textarea name="body" maxLength={5000} rows={3} {...props(styles.input)} /></label><Button disabled={pending} type="submit">{pending ? "Submitting…" : "Submit question"}</Button>{message ? <p role="status">{message}</p> : null}</form></details>
  </section>;
}

function QuestionAnswers({ question }: { question: Question }) {
  const answers = question.answers.edges.map(({ node }) => node);
  const next = question.answers.pageInfo.hasNextPage
    ? question.answers.pageInfo.endCursor
    : null;
  const [showMore, setShowMore] = useState(false);

  return <>
    {answers.map((answer) => <AnswerView acceptedAnswerId={question.acceptedAnswerId} answer={answer} key={answer.id} />)}
    {showMore && next ? (
      <ResettableErrorBoundary resetToken={next} fallback={<p role="alert">More answers unavailable.</p>}>
        <Suspense fallback={<p role="status">Loading more answers...</p>}>
          <AdditionalAnswers acceptedAnswerId={question.acceptedAnswerId} after={next} questionId={question.id} />
        </Suspense>
      </ResettableErrorBoundary>
    ) : next ? <Button onClick={() => setShowMore(true)} type="button">Show more answers</Button> : null}
  </>;
}

function AdditionalAnswers({
  acceptedAnswerId,
  after: initialAfter,
  questionId
}: {
  acceptedAnswerId: string | null | undefined;
  after: string;
  questionId: string;
}) {
  const [after, setAfter] = useState(initialAfter);
  const [loadedAnswers, setLoadedAnswers] = useState<Answer[]>([]);
  const data = useLazyLoadQuery<ProductQuestionAnswersQuery>(
    productQuestionAnswersQuery,
    { id: questionId, first: ANSWER_PAGE_SIZE, after },
    { fetchPolicy: "store-or-network" }
  );
  const connection = data.productQuestion?.answers;
  const pageAnswers = useMemo(
    () => connection?.edges.map(({ node }) => node) ?? [],
    [connection]
  );
  const answers = appendUnique(loadedAnswers, pageAnswers);

  useEffect(() => {
    setLoadedAnswers((current) => appendUnique(current, pageAnswers));
  }, [pageAnswers]);

  const next = connection?.pageInfo.hasNextPage ? connection.pageInfo.endCursor : null;

  return <>
    {answers.map((answer) => <AnswerView acceptedAnswerId={acceptedAnswerId} answer={answer} key={answer.id} />)}
    {next ? <Button onClick={() => setAfter(next)} type="button">Show more answers</Button> : null}
  </>;
}

function AnswerView({
  acceptedAnswerId,
  answer
}: {
  acceptedAnswerId: string | null | undefined;
  answer: Answer;
}) {
  return <div {...props(styles.answer)}><p>{answer.body}</p><p {...props(styles.metadata)}>{answer.id === acceptedAnswerId ? "Accepted answer · " : ""}{answer.authorLabel}</p></div>;
}

function AnswerForm({ questionId }: { questionId: string }) {
  const [commitAnswer, pending] = useMutation<AnswerProductQuestionMutation>(answerProductQuestionMutation);
  const [message, setMessage] = useState<string | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); try { const { response, graphQLErrors } = await commitRouteMutationPromise(commitAnswer, { variables: { input: { questionId, body: String(form.get("body") ?? "").trim() } } }); const payload = response.answerProductQuestion; setMessage(payload?.answer ? "Answer submitted for moderation." : routeMutationErrorMessage(payload?.errors, graphQLErrors)); } catch { setMessage(DEFAULT_ROUTE_ERROR_MESSAGE); } }
  return <details><summary>Answer this question</summary><form onSubmit={submit} {...props(styles.form)}><label {...props(styles.field)}>Answer<textarea name="body" required maxLength={5000} rows={3} {...props(styles.input)} /></label><Button disabled={pending} type="submit">{pending ? "Submitting…" : "Submit answer"}</Button>{message ? <p role="status">{message}</p> : null}</form></details>;
}

function nextCursor(
  pageInfo: { readonly endCursor: string | null | undefined; readonly hasNextPage: boolean },
  setAfter: (cursor: string) => void
) {
  const cursor = pageInfo.hasNextPage ? pageInfo.endCursor : null;
  return cursor ? () => setAfter(cursor) : null;
}

function appendUnique<T extends { readonly id: string }>(
  existing: T[],
  incoming: readonly T[]
): T[] {
  if (incoming.length === 0) {
    return existing;
  }

  const seen = new Set(existing.map(({ id }) => id));
  const appended = incoming.filter(({ id }) => !seen.has(id));
  return appended.length ? [...existing, ...appended] : existing;
}
