import { graphql } from "react-relay";

export default graphql`
  mutation UpdateProductAnswerMutation($input: UpdateProductAnswerInput!) {
    updateProductAnswer(input: $input) {
      answer { id moderationStatus }
      errors { code field message }
    }
  }
`;
