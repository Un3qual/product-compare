import { graphql } from "react-relay";

export const browseProductsRouteQuery = graphql`
  query BrowseProductsRouteQuery(
    $first: Int!
    $after: String
    $filters: ProductFiltersInput
  ) {
    products(first: $first, after: $after, filters: $filters) {
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
          currentAttributes {
            code
            displayName
            valueText
            sortOrder
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
