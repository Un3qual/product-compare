import { graphql } from "react-relay";

export default graphql`
  mutation UpdateProductQuestionMutation($input: UpdateProductQuestionInput!) {
    updateProductQuestion(input: $input) {
      question { id moderationStatus }
      errors { code field message }
    }
  }
`;
