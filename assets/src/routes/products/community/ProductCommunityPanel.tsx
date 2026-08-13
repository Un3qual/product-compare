import { useEffect, useMemo, useState } from "react";
import { props } from "@stylexjs/stylex";
import { useLazyLoadQuery } from "react-relay";
import type { ProductCommunityOperationsQuery } from "$generated/ProductCommunityOperationsQuery.graphql";
import { Button } from "$ui/primitives/Button";
import { CommunityQuestionAnswers } from "./CommunityQuestionAnswers";
import {
  AnswerSubmissionForm,
  QuestionSubmissionForm,
  ReviewSubmissionForm,
} from "./CommunitySubmissionForms";
import { OwnerCommunitySubmissions } from "./OwnerCommunitySubmissions";
import { QuestionItem } from "./ProductQuestionItem";
import { ReviewItem } from "./ProductReviewItem";
import {
  appendUniqueCommunityItems,
  nextCommunityPageCursor,
  publishedReviewSummary,
} from "./product-community-data";
import { productCommunityStyles as styles } from "./product-community-styles";
import { productCommunityOperationsQuery } from "./ProductCommunityOperations";

const communityPageSize = 10;
const answerPageSize = 5;

type CommunityProduct = NonNullable<ProductCommunityOperationsQuery["response"]["product"]>;
type Review = CommunityProduct["reviews"]["edges"][number]["node"];
type Question = CommunityProduct["questions"]["edges"][number]["node"];

export function ProductCommunityPanel({
  productId,
  productSlug,
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
    setReviewsAfter,
  } = useCommunityPages(productSlug);

  if (!product) {
    return <p role="alert">Reviews and Q&amp;A unavailable.</p>;
  }

  return (
    <section aria-label="Reviews and product questions" {...props(styles.content)}>
      <OwnerCommunitySubmissions submissions={product.viewerCommunitySubmissions} />
      <ReviewSection
        onShowMore={nextPageAction(product.reviews.pageInfo, reviewsAfter, setReviewsAfter)}
        productId={productId}
        reviews={reviews}
        summary={product.reviewSummary}
      />
      <QuestionSection
        onShowMore={nextPageAction(product.questions.pageInfo, questionsAfter, setQuestionsAfter)}
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
      reviewFirst: communityPageSize,
      reviewsAfter,
      questionFirst: communityPageSize,
      questionsAfter,
      answerFirst: answerPageSize,
    },
    { fetchPolicy: "store-or-network" },
  );
  const product = data.product;
  const pageReviews = useMemo(
    () => product?.reviews.edges.map(({ node }) => node) ?? [],
    [product?.reviews],
  );
  const pageQuestions = useMemo(
    () => product?.questions.edges.map(({ node }) => node) ?? [],
    [product?.questions],
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
    setReviewsAfter,
  };
}

function ReviewSection({
  onShowMore,
  productId,
  reviews,
  summary,
}: {
  onShowMore: (() => void) | null;
  productId: string;
  reviews: readonly Review[];
  summary: CommunityProduct["reviewSummary"];
}) {
  return (
    <section aria-labelledby="reviews-heading" {...props(styles.content)}>
      <h2 id="reviews-heading" {...props(styles.title)}>
        Reviews
      </h2>
      <p {...props(styles.metadata)}>{publishedReviewSummary(summary)}</p>
      <ul aria-label="Published product reviews" {...props(styles.list)}>
        {reviews.map((review) => (
          <ReviewItem key={review.id} review={review} />
        ))}
      </ul>
      {onShowMore ? (
        <Button onClick={onShowMore} type="button" variant="link">
          Show more reviews
        </Button>
      ) : null}
      <ReviewSubmissionForm productId={productId} />
    </section>
  );
}

function QuestionSection({
  onShowMore,
  productId,
  questions,
}: {
  onShowMore: (() => void) | null;
  productId: string;
  questions: readonly Question[];
}) {
  return (
    <section aria-labelledby="questions-heading" {...props(styles.content)}>
      <h2 id="questions-heading" {...props(styles.title)}>
        Product Q&amp;A
      </h2>
      {questions.length ? (
        <ul aria-label="Published product questions" {...props(styles.list)}>
          {questions.map((question) => (
            <QuestionItem key={question.id} question={question}>
              <CommunityQuestionAnswers question={question} />
              <AnswerSubmissionForm questionId={question.id} />
            </QuestionItem>
          ))}
        </ul>
      ) : (
        <p>No published questions yet.</p>
      )}
      {onShowMore ? (
        <Button onClick={onShowMore} type="button" variant="link">
          Show more questions
        </Button>
      ) : null}
      <QuestionSubmissionForm productId={productId} />
    </section>
  );
}

function nextPageAction(
  pageInfo: CommunityProduct["questions"]["pageInfo"],
  currentAfter: string | null,
  setAfter: (cursor: string) => void,
) {
  const cursor = nextCommunityPageCursor(pageInfo, currentAfter);
  return cursor ? () => setAfter(cursor) : null;
}
