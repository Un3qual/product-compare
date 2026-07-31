import { graphql } from "react-relay";

export const deletePriceWatchMutation = graphql`
  mutation alertsMutationsDeletePriceWatchMutation($id: ID!) {
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
  mutation alertsMutationsMarkAlertReadMutation($id: ID!) {
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
  mutation alertsMutationsUpdatePriceWatchMutation($input: UpdatePriceWatchInput!) {
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
