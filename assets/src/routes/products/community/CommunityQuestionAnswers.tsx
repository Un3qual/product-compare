import { useState } from "react";
import { graphql, usePaginationFragment } from "react-relay";
import type { CommunityQuestionAnswers_question$key } from "$generated/CommunityQuestionAnswers_question.graphql";
import type { CommunityQuestionAnswersPaginationQuery } from "$generated/CommunityQuestionAnswersPaginationQuery.graphql";
import { Button } from "$ui/primitives/Button";
import { AnswerView } from "./ProductAnswerItem";

const answerPageSize = 5;

export const communityQuestionAnswersFragment = graphql`
  fragment CommunityQuestionAnswers_question on ProductQuestion
  @argumentDefinitions(answerFirst: { type: "Int!" }, answersAfter: { type: "String" })
  @refetchable(queryName: "CommunityQuestionAnswersPaginationQuery") {
    id
    acceptedAnswerId
    answers(first: $answerFirst, after: $answersAfter)
      @connection(key: "CommunityQuestionAnswers_answers") {
      edges {
        node {
          id
          ...ProductCommunityItems_answer
        }
      }
    }
  }
`;

export function CommunityQuestionAnswers({
  question: questionRef,
}: {
  question: CommunityQuestionAnswers_question$key;
}) {
  const { data, hasNext, isLoadingNext, loadNext } = usePaginationFragment<
    CommunityQuestionAnswersPaginationQuery,
    CommunityQuestionAnswers_question$key
  >(communityQuestionAnswersFragment, questionRef);
  const [paginationFailed, setPaginationFailed] = useState(false);
  const answers = data.answers.edges.map(({ node }) => node);
  const loadMore = () => {
    setPaginationFailed(false);
    loadNext(answerPageSize, {
      onComplete: (error) => setPaginationFailed(error !== null),
    });
  };

  return (
    <>
      {answers.map((answer) => (
        <AnswerView acceptedAnswerId={data.acceptedAnswerId} answer={answer} key={answer.id} />
      ))}
      {paginationFailed ? (
        <div role="alert">
          <p>More answers unavailable.</p>
          <Button disabled={isLoadingNext} onClick={loadMore} type="button">
            Retry answers
          </Button>
        </div>
      ) : hasNext ? (
        <Button disabled={isLoadingNext} onClick={loadMore} type="button" variant="link">
          {isLoadingNext ? "Loading more answers…" : "Show more answers"}
        </Button>
      ) : null}
    </>
  );
}
