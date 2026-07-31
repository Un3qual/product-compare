import { graphql } from "react-relay";

export const offerDiscoveryRouteQuery = graphql`
  query OfferDiscoveryRouteQuery(
    $after: String
    $first: Int!
    $input: MerchantProductsInput!
    $productId: ID!
  ) {
    selectedProduct: node(id: $productId) {
      __typename
      ... on Product {
        id
        name
        slug
        brand {
          id
          name
        }
      }
    }
    merchantProducts(after: $after, first: $first, input: $input) {
      edges {
        cursor
        node {
          id
          url
          currency
          lastSeenAt
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
