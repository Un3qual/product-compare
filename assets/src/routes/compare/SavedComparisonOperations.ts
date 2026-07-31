import { graphql } from "react-relay";

export const savedComparisonOperationsQuery = graphql`
  query SavedComparisonOperationsQuery($first: Int!, $after: String) {
    mySavedComparisonSets(first: $first, after: $after) {
      edges {
        node {
          id
          name
          items {
            position
            product {
              name
              slug
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const createSavedComparisonSetMutation = graphql`
  mutation SavedComparisonOperationsCreateSavedComparisonSetMutation(
    $input: CreateSavedComparisonSetInput!
  ) {
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

export const deleteSavedComparisonSetMutation = graphql`
  mutation SavedComparisonOperationsDeleteSavedComparisonSetMutation($savedComparisonSetId: ID!) {
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
