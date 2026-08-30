import { useState } from "react";
import { props } from "@stylexjs/stylex";
import { useLazyLoadQuery, usePaginationFragment } from "react-relay";
import type { ProductCommunityPanel_questions$key } from "$generated/ProductCommunityPanel_questions.graphql";
import type { ProductCommunityPanel_reviews$key } from "$generated/ProductCommunityPanel_reviews.graphql";
import type { ProductCommunityOperationsQuery } from "$generated/ProductCommunityOperationsQuery.graphql";
import type { ProductCommunityQuestionsPaginationQuery } from "$generated/ProductCommunityQuestionsPaginationQuery.graphql";
import type { ProductCommunityReviewsPaginationQuery } from "$generated/ProductCommunityReviewsPaginationQuery.graphql";
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
import { publishedReviewSummary } from "./product-community-data";
import { productCommunityStyles as styles } from "./product-community-styles";
import {
  productCommunityOperationsQuery,
  productCommunityQuestionsFragment,
  productCommunityReviewsFragment,
} from "./ProductCommunityOperations";

const communityPageSize = 10;
const answerPageSize = 5;

type CommunityProduct = NonNullable<ProductCommunityOperationsQuery["response"]["product"]>;

export function ProductCommunityPanel({
  productId,
  productSlug,
}: {
  productId: string;
  productSlug: string;
}) {
  const { product } = useLazyLoadQuery<ProductCommunityOperationsQuery>(
    productCommunityOperationsQuery,
    {
      slug: productSlug,
      reviewFirst: communityPageSize,
      reviewsAfter: null,
      questionFirst: communityPageSize,
      questionsAfter: null,
      answerFirst: answerPageSize,
    },
    { fetchPolicy: "store-or-network" },
  );

  if (!product) {
    return <p role="alert">Reviews and Q&amp;A unavailable.</p>;
  }

  return (
    <section aria-label="Reviews and product questions" {...props(styles.content)}>
      <OwnerCommunitySubmissions submissions={product.viewerCommunitySubmissions} />
      <ReviewSection fragmentRef={product} productId={productId} summary={product.reviewSummary} />
      <QuestionSection fragmentRef={product} productId={productId} />
    </section>
  );
}

function ReviewSection({
  fragmentRef,
  productId,
  summary,
}: {
  fragmentRef: ProductCommunityPanel_reviews$key;
  productId: string;
  summary: CommunityProduct["reviewSummary"];
}) {
  const { data, hasNext, isLoadingNext, loadNext } = usePaginationFragment<
    ProductCommunityReviewsPaginationQuery,
    ProductCommunityPanel_reviews$key
  >(productCommunityReviewsFragment, fragmentRef);
  const [paginationFailed, setPaginationFailed] = useState(false);
  const reviews = data.reviews.edges.map(({ node }) => node);
  const loadMore = () => {
    setPaginationFailed(false);
    loadNext(communityPageSize, {
      onComplete: (error) => setPaginationFailed(error !== null),
    });
  };

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
      {paginationFailed ? (
        <div role="alert">
          <p>More reviews unavailable.</p>
          <Button disabled={isLoadingNext} onClick={loadMore} type="button">
            Retry reviews
          </Button>
        </div>
      ) : hasNext ? (
        <Button disabled={isLoadingNext} onClick={loadMore} type="button" variant="link">
          {isLoadingNext ? "Loading more reviews…" : "Show more reviews"}
        </Button>
      ) : null}
      <ReviewSubmissionForm productId={productId} />
    </section>
  );
}

function QuestionSection({
  fragmentRef,
  productId,
}: {
  fragmentRef: ProductCommunityPanel_questions$key;
  productId: string;
}) {
  const { data, hasNext, isLoadingNext, loadNext } = usePaginationFragment<
    ProductCommunityQuestionsPaginationQuery,
    ProductCommunityPanel_questions$key
  >(productCommunityQuestionsFragment, fragmentRef);
  const [paginationFailed, setPaginationFailed] = useState(false);
  const questions = data.questions.edges.map(({ node }) => node);
  const loadMore = () => {
    setPaginationFailed(false);
    loadNext(communityPageSize, {
      onComplete: (error) => setPaginationFailed(error !== null),
    });
  };

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
      {paginationFailed ? (
        <div role="alert">
          <p>More questions unavailable.</p>
          <Button disabled={isLoadingNext} onClick={loadMore} type="button">
            Retry questions
          </Button>
        </div>
      ) : hasNext ? (
        <Button disabled={isLoadingNext} onClick={loadMore} type="button" variant="link">
          {isLoadingNext ? "Loading more questions…" : "Show more questions"}
        </Button>
      ) : null}
      <QuestionSubmissionForm productId={productId} />
    </section>
  );
}
