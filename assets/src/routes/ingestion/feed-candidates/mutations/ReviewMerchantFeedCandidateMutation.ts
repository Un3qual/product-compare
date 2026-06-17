import { graphql } from "react-relay";

export default graphql`
  mutation ReviewMerchantFeedCandidateMutation(
    $input: ReviewMerchantFeedCandidateInput!
  ) {
    reviewMerchantFeedCandidate(input: $input) {
      candidate {
        id
        reviewStatus
        reviewNote
        reviewedAt
      }
      errors {
        code
        field
        message
      }
    }
  }
`;
