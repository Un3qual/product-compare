import { graphql } from "react-relay";

export default graphql`
  mutation UpdatePriceWatchMutation($input: UpdatePriceWatchInput!) {
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
