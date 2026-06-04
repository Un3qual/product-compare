import { graphql } from "react-relay";

export const browseProductsRouteQuery = graphql`
  query BrowseProductsRouteQuery($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      edges {
        cursor
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
