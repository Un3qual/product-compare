import { graphql } from "react-relay";

export const offerDiscoveryRouteQuery = graphql`
  query OfferDiscoveryRouteQuery($input: MerchantProductsInput!) {
    merchantProducts(input: $input) {
      edges {
        cursor
        node {
          id
          url
          currency
          isActive
          merchant {
            id
            name
            domain
          }
          product {
            id
            name
            slug
          }
          latestPrice {
            id
            price
            observedAt
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
        hasPreviousPage
      }
    }
  }
`;
