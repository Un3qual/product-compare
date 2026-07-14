import { graphql } from "react-relay";

export default graphql`
  mutation AnswerProductQuestionMutation($input: AnswerProductQuestionInput!) {
    answerProductQuestion(input: $input) {
      answer { id moderationStatus }
      errors { code field message }
    }
  }
`;
