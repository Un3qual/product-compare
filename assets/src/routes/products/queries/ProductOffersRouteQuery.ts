import { graphql } from "react-relay";

export const productOffersRouteQuery = graphql`
  query ProductOffersRouteQuery($productId: ID!, $first: Int!, $after: String) {
    merchantProducts(input: { productId: $productId, activeOnly: true, first: $first, after: $after }) {
      edges {
        cursor
        node {
          id
          url
          currency
          merchant {
            id
            name
          }
          latestPrice {
            id
            price
          }
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
`;
