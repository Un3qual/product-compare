import { graphql } from "react-relay";

export const compareProductPickerQuery = graphql`
  query CompareProductPickerQuery($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      edges {
        node {
          id
          name
          slug
          brand {
            id
            name
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
