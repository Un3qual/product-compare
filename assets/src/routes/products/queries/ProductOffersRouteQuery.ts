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
          activeCoupons(first: 2) {
            edges {
              cursor
              node {
                code
                description
                discountType
                discountValue
                currency
                validTo
                terms
              }
            }
            pageInfo {
              hasNextPage
            }
          }
          priceHistory(first: 3) {
            edges {
              node {
                id
                price
                observedAt
              }
            }
            pageInfo {
              hasNextPage
            }
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
