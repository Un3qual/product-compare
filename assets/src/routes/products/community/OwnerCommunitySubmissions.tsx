import { props } from "@stylexjs/stylex";
import type { ProductCommunityOperationsQuery } from "$generated/ProductCommunityOperationsQuery.graphql";
import { AnswerView } from "./ProductAnswerItem";
import { QuestionItem } from "./ProductQuestionItem";
import { ReviewItem } from "./ProductReviewItem";
import { productCommunityStyles as styles } from "./product-community-styles";

type CommunityProduct = NonNullable<ProductCommunityOperationsQuery["response"]["product"]>;
type ViewerCommunitySubmissions = CommunityProduct["viewerCommunitySubmissions"];

export function OwnerCommunitySubmissions({
  submissions,
}: {
  submissions: ViewerCommunitySubmissions;
}) {
  const submissionCount =
    submissions.reviews.length + submissions.questions.length + submissions.answers.length;

  if (submissionCount === 0) return null;

  return (
    <section aria-label="Your non-public community submissions" {...props(styles.content)}>
      <h2 {...props(styles.title)}>Your submissions</h2>
      <p {...props(styles.metadata)}>
        Submissions awaiting review or needing changes remain available to edit or remove.
      </p>
      <ul aria-label="Your non-public reviews" {...props(styles.list)}>
        {submissions.reviews.map((review) => (
          <ReviewItem key={review.id} ownerView review={review} />
        ))}
      </ul>
      <ul aria-label="Your non-public questions" {...props(styles.list)}>
        {submissions.questions.map((question) => (
          <QuestionItem key={question.id} ownerView question={question} />
        ))}
      </ul>
      <ul aria-label="Your non-public answers" {...props(styles.list)}>
        {submissions.answers.map((answer) => (
          <li key={answer.id}>
            <AnswerView answer={answer} ownerView />
          </li>
        ))}
      </ul>
    </section>
  );
}
