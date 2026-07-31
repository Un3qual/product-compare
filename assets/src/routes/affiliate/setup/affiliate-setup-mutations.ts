import { graphql } from "react-relay";

export const createCouponMutation = graphql`
  mutation affiliateSetupMutationsCreateCouponMutation($input: CreateCouponInput!) {
    createCoupon(input: $input) {
      coupon {
        id
        merchantId
        affiliateNetworkId
        code
        discountType
        discountValue
        currency
        validFrom
        validTo
      }
      errors {
        code
        field
        message
      }
    }
  }
`;

export const upsertAffiliateLinkMutation = graphql`
  mutation affiliateSetupMutationsUpsertAffiliateLinkMutation($input: UpsertAffiliateLinkInput!) {
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

export const upsertAffiliateNetworkMutation = graphql`
  mutation affiliateSetupMutationsUpsertAffiliateNetworkMutation($input: UpsertAffiliateNetworkInput!) {
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

export const upsertAffiliateProgramMutation = graphql`
  mutation affiliateSetupMutationsUpsertAffiliateProgramMutation($input: UpsertAffiliateProgramInput!) {
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
