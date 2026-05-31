import { graphql } from "react-relay";

export const deleteSavedComparisonSetMutation = graphql`
  mutation DeleteSavedComparisonSetMutation($savedComparisonSetId: ID!) {
    deleteSavedComparisonSet(savedComparisonSetId: $savedComparisonSetId) {
      savedComparisonSet {
        id
      }
      errors {
        code
        field
        message
      }
    }
  }
`;
