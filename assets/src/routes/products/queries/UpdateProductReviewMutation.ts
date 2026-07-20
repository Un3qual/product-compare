import { graphql } from "react-relay";

export default graphql`
  mutation UpdateProductReviewMutation($input: UpdateProductReviewInput!) {
    updateProductReview(input: $input) {
      review { id moderationStatus }
      errors { code field message }
    }
  }
`;
