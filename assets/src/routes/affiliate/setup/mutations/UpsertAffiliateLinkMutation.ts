import { graphql } from "react-relay";

export default graphql`
  mutation UpsertAffiliateLinkMutation($input: UpsertAffiliateLinkInput!) {
    upsertAffiliateLink(input: $input) {
      link {
        id
        merchantProductId
        affiliateNetworkId
        originalUrl
        affiliateUrl
        lastVerifiedAt
      }
      errors {
        code
        field
        message
      }
    }
  }
`;
