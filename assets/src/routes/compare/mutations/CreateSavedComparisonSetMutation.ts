import { graphql } from "react-relay";

export const createSavedComparisonSetMutation = graphql`
  mutation CreateSavedComparisonSetMutation($input: CreateSavedComparisonSetInput!) {
    createSavedComparisonSet(input: $input) {
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
