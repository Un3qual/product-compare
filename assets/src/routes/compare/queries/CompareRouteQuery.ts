import { graphql } from "react-relay";

export const compareRouteQuery = graphql`
  query CompareRouteQuery(
    $slugs: [String!]!
    $offerFirst: Int!
    $pickerFirst: Int!
    $pickerAfter: String
  ) {
    comparisonProducts(slugs: $slugs) {
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
      merchantProducts(first: $offerFirst, activeOnly: true) {
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
          endCursor
          hasNextPage
        }
      }
    }
    products(first: $pickerFirst, after: $pickerAfter) {
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
