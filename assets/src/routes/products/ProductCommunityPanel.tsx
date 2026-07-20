import {
  Suspense,
  type FormEvent,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState
} from "react";
import { create, props } from "@stylexjs/stylex";
import { useLazyLoadQuery, useMutation } from "react-relay";
import type { AnswerProductQuestionMutation } from "../../__generated__/AnswerProductQuestionMutation.graphql";
import type { AskProductQuestionMutation } from "../../__generated__/AskProductQuestionMutation.graphql";
import type { ProductCommunityQuery } from "../../__generated__/ProductCommunityQuery.graphql";
import type { ProductQuestionAnswersQuery } from "../../__generated__/ProductQuestionAnswersQuery.graphql";
import type { RemoveCommunityContentMutation } from "../../__generated__/RemoveCommunityContentMutation.graphql";
import type { SubmitProductReviewMutation } from "../../__generated__/SubmitProductReviewMutation.graphql";
import type { UpdateProductAnswerMutation } from "../../__generated__/UpdateProductAnswerMutation.graphql";
import type { UpdateProductQuestionMutation } from "../../__generated__/UpdateProductQuestionMutation.graphql";
import type { UpdateProductReviewMutation } from "../../__generated__/UpdateProductReviewMutation.graphql";
import { ResettableErrorBoundary } from "../../relay/ResettableErrorBoundary";
import { Button } from "../../ui/primitives/Button";
import { commitRouteMutationPromise } from "../relay-mutations";
import { DEFAULT_ROUTE_ERROR_MESSAGE, hasRouteGraphQLErrors } from "../route-errors";
import answerProductQuestionMutation from "./queries/AnswerProductQuestionMutation";
import askProductQuestionMutation from "./queries/AskProductQuestionMutation";
import productCommunityQuery from "./queries/ProductCommunityQuery";
import productQuestionAnswersQuery from "./queries/ProductQuestionAnswersQuery";
import removeCommunityContentMutation from "./queries/RemoveCommunityContentMutation";
import submitProductReviewMutation from "./queries/SubmitProductReviewMutation";
import updateProductAnswerMutation from "./queries/UpdateProductAnswerMutation";
import updateProductQuestionMutation from "./queries/UpdateProductQuestionMutation";
import updateProductReviewMutation from "./queries/UpdateProductReviewMutation";
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
  resolveProductReviewUpdateMessage
} from "./product-community-data";

const COMMUNITY_PAGE_SIZE = 10;
const ANSWER_PAGE_SIZE = 5;

type CommunityProduct = NonNullable<ProductCommunityQuery["response"]["product"]>;
type Review = CommunityProduct["reviews"]["edges"][number]["node"];
type Question = CommunityProduct["questions"]["edges"][number]["node"];
type Answer = Question["answers"]["edges"][number]["node"];
type CommunityContentType = "REVIEW" | "QUESTION" | "ANSWER";
type CommunityContentLabel = "review" | "question" | "answer";

const styles = create({
  actions: { display: "flex", flexWrap: "wrap", gap: "0.5rem" },
  answer: { borderInlineStart: "2px solid var(--pc-border-quiet)", display: "grid", gap: "0.35rem", paddingInlineStart: "0.8rem" },
  confirmation: { border: "1px solid var(--pc-border-emphasized)", borderRadius: "0.4rem", display: "grid", gap: "0.5rem", padding: "0.75rem" },
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
  const { product, questions, reviews, setQuestionsAfter, setReviewsAfter } =
    useCommunityPages(productSlug);

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
    setLoadedReviews((current) => appendUniqueCommunityItems(current, pageReviews));
  }, [pageReviews]);
  useEffect(() => {
    setLoadedQuestions((current) => appendUniqueCommunityItems(current, pageQuestions));
  }, [pageQuestions]);

  return {
    product,
    questions: appendUniqueCommunityItems(loadedQuestions, pageQuestions),
    reviews: appendUniqueCommunityItems(loadedReviews, pageReviews),
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
  const submissionKey = useSubmissionKey();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const form = new FormData(event.currentTarget);
      const input = buildProductReviewInput({
        body: form.get("body"),
        idempotencyKey: submissionKey.current(),
        productId,
        rating: form.get("rating"),
        title: form.get("title")
      });
      const { response, graphQLErrors } = await commitRouteMutationPromise(commitReview, { variables: { input } });
      submissionKey.clear();
      setMessage(resolveProductReviewMutationMessage(response.submitProductReview, graphQLErrors));
    } catch {
      setMessage(DEFAULT_ROUTE_ERROR_MESSAGE);
    }
  }

  return <section aria-labelledby="reviews-heading" {...props(styles.content)}>
    <h2 id="reviews-heading" {...props(styles.title)}>Reviews</h2>
    <p {...props(styles.metadata)}>{publishedReviewSummary(summary)}</p>
    <ul aria-label="Published product reviews" {...props(styles.list)}>
      {reviews.map((review) => <ReviewItem key={review.id} review={review} />)}
    </ul>
    {onShowMore ? <Button onClick={onShowMore} type="button">Show more reviews</Button> : null}
    <details><summary>Write a review</summary><form onSubmit={submit} {...props(styles.form)}>
      <label htmlFor={ratingId} {...props(styles.field)}>Rating<select id={ratingId} name="rating" defaultValue="5" {...props(styles.input)}>{[5,4,3,2,1].map((rating) => <option key={rating} value={rating}>{rating}</option>)}</select></label>
      <label {...props(styles.field)}>Title<input name="title" maxLength={120} {...props(styles.input)} /></label>
      <label {...props(styles.field)}>Review<textarea name="body" maxLength={5000} rows={4} {...props(styles.input)} /></label>
      <Button disabled={pending} type="submit">{pending ? "Submitting…" : "Submit review"}</Button>
      {message ? <p role="status">{message}</p> : null}
    </form></details>
  </section>;
}

function ReviewItem({ review }: { review: Review }) {
  const [commitUpdate, pending] = useMutation<UpdateProductReviewMutation>(updateProductReviewMutation);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const display = publishedReviewRowDisplayData(review);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const { response, graphQLErrors } = await commitRouteMutationPromise(commitUpdate, {
        variables: { input: {
          id: review.id,
          rating: Number(form.get("rating")),
          title: normalizedFormText(form.get("title")),
          body: normalizedFormText(form.get("body"))
        } }
      });
      const payload = response.updateProductReview;
      setMessage(resolveProductReviewUpdateMessage(payload, graphQLErrors));
      if (payload.review && !hasRouteGraphQLErrors(graphQLErrors)) setEditing(false);
    } catch {
      setMessage(DEFAULT_ROUTE_ERROR_MESSAGE);
    }
  }

  return <li><article aria-label={`Review: ${display.title}`} {...props(styles.item)}>
    {removed ? <p role="status">Community content removed.</p> : <>
      <strong>{display.title}</strong><span>{display.ratingStars}</span>
      {review.body ? <p>{review.body}</p> : null}
      <p {...props(styles.metadata)}>{display.authorCopy}</p>
      {editing ? <form onSubmit={submit} {...props(styles.form)}>
        <label {...props(styles.field)}>Edit review rating<select name="rating" defaultValue={review.rating} {...props(styles.input)}>{[5,4,3,2,1].map((rating) => <option key={rating} value={rating}>{rating}</option>)}</select></label>
        <label {...props(styles.field)}>Edit review title<input name="title" defaultValue={review.title ?? ""} maxLength={120} {...props(styles.input)} /></label>
        <label {...props(styles.field)}>Edit review body<textarea name="body" defaultValue={review.body ?? ""} maxLength={5000} rows={4} {...props(styles.input)} /></label>
        <div {...props(styles.actions)}><Button disabled={pending} type="submit">{pending ? "Saving…" : "Save review"}</Button><Button onClick={() => setEditing(false)} type="button">Cancel edit</Button></div>
      </form> : null}
      <div {...props(styles.actions)}>
        {review.viewerCanEdit && !editing ? <Button onClick={() => setEditing(true)} type="button">Edit review</Button> : null}
        {review.viewerCanRemove ? <RemoveCommunityControl contentId={review.id} contentType="REVIEW" label="review" onRemoved={() => setRemoved(true)} /> : null}
      </div>
      {message ? <p role="status">{message}</p> : null}
    </>}
  </article></li>;
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
  const submissionKey = useSubmissionKey();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const form = new FormData(event.currentTarget);
      const input = buildProductQuestionInput({
        body: form.get("body"),
        idempotencyKey: submissionKey.current(),
        productId,
        title: form.get("title")
      });
      const { response, graphQLErrors } = await commitRouteMutationPromise(commitQuestion, { variables: { input } });
      submissionKey.clear();
      setMessage(resolveProductQuestionMutationMessage(response.askProductQuestion, graphQLErrors));
    } catch {
      setMessage(DEFAULT_ROUTE_ERROR_MESSAGE);
    }
  }

  return <section aria-labelledby="questions-heading" {...props(styles.content)}>
    <h2 id="questions-heading" {...props(styles.title)}>Product Q&amp;A</h2>
    {questions.length ? <ul aria-label="Published product questions" {...props(styles.list)}>
      {questions.map((question) => <QuestionItem key={question.id} question={question} />)}
    </ul> : <p>No published questions yet.</p>}
    {onShowMore ? <Button onClick={onShowMore} type="button">Show more questions</Button> : null}
    <details><summary>Ask a question</summary><form onSubmit={submit} {...props(styles.form)}>
      <label {...props(styles.field)}>Question<input name="title" required maxLength={200} {...props(styles.input)} /></label>
      <label {...props(styles.field)}>Details<textarea name="body" maxLength={5000} rows={3} {...props(styles.input)} /></label>
      <Button disabled={pending} type="submit">{pending ? "Submitting…" : "Submit question"}</Button>
      {message ? <p role="status">{message}</p> : null}
    </form></details>
  </section>;
}

function QuestionItem({ question }: { question: Question }) {
  const [commitUpdate, pending] = useMutation<UpdateProductQuestionMutation>(updateProductQuestionMutation);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const { response, graphQLErrors } = await commitRouteMutationPromise(commitUpdate, {
        variables: { input: {
          id: question.id,
          title: normalizedFormText(form.get("title")),
          body: normalizedFormText(form.get("body"))
        } }
      });
      const payload = response.updateProductQuestion;
      setMessage(resolveProductQuestionUpdateMessage(payload, graphQLErrors));
      if (payload.question && !hasRouteGraphQLErrors(graphQLErrors)) setEditing(false);
    } catch {
      setMessage(DEFAULT_ROUTE_ERROR_MESSAGE);
    }
  }

  return <li><article aria-label={`Question: ${question.title}`} {...props(styles.item)}>
    {removed ? <p role="status">Community content removed.</p> : <>
      <strong>{question.title}</strong>
      {question.body ? <p>{question.body}</p> : null}
      <p {...props(styles.metadata)}>{question.authorLabel}</p>
      {editing ? <form onSubmit={submit} {...props(styles.form)}>
        <label {...props(styles.field)}>Edit question title<input name="title" defaultValue={question.title} required maxLength={200} {...props(styles.input)} /></label>
        <label {...props(styles.field)}>Edit question body<textarea name="body" defaultValue={question.body ?? ""} maxLength={5000} rows={3} {...props(styles.input)} /></label>
        <div {...props(styles.actions)}><Button disabled={pending} type="submit">{pending ? "Saving…" : "Save question"}</Button><Button onClick={() => setEditing(false)} type="button">Cancel edit</Button></div>
      </form> : null}
      <div {...props(styles.actions)}>
        {question.viewerCanEdit && !editing ? <Button onClick={() => setEditing(true)} type="button">Edit question</Button> : null}
        {question.viewerCanRemove ? <RemoveCommunityControl contentId={question.id} contentType="QUESTION" label="question" onRemoved={() => setRemoved(true)} /> : null}
      </div>
      {message ? <p role="status">{message}</p> : null}
      <QuestionAnswers question={question} />
      <AnswerForm questionId={question.id} />
    </>}
  </article></li>;
}

function QuestionAnswers({ question }: { question: Question }) {
  const answers = question.answers.edges.map(({ node }) => node);
  const next = question.answers.pageInfo.hasNextPage ? question.answers.pageInfo.endCursor : null;
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
  const answers = appendUniqueCommunityItems(loadedAnswers, pageAnswers);

  useEffect(() => {
    setLoadedAnswers((current) => appendUniqueCommunityItems(current, pageAnswers));
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
  const [commitUpdate, pending] = useMutation<UpdateProductAnswerMutation>(updateProductAnswerMutation);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const { response, graphQLErrors } = await commitRouteMutationPromise(commitUpdate, {
        variables: { input: { id: answer.id, body: normalizedFormText(form.get("body")) } }
      });
      const payload = response.updateProductAnswer;
      setMessage(resolveProductAnswerUpdateMessage(payload, graphQLErrors));
      if (payload.answer && !hasRouteGraphQLErrors(graphQLErrors)) setEditing(false);
    } catch {
      setMessage(DEFAULT_ROUTE_ERROR_MESSAGE);
    }
  }

  return <article aria-label={`Answer by ${answer.authorLabel}`} {...props(styles.answer)}>
    {removed ? <p role="status">Community content removed.</p> : <>
      <p>{answer.body}</p>
      <p {...props(styles.metadata)}>{acceptedAnswerAuthorLabel(answer.id, acceptedAnswerId, answer.authorLabel)}</p>
      {editing ? <form onSubmit={submit} {...props(styles.form)}>
        <label {...props(styles.field)}>Edit answer body<textarea name="body" defaultValue={answer.body} required maxLength={5000} rows={3} {...props(styles.input)} /></label>
        <div {...props(styles.actions)}><Button disabled={pending} type="submit">{pending ? "Saving…" : "Save answer"}</Button><Button onClick={() => setEditing(false)} type="button">Cancel edit</Button></div>
      </form> : null}
      <div {...props(styles.actions)}>
        {answer.viewerCanEdit && !editing ? <Button onClick={() => setEditing(true)} type="button">Edit answer</Button> : null}
        {answer.viewerCanRemove ? <RemoveCommunityControl contentId={answer.id} contentType="ANSWER" label="answer" onRemoved={() => setRemoved(true)} /> : null}
      </div>
      {message ? <p role="status">{message}</p> : null}
    </>}
  </article>;
}

function AnswerForm({ questionId }: { questionId: string }) {
  const [commitAnswer, pending] = useMutation<AnswerProductQuestionMutation>(answerProductQuestionMutation);
  const [message, setMessage] = useState<string | null>(null);
  const submissionKey = useSubmissionKey();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const { response, graphQLErrors } = await commitRouteMutationPromise(commitAnswer, {
        variables: { input: buildProductAnswerInput({
          questionId,
          body: form.get("body"),
          idempotencyKey: submissionKey.current()
        }) }
      });
      submissionKey.clear();
      setMessage(resolveProductAnswerMutationMessage(response.answerProductQuestion, graphQLErrors));
    } catch {
      setMessage(DEFAULT_ROUTE_ERROR_MESSAGE);
    }
  }

  return <details><summary>Answer this question</summary><form onSubmit={submit} {...props(styles.form)}>
    <label {...props(styles.field)}>Answer<textarea name="body" required maxLength={5000} rows={3} {...props(styles.input)} /></label>
    <Button disabled={pending} type="submit">{pending ? "Submitting…" : "Submit answer"}</Button>
    {message ? <p role="status">{message}</p> : null}
  </form></details>;
}

function RemoveCommunityControl({
  contentId,
  contentType,
  label,
  onRemoved
}: {
  contentId: string;
  contentType: CommunityContentType;
  label: CommunityContentLabel;
  onRemoved: () => void;
}) {
  const [commitRemove, pending] = useMutation<RemoveCommunityContentMutation>(removeCommunityContentMutation);
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function remove() {
    try {
      const { response, graphQLErrors } = await commitRouteMutationPromise(commitRemove, {
        variables: { input: { contentId, contentType } }
      });
      const payload = response.removeCommunityContent;
      setMessage(resolveCommunityContentRemovalMessage(payload, graphQLErrors));
      if (payload.removedContentId && !hasRouteGraphQLErrors(graphQLErrors)) onRemoved();
    } catch {
      setMessage(DEFAULT_ROUTE_ERROR_MESSAGE);
    }
  }

  if (!confirming) {
    return <><Button onClick={() => setConfirming(true)} type="button">Remove {label}</Button>{message ? <p role="status">{message}</p> : null}</>;
  }

  return <div role="group" aria-label={`Confirm removal of ${label}`} {...props(styles.confirmation)}>
    <span>Remove this {label}?</span>
    <div {...props(styles.actions)}>
      <Button disabled={pending} onClick={remove} type="button">{pending ? "Removing…" : `Confirm remove ${label}`}</Button>
      <Button disabled={pending} onClick={() => setConfirming(false)} type="button">Cancel removal</Button>
    </div>
    {message ? <p role="status">{message}</p> : null}
  </div>;
}

function useSubmissionKey() {
  const key = useRef<string | null>(null);
  const current = useCallback(() => {
    key.current ??= crypto.randomUUID();
    return key.current;
  }, []);
  const clear = useCallback(() => {
    key.current = null;
  }, []);

  return useMemo(() => ({ clear, current }), [clear, current]);
}

function normalizedFormText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function nextCursor(
  pageInfo: { readonly endCursor: string | null | undefined; readonly hasNextPage: boolean },
  setAfter: (cursor: string) => void
) {
  const cursor = nextCommunityPageCursor(pageInfo);
  return cursor ? () => setAfter(cursor) : null;
}
