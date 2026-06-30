import { graphql } from "react-relay";

export const compareOfferContextQuery = graphql`
  query CompareOfferContextQuery($productId: ID!, $first: Int!) {
    merchantProducts(input: { productId: $productId, activeOnly: true, first: $first }) {
      edges {
        node {
          id
          currency
          merchant {
            id
            name
            domain
          }
          latestPrice {
            id
            price
            observedAt
          }
          activeCoupons(first: 2) {
            edges {
              node {
                code
                discountType
                discountValue
                currency
                validTo
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
        hasNextPage
      }
    }
  }
`;
