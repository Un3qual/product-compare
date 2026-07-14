import { graphql } from "react-relay";

export default graphql`
  mutation SubmitProductReviewMutation($input: SubmitProductReviewInput!) {
    submitProductReview(input: $input) {
      review { id moderationStatus }
      errors { code field message }
    }
  }
`;
