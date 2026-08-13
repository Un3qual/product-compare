import { Suspense, useEffect, useMemo, useState } from "react";
import { graphql, useLazyLoadQuery } from "react-relay";
import type { CommunityQuestionAnswersQuery } from "$generated/CommunityQuestionAnswersQuery.graphql";
import type { ProductCommunityOperationsQuery } from "$generated/ProductCommunityOperationsQuery.graphql";
import { ResettableErrorBoundary } from "$relay/ResettableErrorBoundary";
import { Button } from "$ui/primitives/Button";
import { AnswerView } from "./ProductAnswerItem";
import { appendUniqueCommunityItems, nextCommunityPageCursor } from "./product-community-data";

const answerPageSize = 5;

const communityQuestionAnswersQuery = graphql`
  query CommunityQuestionAnswersQuery($id: ID!, $first: Int!, $after: String) {
    productQuestion(id: $id) {
      id
      answers(first: $first, after: $after) {
        edges {
          node {
            id
            ...ProductCommunityItems_answer
          }
        }
        pageInfo {
          endCursor
          hasNextPage
        }
      }
    }
  }
`;

type CommunityProduct = NonNullable<ProductCommunityOperationsQuery["response"]["product"]>;
type Question = CommunityProduct["questions"]["edges"][number]["node"];
type Answer = Question["answers"]["edges"][number]["node"];

export function CommunityQuestionAnswers({ question }: { question: Question }) {
  const answers = question.answers.edges.map(({ node }) => node);
  const next = nextCommunityPageCursor(question.answers.pageInfo);
  const [showMore, setShowMore] = useState(false);

  return (
    <>
      {answers.map((answer) => (
        <AnswerView acceptedAnswerId={question.acceptedAnswerId} answer={answer} key={answer.id} />
      ))}
      {showMore && next ? (
        <ResettableErrorBoundary
          resetToken={next}
          fallback={<p role="alert">More answers unavailable.</p>}
        >
          <Suspense fallback={<p role="status">Loading more answers...</p>}>
            <AdditionalAnswers
              acceptedAnswerId={question.acceptedAnswerId}
              after={next}
              questionId={question.id}
            />
          </Suspense>
        </ResettableErrorBoundary>
      ) : next ? (
        <Button onClick={() => setShowMore(true)} type="button" variant="link">
          Show more answers
        </Button>
      ) : null}
    </>
  );
}

function AdditionalAnswers({
  acceptedAnswerId,
  after: initialAfter,
  questionId,
}: {
  acceptedAnswerId: string | null | undefined;
  after: string;
  questionId: string;
}) {
  const [after, setAfter] = useState(initialAfter);
  const [loadedAnswers, setLoadedAnswers] = useState<Answer[]>([]);
  const data = useLazyLoadQuery<CommunityQuestionAnswersQuery>(
    communityQuestionAnswersQuery,
    { id: questionId, first: answerPageSize, after },
    { fetchPolicy: "store-or-network" },
  );
  const connection = data.productQuestion?.answers;
  const pageAnswers = useMemo(() => connection?.edges.map(({ node }) => node) ?? [], [connection]);
  const answers = appendUniqueCommunityItems(loadedAnswers, pageAnswers);

  useEffect(() => {
    setLoadedAnswers((current) => appendUniqueCommunityItems(current, pageAnswers));
  }, [pageAnswers]);

  const next = nextCommunityPageCursor(connection?.pageInfo, after);
  return (
    <>
      {answers.map((answer) => (
        <AnswerView acceptedAnswerId={acceptedAnswerId} answer={answer} key={answer.id} />
      ))}
      {next ? (
        <Button onClick={() => setAfter(next)} type="button" variant="link">
          Show more answers
        </Button>
      ) : null}
    </>
  );
}
