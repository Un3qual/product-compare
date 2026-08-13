import type {
  AffiliateSetupOperationsCreateCouponMutation,
  CouponDiscountType,
} from "$generated/AffiliateSetupOperationsCreateCouponMutation.graphql";
import type { AffiliateSetupOperationsUpsertAffiliateLinkMutation } from "$generated/AffiliateSetupOperationsUpsertAffiliateLinkMutation.graphql";
import type { AffiliateSetupOperationsUpsertAffiliateNetworkMutation } from "$generated/AffiliateSetupOperationsUpsertAffiliateNetworkMutation.graphql";
import type { AffiliateSetupOperationsUpsertAffiliateProgramMutation } from "$generated/AffiliateSetupOperationsUpsertAffiliateProgramMutation.graphql";
import type { AffiliateSetupRouteQuery } from "$generated/AffiliateSetupRouteQuery.graphql";
import {
  hasGraphQLErrors,
  mutationErrorMessage,
  type MutationGraphQLErrors,
} from "$relay/mutation-errors";

export type AffiliateSetupFormValues = Readonly<Record<string, string | undefined>>;

type MerchantConnection = NonNullable<AffiliateSetupRouteQuery["response"]["merchants"]>;
type MerchantNode = MerchantConnection["edges"][number]["node"];
export type MerchantChoice = Pick<MerchantNode, "domain" | "id" | "name">;
type MerchantChoiceConnection = {
  readonly edges: readonly { readonly node: MerchantChoice }[];
};
type NetworkPayload =
  AffiliateSetupOperationsUpsertAffiliateNetworkMutation["response"]["upsertAffiliateNetwork"];
type ProgramPayload =
  AffiliateSetupOperationsUpsertAffiliateProgramMutation["response"]["upsertAffiliateProgram"];
type LinkPayload =
  AffiliateSetupOperationsUpsertAffiliateLinkMutation["response"]["upsertAffiliateLink"];
type CouponPayload = AffiliateSetupOperationsCreateCouponMutation["response"]["createCoupon"];
type AffiliateMutationErrors = NonNullable<NetworkPayload>["errors"];
type Coupon = NonNullable<NonNullable<CouponPayload>["coupon"]>;

export type AffiliateCouponResultCopyFact = Pick<Coupon, "discountType"> &
  Partial<Pick<Coupon, "currency" | "discountValue">>;

export function resolveAffiliateNetworkMutationOutcome(
  payload: NetworkPayload,
  graphQLErrors: MutationGraphQLErrors = undefined,
) {
  return resolveAffiliateSetupMutationOutcome(payload?.network, payload?.errors, graphQLErrors);
}

export function resolveAffiliateProgramMutationOutcome(
  payload: ProgramPayload,
  graphQLErrors: MutationGraphQLErrors = undefined,
) {
  return resolveAffiliateSetupMutationOutcome(payload?.program, payload?.errors, graphQLErrors);
}

export function resolveAffiliateLinkMutationOutcome(
  payload: LinkPayload,
  graphQLErrors: MutationGraphQLErrors = undefined,
) {
  return resolveAffiliateSetupMutationOutcome(payload?.link, payload?.errors, graphQLErrors);
}

export function resolveAffiliateCouponMutationOutcome(
  payload: CouponPayload,
  graphQLErrors: MutationGraphQLErrors = undefined,
) {
  return resolveAffiliateSetupMutationOutcome(payload?.coupon, payload?.errors, graphQLErrors);
}

export function buildMerchantChoices(
  merchants: MerchantChoiceConnection | null | undefined,
): MerchantChoice[] {
  if (!merchants) {
    return [];
  }

  return merchants.edges.map(({ node }) => ({
    id: node.id,
    name: node.name,
    domain: node.domain,
  }));
}

export function getMerchantChoiceById(
  merchantChoices: readonly MerchantChoice[],
  merchantId: string,
) {
  return merchantChoices.find((merchant) => merchant.id === merchantId);
}

export function getMerchantSummary(merchantChoice?: MerchantChoice) {
  if (!merchantChoice) {
    return null;
  }

  return `${merchantChoice.name} (${merchantChoice.domain})`;
}

export function getAffiliateMerchantContext(
  merchantChoices: readonly MerchantChoice[],
  selectedMerchantId: string,
) {
  const selectedMerchant =
    getMerchantChoiceById(merchantChoices, selectedMerchantId) ?? merchantChoices[0];
  const summary = getMerchantSummary(selectedMerchant);

  return {
    currentMerchantCopy: summary ? `Current merchant: ${summary}` : null,
    selectedMerchantCopy: summary ? `Selected merchant: ${summary}` : null,
    selectedMerchantValue: selectedMerchant?.id ?? "",
  };
}

export function buildNetworkVariables(formValues: AffiliateSetupFormValues) {
  return {
    input: {
      name: requiredFormString(formValues, "networkName"),
    },
  };
}

export function buildProgramVariables(formValues: AffiliateSetupFormValues) {
  return {
    input: {
      affiliateNetworkId: requiredFormString(formValues, "affiliateNetworkId"),
      merchantId: requiredFormString(formValues, "merchantId"),
      programCode: optionalFormString(formValues, "programCode"),
      status: optionalFormString(formValues, "programStatus"),
    },
  };
}

export function buildLinkVariables(formValues: AffiliateSetupFormValues) {
  return {
    input: {
      merchantProductId: requiredFormString(formValues, "merchantProductId"),
      affiliateNetworkId: optionalFormString(formValues, "linkAffiliateNetworkId"),
      originalUrl: requiredFormString(formValues, "originalUrl"),
      affiliateUrl: requiredFormString(formValues, "affiliateUrl"),
      lastVerifiedAt: optionalDateTimeString(formValues, "lastVerifiedAt"),
    },
  };
}

export function buildCouponVariables(formValues: AffiliateSetupFormValues) {
  return {
    input: {
      merchantId: requiredFormString(formValues, "couponMerchantId"),
      affiliateNetworkId: optionalFormString(formValues, "couponAffiliateNetworkId"),
      artifactId: null,
      code: requiredFormString(formValues, "couponCode"),
      description: optionalFormString(formValues, "couponDescription"),
      discountType: requiredFormString(formValues, "discountType") as CouponDiscountType,
      discountValue: optionalFormString(formValues, "discountValue"),
      currency: optionalCurrencyString(formValues, "currency"),
      validFrom: optionalDateTimeString(formValues, "validFrom"),
      validTo: optionalDateTimeString(formValues, "validTo"),
      terms: optionalFormString(formValues, "terms"),
    },
  };
}

export function couponDiscountText(coupon: AffiliateCouponResultCopyFact) {
  const value = couponDiscountValue(coupon.discountValue);

  switch (coupon.discountType) {
    case "AMOUNT":
      return amountCouponDiscountText(value, coupon.currency);
    case "PERCENT":
      return value ? `${value}% off` : null;
    case "FREE_SHIPPING":
      return "Free shipping";
    case "OTHER":
      return value ? `${value} off` : "Other discount";
    default:
      return null;
  }
}

function couponDiscountValue(discountValue: string | null | undefined) {
  return discountValue ?? null;
}

function amountCouponDiscountText(value: string | null, currency: string | null | undefined) {
  return value && currency ? `${value} ${currency}` : null;
}

function requiredFormString(formValues: AffiliateSetupFormValues, name: string) {
  return formValues[name]?.trim() ?? "";
}

function optionalFormString(formValues: AffiliateSetupFormValues, name: string) {
  return requiredFormString(formValues, name) || null;
}

function optionalCurrencyString(formValues: AffiliateSetupFormValues, name: string) {
  const value = optionalFormString(formValues, name);

  return value ? value.toUpperCase() : null;
}

function optionalDateTimeString(formValues: AffiliateSetupFormValues, name: string) {
  const value = optionalFormString(formValues, name);

  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function resolveAffiliateSetupMutationOutcome<T extends object>(
  result: T | null | undefined,
  errors: AffiliateMutationErrors | undefined,
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
