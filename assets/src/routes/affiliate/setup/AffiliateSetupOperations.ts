import { graphql } from "react-relay";
import type { AffiliateSetupOperationsCreateCouponMutation } from "$generated/AffiliateSetupOperationsCreateCouponMutation.graphql";
import type { AffiliateSetupOperationsUpsertAffiliateLinkMutation } from "$generated/AffiliateSetupOperationsUpsertAffiliateLinkMutation.graphql";
import type { AffiliateSetupOperationsUpsertAffiliateNetworkMutation } from "$generated/AffiliateSetupOperationsUpsertAffiliateNetworkMutation.graphql";
import type { AffiliateSetupOperationsUpsertAffiliateProgramMutation } from "$generated/AffiliateSetupOperationsUpsertAffiliateProgramMutation.graphql";
import {
  hasGraphQLErrors,
  mutationErrorMessage,
  type MutationGraphQLErrors,
} from "$relay/mutation-errors";

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

type NetworkPayload =
  AffiliateSetupOperationsUpsertAffiliateNetworkMutation["response"]["upsertAffiliateNetwork"];
type ProgramPayload =
  AffiliateSetupOperationsUpsertAffiliateProgramMutation["response"]["upsertAffiliateProgram"];
type LinkPayload =
  AffiliateSetupOperationsUpsertAffiliateLinkMutation["response"]["upsertAffiliateLink"];
type CouponPayload =
  AffiliateSetupOperationsCreateCouponMutation["response"]["createCoupon"];
type AffiliateMutationErrors = NonNullable<NetworkPayload>["errors"];

export function resolveAffiliateNetworkMutationOutcome(
  payload: NetworkPayload,
  graphQLErrors: MutationGraphQLErrors = null,
) {
  return resolveAffiliateSetupMutationOutcome(
    payload?.network ?? null,
    payload?.errors ?? [],
    graphQLErrors,
  );
}

export function resolveAffiliateProgramMutationOutcome(
  payload: ProgramPayload,
  graphQLErrors: MutationGraphQLErrors = null,
) {
  return resolveAffiliateSetupMutationOutcome(
    payload?.program ?? null,
    payload?.errors ?? [],
    graphQLErrors,
  );
}

export function resolveAffiliateLinkMutationOutcome(
  payload: LinkPayload,
  graphQLErrors: MutationGraphQLErrors = null,
) {
  return resolveAffiliateSetupMutationOutcome(
    payload?.link ?? null,
    payload?.errors ?? [],
    graphQLErrors,
  );
}

export function resolveAffiliateCouponMutationOutcome(
  payload: CouponPayload,
  graphQLErrors: MutationGraphQLErrors = null,
) {
  return resolveAffiliateSetupMutationOutcome(
    payload?.coupon ?? null,
    payload?.errors ?? [],
    graphQLErrors,
  );
}

function resolveAffiliateSetupMutationOutcome<T extends object>(
  result: T | null,
  errors: AffiliateMutationErrors,
  graphQLErrors: MutationGraphQLErrors,
) {
  if (result && !hasGraphQLErrors(graphQLErrors)) {
    return { error: null, result };
  }

  return {
    error: mutationErrorMessage(errors, graphQLErrors),
    result: null,
  };
}
