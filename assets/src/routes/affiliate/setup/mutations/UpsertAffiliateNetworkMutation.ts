import { graphql } from "react-relay";

export default graphql`
  mutation UpsertAffiliateNetworkMutation($input: UpsertAffiliateNetworkInput!) {
    upsertAffiliateNetwork(input: $input) {
      network {
        id
        name
      }
      errors {
        code
        field
        message
      }
    }
  }
`;
