import { graphql } from "react-relay";

export default graphql`
  mutation UpdateProductReviewMutation($input: UpdateProductReviewInput!) {
    updateProductReview(input: $input) {
      review {
        id
        rating
        title
        body
        moderationStatus
      }
      errors { code field message }
    }
  }
`;
