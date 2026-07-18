import {
  hasRouteGraphQLErrors,
  routeMutationErrorMessage
} from "../../route-errors";

export type AffiliateSetupFormValues = Readonly<Record<string, string | undefined>>;

export type MerchantChoice = {
  domain: string;
  id: string;
  name: string;
};

type AffiliateSetupMerchantNode = {
  domain?: string | null;
  id?: string | null;
  name?: string | null;
};

type AffiliateSetupMerchantConnection = {
  edges: readonly {
    node?: AffiliateSetupMerchantNode | null;
  }[];
};

export type AffiliateCouponDiscountType =
  | "AMOUNT"
  | "FREE_SHIPPING"
  | "OTHER"
  | "PERCENT"
  | "%future added value";

export type AffiliateCouponResultCopyFact = {
  readonly currency?: string | null;
  readonly discountType: string;
  readonly discountValue?: unknown | null;
};

type AffiliateSetupMutationPayload = {
  readonly errors?: unknown;
};

export type AffiliateSetupMutationOutcome<T> =
  | { readonly error: null; readonly result: T }
  | { readonly error: string; readonly result: null };

export function resolveAffiliateNetworkMutationOutcome<T extends object>(
  payload:
    | (AffiliateSetupMutationPayload & { readonly network?: T | null })
    | null
    | undefined,
  graphQLErrors?: readonly unknown[] | null
) {
  return resolveAffiliateSetupMutationOutcome(payload?.network, payload?.errors, graphQLErrors);
}

export function resolveAffiliateProgramMutationOutcome<T extends object>(
  payload:
    | (AffiliateSetupMutationPayload & { readonly program?: T | null })
    | null
    | undefined,
  graphQLErrors?: readonly unknown[] | null
) {
  return resolveAffiliateSetupMutationOutcome(payload?.program, payload?.errors, graphQLErrors);
}

export function resolveAffiliateLinkMutationOutcome<T extends object>(
  payload:
    | (AffiliateSetupMutationPayload & { readonly link?: T | null })
    | null
    | undefined,
  graphQLErrors?: readonly unknown[] | null
) {
  return resolveAffiliateSetupMutationOutcome(payload?.link, payload?.errors, graphQLErrors);
}

export function resolveAffiliateCouponMutationOutcome<T extends object>(
  payload:
    | (AffiliateSetupMutationPayload & { readonly coupon?: T | null })
    | null
    | undefined,
  graphQLErrors?: readonly unknown[] | null
) {
  return resolveAffiliateSetupMutationOutcome(payload?.coupon, payload?.errors, graphQLErrors);
}

export function buildMerchantChoices(
  merchants: AffiliateSetupMerchantConnection | null | undefined
): MerchantChoice[] {
  if (!merchants) {
    return [];
  }

  return merchants.edges.flatMap(({ node }) => {
    if (!node?.id || !node.name || !node.domain) {
      return [];
    }

    return [
      {
        id: node.id,
        name: node.name,
        domain: node.domain
      }
    ];
  });
}

export function getMerchantChoiceById(merchantChoices: MerchantChoice[], merchantId: string) {
  return merchantChoices.find((merchant) => merchant.id === merchantId);
}

export function getMerchantSummary(merchantChoice?: MerchantChoice) {
  if (!merchantChoice) {
    return null;
  }

  return `${merchantChoice.name} (${merchantChoice.domain})`;
}

export function buildNetworkVariables(formValues: AffiliateSetupFormValues) {
  return {
    input: {
      name: requiredFormString(formValues, "networkName")
    }
  };
}

export function buildProgramVariables(formValues: AffiliateSetupFormValues) {
  return {
    input: {
      affiliateNetworkId: requiredFormString(formValues, "affiliateNetworkId"),
      merchantId: requiredFormString(formValues, "merchantId"),
      programCode: optionalFormString(formValues, "programCode"),
      status: optionalFormString(formValues, "programStatus")
    }
  };
}

export function buildLinkVariables(formValues: AffiliateSetupFormValues) {
  return {
    input: {
      merchantProductId: requiredFormString(formValues, "merchantProductId"),
      affiliateNetworkId: optionalFormString(formValues, "linkAffiliateNetworkId"),
      originalUrl: requiredFormString(formValues, "originalUrl"),
      affiliateUrl: requiredFormString(formValues, "affiliateUrl"),
      lastVerifiedAt: optionalDateTimeString(formValues, "lastVerifiedAt")
    }
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
      discountType: requiredFormString(formValues, "discountType") as AffiliateCouponDiscountType,
      discountValue: optionalFormString(formValues, "discountValue"),
      currency: optionalCurrencyString(formValues, "currency"),
      validFrom: optionalDateTimeString(formValues, "validFrom"),
      validTo: optionalDateTimeString(formValues, "validTo"),
      terms: optionalFormString(formValues, "terms")
    }
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

function couponDiscountValue(discountValue: unknown | null | undefined) {
  return discountValue == null ? null : String(discountValue);
}

function amountCouponDiscountText(
  value: string | null,
  currency: string | null | undefined
) {
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
  errors: unknown,
  graphQLErrors?: readonly unknown[] | null
): AffiliateSetupMutationOutcome<T> {
  if (result && !hasRouteGraphQLErrors(graphQLErrors)) {
    return { error: null, result };
  }

  return {
    error: routeMutationErrorMessage(errors, graphQLErrors),
    result: null
  };
}
