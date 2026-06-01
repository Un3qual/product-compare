import { graphql } from "react-relay";

export default graphql`
  mutation UpsertAffiliateProgramMutation($input: UpsertAffiliateProgramInput!) {
    upsertAffiliateProgram(input: $input) {
      program {
        id
        affiliateNetworkId
        merchantId
        programCode
        status
      }
      errors {
        code
        field
        message
      }
    }
  }
`;
