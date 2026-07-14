import { graphql } from "react-relay";

export default graphql`
  mutation CreatePriceWatchMutation($input: CreatePriceWatchInput!) {
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
