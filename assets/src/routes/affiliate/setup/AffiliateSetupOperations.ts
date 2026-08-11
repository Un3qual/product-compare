import { graphql } from "react-relay";

export const affiliateSetupOperationsQuery = graphql`
  query AffiliateSetupOperationsQuery($first: Int!, $after: String) {
    merchants(first: $first, after: $after) {
      edges {
        cursor
        node {
          id
          name
          ...MerchantDirectoryView_item
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`;

export const createCouponMutation = graphql`
  mutation AffiliateSetupOperationsCreateCouponMutation($input: CreateCouponInput!) {
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
  mutation AffiliateSetupOperationsUpsertAffiliateLinkMutation($input: UpsertAffiliateLinkInput!) {
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
  mutation AffiliateSetupOperationsUpsertAffiliateNetworkMutation(
    $input: UpsertAffiliateNetworkInput!
  ) {
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
  mutation AffiliateSetupOperationsUpsertAffiliateProgramMutation(
    $input: UpsertAffiliateProgramInput!
  ) {
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
