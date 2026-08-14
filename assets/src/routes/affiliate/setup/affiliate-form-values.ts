import type {
  AffiliateSetupOperationsCreateCouponMutation,
  CouponDiscountType,
} from "$generated/AffiliateSetupOperationsCreateCouponMutation.graphql";
import type { AffiliateSetupOperationsUpsertAffiliateLinkMutation } from "$generated/AffiliateSetupOperationsUpsertAffiliateLinkMutation.graphql";
import type { AffiliateSetupOperationsUpsertAffiliateNetworkMutation } from "$generated/AffiliateSetupOperationsUpsertAffiliateNetworkMutation.graphql";
import type { AffiliateSetupOperationsUpsertAffiliateProgramMutation } from "$generated/AffiliateSetupOperationsUpsertAffiliateProgramMutation.graphql";

export type AffiliateSetupFormValues = Readonly<Record<string, string | undefined>>;

export function buildNetworkVariables(
  formValues: AffiliateSetupFormValues,
): AffiliateSetupOperationsUpsertAffiliateNetworkMutation["variables"] {
  return {
    input: {
      name: requiredFormString(formValues, "networkName"),
    },
  };
}

export function buildProgramVariables(
  formValues: AffiliateSetupFormValues,
): AffiliateSetupOperationsUpsertAffiliateProgramMutation["variables"] {
  return {
    input: {
      affiliateNetworkId: requiredFormString(formValues, "affiliateNetworkId"),
      merchantId: requiredFormString(formValues, "merchantId"),
      programCode: optionalFormString(formValues, "programCode"),
      status: optionalFormString(formValues, "programStatus"),
    },
  };
}

export function buildLinkVariables(
  formValues: AffiliateSetupFormValues,
): AffiliateSetupOperationsUpsertAffiliateLinkMutation["variables"] {
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

export function buildCouponVariables(
  formValues: AffiliateSetupFormValues,
): AffiliateSetupOperationsCreateCouponMutation["variables"] {
  return {
    input: {
      merchantId: requiredFormString(formValues, "couponMerchantId"),
      affiliateNetworkId: optionalFormString(formValues, "couponAffiliateNetworkId"),
      artifactId: null,
      code: requiredFormString(formValues, "couponCode"),
      description: optionalFormString(formValues, "couponDescription"),
      discountType: couponDiscountType(requiredFormString(formValues, "discountType")),
      discountValue: optionalFormString(formValues, "discountValue"),
      currency: optionalCurrencyString(formValues, "currency"),
      validFrom: optionalDateTimeString(formValues, "validFrom"),
      validTo: optionalDateTimeString(formValues, "validTo"),
      terms: optionalFormString(formValues, "terms"),
    },
  };
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

function couponDiscountType(value: string): CouponDiscountType {
  switch (value) {
    case "AMOUNT":
    case "FREE_SHIPPING":
    case "PERCENT":
      return value;
    default:
      return "OTHER";
  }
}
