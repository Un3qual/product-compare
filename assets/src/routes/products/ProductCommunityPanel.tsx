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
import { props } from "@stylexjs/stylex";
import { useLazyLoadQuery, useMutation } from "react-relay";
import type { ProductCommunityOperationsAnswerProductQuestionMutation } from "../../__generated__/ProductCommunityOperationsAnswerProductQuestionMutation.graphql";
import type { ProductCommunityOperationsAskProductQuestionMutation } from "../../__generated__/ProductCommunityOperationsAskProductQuestionMutation.graphql";
import type { ProductCommunityOperationsQuery } from "../../__generated__/ProductCommunityOperationsQuery.graphql";
import type { ProductQuestionAnswersQuery } from "../../__generated__/ProductQuestionAnswersQuery.graphql";
import type { ProductCommunityOperationsSubmitProductReviewMutation } from "../../__generated__/ProductCommunityOperationsSubmitProductReviewMutation.graphql";
import { ResettableErrorBoundary } from "../../relay/ResettableErrorBoundary";
import { Button } from "../../ui/primitives/Button";
import { Label } from "../../ui/primitives/Label";
import { Select } from "../../ui/primitives/Select";
import { TextArea } from "../../ui/primitives/TextArea";
import { TextField } from "../../ui/primitives/TextField";
import { commitRouteMutationPromise } from "../relay-mutations";
import { DEFAULT_ROUTE_ERROR_MESSAGE } from "../route-errors";
import { AnswerView, QuestionItem, ReviewItem } from "./ProductCommunityItems";
import { productCommunityStyles as styles } from "./product-community-styles";
import {
  answerProductQuestionMutation,
  askProductQuestionMutation,
  productCommunityOperationsQuery,
  submitProductReviewMutation
} from "./ProductCommunityOperations";
import productQuestionAnswersQuery from "./queries/ProductQuestionAnswersQuery";
import {
  appendUniqueCommunityItems,
  buildProductAnswerInput,
  buildProductQuestionInput,
  buildProductReviewInput,
  nextCommunityPageCursor,
  publishedReviewSummary,
  resolveProductAnswerMutationMessage,
  resolveProductQuestionMutationMessage,
  resolveProductReviewMutationMessage
} from "./product-community-data";

const COMMUNITY_PAGE_SIZE = 10;
const ANSWER_PAGE_SIZE = 5;

type CommunityProduct = NonNullable<ProductCommunityOperationsQuery["response"]["product"]>;
type Review = CommunityProduct["reviews"]["edges"][number]["node"];
type Question = CommunityProduct["questions"]["edges"][number]["node"];
type Answer = Question["answers"]["edges"][number]["node"];
type ViewerCommunitySubmissions = CommunityProduct["viewerCommunitySubmissions"];

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
    questionsAfter,
    reviews,
    reviewsAfter,
    setQuestionsAfter,
    setReviewsAfter
  } =
    useCommunityPages(productSlug);

  if (!product) {
    return <p role="alert">Reviews and Q&amp;A unavailable.</p>;
  }

  return (
    <section aria-label="Reviews and product questions" {...props(styles.content)}>
      <OwnerSubmissionsSection submissions={product.viewerCommunitySubmissions} />
      <ReviewSection
        onShowMore={nextCursor(product.reviews.pageInfo, reviewsAfter, setReviewsAfter)}
        productId={productId}
        reviews={reviews}
        summary={product.reviewSummary}
      />
      <QuestionSection
        onShowMore={nextCursor(product.questions.pageInfo, questionsAfter, setQuestionsAfter)}
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
  const data = useLazyLoadQuery<ProductCommunityOperationsQuery>(
    productCommunityOperationsQuery,
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
    questionsAfter,
    reviews: appendUniqueCommunityItems(loadedReviews, pageReviews),
    reviewsAfter,
    setQuestionsAfter,
    setReviewsAfter
  };
}

function OwnerSubmissionsSection({
  submissions
}: {
  submissions: ViewerCommunitySubmissions;
}) {
  const submissionCount =
    submissions.reviews.length + submissions.questions.length + submissions.answers.length;

  if (submissionCount === 0) return null;

  return <section aria-label="Your non-public community submissions" {...props(styles.content)}>
    <h2 {...props(styles.title)}>Your submissions</h2>
    <p {...props(styles.metadata)}>Pending, hidden, and rejected content remains available to edit or remove.</p>
    <OwnerReviewSubmissions reviews={submissions.reviews} />
    <OwnerQuestionSubmissions questions={submissions.questions} />
    <OwnerAnswerSubmissions answers={submissions.answers} />
  </section>;
}

function OwnerReviewSubmissions({
  reviews
}: {
  reviews: ViewerCommunitySubmissions["reviews"];
}) {
  return <ul aria-label="Your non-public reviews" {...props(styles.list)}>
    {reviews.map((review) => <ReviewItem key={review.id} ownerView review={review} />)}
  </ul>;
}

function OwnerQuestionSubmissions({
  questions
}: {
  questions: ViewerCommunitySubmissions["questions"];
}) {
  return <ul aria-label="Your non-public questions" {...props(styles.list)}>
    {questions.map((question) => <QuestionItem key={question.id} ownerView question={question} />)}
  </ul>;
}

function OwnerAnswerSubmissions({
  answers
}: {
  answers: ViewerCommunitySubmissions["answers"];
}) {
  return <ul aria-label="Your non-public answers" {...props(styles.list)}>
    {answers.map((answer) => <li key={answer.id}><AnswerView answer={answer} ownerView /></li>)}
  </ul>;
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
  const [commitReview, pending] = useMutation<ProductCommunityOperationsSubmitProductReviewMutation>(submitProductReviewMutation);
  const [message, setMessage] = useState<string | null>(null);
  const fieldId = useId();
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
      <Label htmlFor={`${fieldId}-rating`} {...props(styles.field)}>Rating<Select id={`${fieldId}-rating`} name="rating" defaultValue="5" options={[5, 4, 3, 2, 1].map((rating) => ({ label: String(rating), value: String(rating) }))} {...props(styles.input)} /></Label>
      <Label htmlFor={`${fieldId}-title`} {...props(styles.field)}>Title<TextField id={`${fieldId}-title`} name="title" maxLength={120} {...props(styles.input)} /></Label>
      <Label htmlFor={`${fieldId}-body`} {...props(styles.field)}>Review<TextArea id={`${fieldId}-body`} name="body" maxLength={5000} rows={4} {...props(styles.input)} /></Label>
      <Button disabled={pending} type="submit">{pending ? "Submitting…" : "Submit review"}</Button>
      {message ? <p role="status">{message}</p> : null}
    </form></details>
  </section>;
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
  const [commitQuestion, pending] = useMutation<ProductCommunityOperationsAskProductQuestionMutation>(askProductQuestionMutation);
  const [message, setMessage] = useState<string | null>(null);
  const fieldId = useId();
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
      {questions.map((question) => <QuestionItem key={question.id} question={question}>
        <QuestionAnswers question={question} />
        <AnswerForm questionId={question.id} />
      </QuestionItem>)}
    </ul> : <p>No published questions yet.</p>}
    {onShowMore ? <Button onClick={onShowMore} type="button">Show more questions</Button> : null}
    <details><summary>Ask a question</summary><form onSubmit={submit} {...props(styles.form)}>
      <Label htmlFor={`${fieldId}-title`} {...props(styles.field)}>Question<TextField id={`${fieldId}-title`} name="title" required maxLength={200} {...props(styles.input)} /></Label>
      <Label htmlFor={`${fieldId}-body`} {...props(styles.field)}>Details<TextArea id={`${fieldId}-body`} name="body" maxLength={5000} rows={3} {...props(styles.input)} /></Label>
      <Button disabled={pending} type="submit">{pending ? "Submitting…" : "Submit question"}</Button>
      {message ? <p role="status">{message}</p> : null}
    </form></details>
  </section>;
}

function QuestionAnswers({ question }: { question: Question }) {
  const answers = question.answers.edges.map(({ node }) => node);
  const next = nextCommunityPageCursor(question.answers.pageInfo);
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

  const next = nextCommunityPageCursor(connection?.pageInfo, after);
  return <>
    {answers.map((answer) => <AnswerView acceptedAnswerId={acceptedAnswerId} answer={answer} key={answer.id} />)}
    {next ? <Button onClick={() => setAfter(next)} type="button">Show more answers</Button> : null}
  </>;
}

function AnswerForm({ questionId }: { questionId: string }) {
  const [commitAnswer, pending] = useMutation<ProductCommunityOperationsAnswerProductQuestionMutation>(answerProductQuestionMutation);
  const [message, setMessage] = useState<string | null>(null);
  const fieldId = useId();
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
    <Label htmlFor={`${fieldId}-body`} {...props(styles.field)}>Answer<TextArea id={`${fieldId}-body`} name="body" required maxLength={5000} rows={3} {...props(styles.input)} /></Label>
    <Button disabled={pending} type="submit">{pending ? "Submitting…" : "Submit answer"}</Button>
    {message ? <p role="status">{message}</p> : null}
  </form></details>;
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

function nextCursor(
  pageInfo: { readonly endCursor: string | null | undefined; readonly hasNextPage: boolean },
  currentAfter: string | null,
  setAfter: (cursor: string) => void
) {
  const cursor = nextCommunityPageCursor(pageInfo, currentAfter);
  return cursor ? () => setAfter(cursor) : null;
}
