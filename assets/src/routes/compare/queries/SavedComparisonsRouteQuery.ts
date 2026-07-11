import { graphql } from "react-relay";

export const savedComparisonsRouteQuery = graphql`
  query SavedComparisonsRouteQuery($first: Int!, $after: String) {
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
