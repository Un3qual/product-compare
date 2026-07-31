import { graphql } from "react-relay";

export const alertOperationsQuery = graphql`
  query AlertOperationsQuery($first: Int!) {
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

export const createPriceWatchMutation = graphql`
  mutation AlertOperationsCreatePriceWatchMutation($input: CreatePriceWatchInput!) {
    createPriceWatch(input: $input) {
      watch {
        id
        productName
        ruleType
        currency
        targetAmount
        percentageDrop
        enabled
      }
      errors {
        code
        field
        message
      }
    }
  }
`;

export const deletePriceWatchMutation = graphql`
  mutation AlertOperationsDeletePriceWatchMutation($id: ID!) {
    deletePriceWatch(id: $id) {
      deletedWatchId
      errors {
        code
        field
        message
      }
    }
  }
`;

export const markAlertReadMutation = graphql`
  mutation AlertOperationsMarkAlertReadMutation($id: ID!) {
    markAlertRead(id: $id) {
      event {
        id
        readAt
      }
      errors {
        code
        field
        message
      }
    }
  }
`;

export const updatePriceWatchMutation = graphql`
  mutation AlertOperationsUpdatePriceWatchMutation($input: UpdatePriceWatchInput!) {
    updatePriceWatch(input: $input) {
      watch {
        id
        enabled
      }
      errors {
        code
        field
        message
      }
    }
  }
`;
