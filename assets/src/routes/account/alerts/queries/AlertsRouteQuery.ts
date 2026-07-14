import { graphql } from "react-relay";

export default graphql`
  query AlertsRouteQuery($first: Int!) {
    myAlertEvents(first: $first) {
      edges {
        node {
          id
          productName
          productSlug
          merchantName
          ruleType
          currency
          landedPrice
          observedAt
          readAt
        }
      }
      pageInfo {
        hasNextPage
      }
    }
    myPriceWatches(first: $first) {
      edges {
        node {
          id
          productName
          productSlug
          merchantName
          ruleType
          currency
          targetAmount
          percentageDrop
          baselineLandedPrice
          enabled
        }
      }
      pageInfo {
        hasNextPage
      }
    }
  }
`;
