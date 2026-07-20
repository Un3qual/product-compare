import { graphql } from "react-relay";

export default graphql`
  mutation UpdateProductQuestionMutation($input: UpdateProductQuestionInput!) {
    updateProductQuestion(input: $input) {
      question {
        id
        title
        body
        moderationStatus
      }
      errors { code field message }
    }
  }
`;
