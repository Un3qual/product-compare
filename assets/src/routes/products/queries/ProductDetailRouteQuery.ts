import { graphql } from "react-relay";

export const productDetailRouteQuery = graphql`
  query ProductDetailRouteQuery($slug: String!, $offerFirst: Int!, $offersAfter: String) {
    product(slug: $slug) {
      id
      name
      slug
      description
      brand {
        id
        name
      }
      currentAttributes {
        attributeId
        code
        displayName
        dataType
        valueText
        sortOrder
        groupLabel
        isRequired
        numericValue
        booleanValue
        enumOptionId
        unitSymbol
      }
      merchantProducts(first: $offerFirst, after: $offersAfter, activeOnly: true) {
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
        }
      }
    }
  }
`;
