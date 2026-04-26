import { graphql } from "react-relay";

export const browseProductsRouteQuery = graphql`
  query BrowseProductsRouteQuery($first: Int!, $after: String) {
    products(first: $first, after: $after) @connection(key: "BrowseProductsRouteQuery_products") {
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
