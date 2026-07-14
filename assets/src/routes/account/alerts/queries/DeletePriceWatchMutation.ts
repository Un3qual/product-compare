import { graphql } from "react-relay";

export default graphql`
  mutation DeletePriceWatchMutation($id: ID!) {
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
