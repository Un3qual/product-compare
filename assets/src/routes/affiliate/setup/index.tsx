import { Suspense, type FormEvent, useRef, useState } from "react";
import { useLoaderData } from "react-router-dom";
import { useMutation, usePreloadedQuery } from "react-relay";
import createCouponMutation, {
  type CreateCouponMutation
} from "../../../__generated__/CreateCouponMutation.graphql";
import upsertAffiliateLinkMutation, {
  type UpsertAffiliateLinkMutation
} from "../../../__generated__/UpsertAffiliateLinkMutation.graphql";
import upsertAffiliateNetworkMutation, {
  type UpsertAffiliateNetworkMutation
} from "../../../__generated__/UpsertAffiliateNetworkMutation.graphql";
import upsertAffiliateProgramMutation, {
  type UpsertAffiliateProgramMutation
} from "../../../__generated__/UpsertAffiliateProgramMutation.graphql";
import affiliateSetupRouteQuery, {
  type AffiliateSetupRouteQuery
} from "../../../__generated__/AffiliateSetupRouteQuery.graphql";
import { useRoutePreloadedQuery } from "../../../relay/route-preload";
import { ResettableErrorBoundary } from "../../../relay/resettable-error-boundary";
import { commitRouteMutationPromise } from "../../relay-mutations";
import {
  DEFAULT_ROUTE_ERROR_MESSAGE,
  hasRouteGraphQLErrors,
  routeMutationErrorMessage
} from "../../route-errors";
import { affiliateSetupLoader, type AffiliateSetupLoaderData } from "./loader";

type MerchantChoice = {
  domain: string;
  id: string;
  name: string;
};

type NetworkResult = NonNullable<
  NonNullable<
    UpsertAffiliateNetworkMutation["response"]["upsertAffiliateNetwork"]
  >["network"]
>;

type ProgramResult = NonNullable<
  NonNullable<
    UpsertAffiliateProgramMutation["response"]["upsertAffiliateProgram"]
  >["program"]
>;

type LinkResult = NonNullable<
  NonNullable<UpsertAffiliateLinkMutation["response"]["upsertAffiliateLink"]>["link"]
>;

type CouponResult = NonNullable<
  NonNullable<CreateCouponMutation["response"]["createCoupon"]>["coupon"]
>;

type AffiliateSetupMerchantConnection = NonNullable<
  AffiliateSetupRouteQuery["response"]["merchants"]
>;

export function AffiliateSetupRoute() {
  const loaderData = useLoaderData<typeof affiliateSetupLoader>() as AffiliateSetupLoaderData;

  return (
    <section>
      <header>
        <h1>Affiliate setup</h1>
      </header>

      {loaderData.status === "error" ? (
        <AffiliateSetupUnavailableFallback />
      ) : (
        <ResettableErrorBoundary
          fallback={<AffiliateSetupUnavailableFallback />}
          resetToken={loaderData.merchantQuery}
        >
          <Suspense fallback={<p role="status">Loading affiliate setup...</p>}>
            <AffiliateSetupPanel merchantQuery={loaderData.merchantQuery} />
          </Suspense>
        </ResettableErrorBoundary>
      )}
    </section>
  );
}

function AffiliateSetupPanel({
  merchantQuery
}: {
  merchantQuery: Extract<AffiliateSetupLoaderData, { status: "ready" }>["merchantQuery"];
}) {
  const queryRef = useRoutePreloadedQuery<AffiliateSetupRouteQuery>(
    affiliateSetupRouteQuery,
    merchantQuery
  );
  const data = usePreloadedQuery<AffiliateSetupRouteQuery>(affiliateSetupRouteQuery, queryRef);

  if (!data.merchants) {
    return <AffiliateSetupUnavailableFallback />;
  }

  const merchantChoices = buildMerchantChoices(data.merchants);
  const [networkResult, setNetworkResult] = useState<NetworkResult | null>(null);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [networkPending, setNetworkPending] = useState(false);
  const networkInFlightRef = useRef(false);
  const [programResult, setProgramResult] = useState<ProgramResult | null>(null);
  const [programError, setProgramError] = useState<string | null>(null);
  const [programPending, setProgramPending] = useState(false);
  const programInFlightRef = useRef(false);
  const [linkResult, setLinkResult] = useState<LinkResult | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkPending, setLinkPending] = useState(false);
  const linkInFlightRef = useRef(false);
  const [couponResult, setCouponResult] = useState<CouponResult | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponPending, setCouponPending] = useState(false);
  const couponInFlightRef = useRef(false);
  const [affiliateNetworkId, setAffiliateNetworkId] = useState("");
  const [commitUpsertAffiliateNetwork] = useMutation<UpsertAffiliateNetworkMutation>(
    upsertAffiliateNetworkMutation
  );
  const [commitUpsertAffiliateProgram] = useMutation<UpsertAffiliateProgramMutation>(
    upsertAffiliateProgramMutation
  );
  const [commitUpsertAffiliateLink] = useMutation<UpsertAffiliateLinkMutation>(
    upsertAffiliateLinkMutation
  );
  const [commitCreateCoupon] = useMutation<CreateCouponMutation>(createCouponMutation);

  async function handleNetworkSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (networkInFlightRef.current) {
      return;
    }

    networkInFlightRef.current = true;
    setNetworkPending(true);
    setNetworkError(null);
    setNetworkResult(null);

    try {
      const { response, graphQLErrors } = await commitRouteMutationPromise(
        commitUpsertAffiliateNetwork,
        {
          variables: buildNetworkVariables(new FormData(event.currentTarget))
        }
      );
      const payload = response.upsertAffiliateNetwork;

      if (payload?.network && !hasRouteGraphQLErrors(graphQLErrors)) {
        setNetworkResult(payload.network);
        setAffiliateNetworkId(payload.network.id);
      } else {
        setNetworkError(routeMutationErrorMessage(payload?.errors, graphQLErrors));
      }
    } catch {
      setNetworkError(DEFAULT_ROUTE_ERROR_MESSAGE);
    } finally {
      networkInFlightRef.current = false;
      setNetworkPending(false);
    }
  }

  async function handleProgramSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (programInFlightRef.current) {
      return;
    }

    programInFlightRef.current = true;
    setProgramPending(true);
    setProgramError(null);
    setProgramResult(null);

    try {
      const { response, graphQLErrors } = await commitRouteMutationPromise(
        commitUpsertAffiliateProgram,
        {
          variables: buildProgramVariables(new FormData(event.currentTarget))
        }
      );
      const payload = response.upsertAffiliateProgram;

      if (payload?.program && !hasRouteGraphQLErrors(graphQLErrors)) {
        setProgramResult(payload.program);
      } else {
        setProgramError(routeMutationErrorMessage(payload?.errors, graphQLErrors));
      }
    } catch {
      setProgramError(DEFAULT_ROUTE_ERROR_MESSAGE);
    } finally {
      programInFlightRef.current = false;
      setProgramPending(false);
    }
  }

  async function handleLinkSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (linkInFlightRef.current) {
      return;
    }

    linkInFlightRef.current = true;
    setLinkPending(true);
    setLinkError(null);
    setLinkResult(null);

    try {
      const { response, graphQLErrors } = await commitRouteMutationPromise(
        commitUpsertAffiliateLink,
        {
          variables: buildLinkVariables(new FormData(event.currentTarget))
        }
      );
      const payload = response.upsertAffiliateLink;

      if (payload?.link && !hasRouteGraphQLErrors(graphQLErrors)) {
        setLinkResult(payload.link);
      } else {
        setLinkError(routeMutationErrorMessage(payload?.errors, graphQLErrors));
      }
    } catch {
      setLinkError(DEFAULT_ROUTE_ERROR_MESSAGE);
    } finally {
      linkInFlightRef.current = false;
      setLinkPending(false);
    }
  }

  async function handleCouponSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (couponInFlightRef.current) {
      return;
    }

    couponInFlightRef.current = true;
    setCouponPending(true);
    setCouponError(null);
    setCouponResult(null);

    try {
      const { response, graphQLErrors } = await commitRouteMutationPromise(
        commitCreateCoupon,
        {
          variables: buildCouponVariables(new FormData(event.currentTarget))
        }
      );
      const payload = response.createCoupon;

      if (payload?.coupon && !hasRouteGraphQLErrors(graphQLErrors)) {
        setCouponResult(payload.coupon);
      } else {
        setCouponError(routeMutationErrorMessage(payload?.errors, graphQLErrors));
      }
    } catch {
      setCouponError(DEFAULT_ROUTE_ERROR_MESSAGE);
    } finally {
      couponInFlightRef.current = false;
      setCouponPending(false);
    }
  }

  return (
    <>
      <form aria-label="Save affiliate network" method="post" onSubmit={handleNetworkSubmit}>
        <h2>Network</h2>
        <label>
          Network name
          <input autoComplete="off" name="networkName" type="text" />
        </label>
        <button disabled={networkPending} type="submit">
          Save network
        </button>
        {networkError ? <p role="alert">{networkError}</p> : null}
        {networkResult ? (
          <section aria-label="Affiliate network result">
            <h3>{networkResult.name}</h3>
            <p>{networkResult.id}</p>
          </section>
        ) : null}
      </form>

      {merchantChoices.length === 0 ? (
        <p role="status">No merchants available for affiliate setup yet.</p>
      ) : (
        <form aria-label="Save affiliate program" method="post" onSubmit={handleProgramSubmit}>
          <h2>Program</h2>
          <label>
            Affiliate network ID
            <input
              autoComplete="off"
              name="affiliateNetworkId"
              onChange={(event) => setAffiliateNetworkId(event.currentTarget.value)}
              type="text"
              value={affiliateNetworkId}
            />
          </label>
          <label>
            Merchant
            <select defaultValue={merchantChoices[0]?.id ?? ""} name="merchantId">
              {merchantChoices.map((merchant) => (
                <option key={merchant.id} value={merchant.id}>
                  {merchant.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Program code
            <input autoComplete="off" name="programCode" type="text" />
          </label>
          <label>
            Program status
            <input autoComplete="off" name="programStatus" type="text" />
          </label>
          <button disabled={programPending} type="submit">
            Save program
          </button>
          {programError ? <p role="alert">{programError}</p> : null}
          {programResult ? (
            <section aria-label="Affiliate program result">
              <h3>{programResult.programCode ?? "Affiliate program"}</h3>
              <p>{programResult.id}</p>
              {programResult.status ? <p>{programResult.status}</p> : null}
            </section>
          ) : null}
        </form>
      )}

      <form aria-label="Save affiliate link" method="post" onSubmit={handleLinkSubmit}>
        <h2>Link</h2>
        <label>
          Merchant product ID
          <input autoComplete="off" name="merchantProductId" type="text" />
        </label>
        <label>
          Link affiliate network ID
          <input autoComplete="off" name="linkAffiliateNetworkId" type="text" />
        </label>
        <label>
          Original URL
          <input autoComplete="off" name="originalUrl" type="url" />
        </label>
        <label>
          Affiliate URL
          <input autoComplete="off" name="affiliateUrl" type="url" />
        </label>
        <label>
          Last verified at
          <input name="lastVerifiedAt" type="datetime-local" />
        </label>
        <button disabled={linkPending} type="submit">
          Save link
        </button>
        {linkError ? <p role="alert">{linkError}</p> : null}
        {linkResult ? (
          <section aria-label="Affiliate link result">
            <h3>{linkResult.id}</h3>
            <p>{linkResult.affiliateUrl}</p>
          </section>
        ) : null}
      </form>

      {merchantChoices.length === 0 ? null : (
        <form aria-label="Create affiliate coupon" method="post" onSubmit={handleCouponSubmit}>
          <h2>Coupon</h2>
          <label>
            Coupon merchant
            <select defaultValue={merchantChoices[0]?.id ?? ""} name="couponMerchantId">
              {merchantChoices.map((merchant) => (
                <option key={merchant.id} value={merchant.id}>
                  {merchant.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Coupon affiliate network ID
            <input autoComplete="off" name="couponAffiliateNetworkId" type="text" />
          </label>
          <label>
            Coupon code
            <input autoComplete="off" name="couponCode" type="text" />
          </label>
          <label>
            Description
            <input autoComplete="off" name="couponDescription" type="text" />
          </label>
          <label>
            Discount type
            <select defaultValue="OTHER" name="discountType">
              <option value="OTHER">OTHER</option>
              <option value="PERCENT">PERCENT</option>
              <option value="AMOUNT">AMOUNT</option>
              <option value="FREE_SHIPPING">FREE_SHIPPING</option>
            </select>
          </label>
          <label>
            Discount value
            <input autoComplete="off" name="discountValue" type="text" />
          </label>
          <label>
            Currency
            <input autoComplete="off" maxLength={3} name="currency" type="text" />
          </label>
          <label>
            Valid from
            <input name="validFrom" type="datetime-local" />
          </label>
          <label>
            Valid to
            <input name="validTo" type="datetime-local" />
          </label>
          <label>
            Terms
            <input autoComplete="off" name="terms" type="text" />
          </label>
          <button disabled={couponPending} type="submit">
            Create coupon
          </button>
          {couponError ? <p role="alert">{couponError}</p> : null}
          {couponResult ? <CouponResultPanel coupon={couponResult} /> : null}
        </form>
      )}
    </>
  );
}

function CouponResultPanel({ coupon }: { coupon: CouponResult }) {
  const discountText = couponDiscountText(coupon);

  return (
    <section aria-label="Coupon result">
      <h3>{coupon.code}</h3>
      <p>{coupon.id}</p>
      {discountText ? <p>{discountText}</p> : null}
    </section>
  );
}

function couponDiscountText(coupon: CouponResult) {
  const value = coupon.discountValue == null ? null : String(coupon.discountValue);

  switch (coupon.discountType) {
    case "AMOUNT":
      return value && coupon.currency ? `${value} ${coupon.currency}` : null;
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

function AffiliateSetupUnavailableFallback() {
  return (
    <section role="alert">
      <p>Affiliate setup unavailable.</p>
    </section>
  );
}

function buildMerchantChoices(merchants: AffiliateSetupMerchantConnection): MerchantChoice[] {
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

function buildNetworkVariables(
  formData: FormData
): UpsertAffiliateNetworkMutation["variables"] {
  return {
    input: {
      name: requiredFormString(formData, "networkName")
    }
  };
}

function buildProgramVariables(
  formData: FormData
): UpsertAffiliateProgramMutation["variables"] {
  return {
    input: {
      affiliateNetworkId: requiredFormString(formData, "affiliateNetworkId"),
      merchantId: requiredFormString(formData, "merchantId"),
      programCode: optionalFormString(formData, "programCode"),
      status: optionalFormString(formData, "programStatus")
    }
  };
}

function buildLinkVariables(formData: FormData): UpsertAffiliateLinkMutation["variables"] {
  return {
    input: {
      merchantProductId: requiredFormString(formData, "merchantProductId"),
      affiliateNetworkId: optionalFormString(formData, "linkAffiliateNetworkId"),
      originalUrl: requiredFormString(formData, "originalUrl"),
      affiliateUrl: requiredFormString(formData, "affiliateUrl"),
      lastVerifiedAt: optionalDateTimeString(formData, "lastVerifiedAt")
    }
  };
}

function buildCouponVariables(formData: FormData): CreateCouponMutation["variables"] {
  return {
    input: {
      merchantId: requiredFormString(formData, "couponMerchantId"),
      affiliateNetworkId: optionalFormString(formData, "couponAffiliateNetworkId"),
      artifactId: null,
      code: requiredFormString(formData, "couponCode"),
      description: optionalFormString(formData, "couponDescription"),
      discountType: requiredFormString(formData, "discountType") as CreateCouponMutation["variables"]["input"]["discountType"],
      discountValue: optionalFormString(formData, "discountValue"),
      currency: optionalCurrencyString(formData, "currency"),
      validFrom: optionalDateTimeString(formData, "validFrom"),
      validTo: optionalDateTimeString(formData, "validTo"),
      terms: optionalFormString(formData, "terms")
    }
  };
}

function requiredFormString(formData: FormData, name: string) {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : "";
}

function optionalFormString(formData: FormData, name: string) {
  const value = requiredFormString(formData, name);

  return value || null;
}

function optionalCurrencyString(formData: FormData, name: string) {
  const value = optionalFormString(formData, name);

  return value ? value.toUpperCase() : null;
}

function optionalDateTimeString(formData: FormData, name: string) {
  const value = optionalFormString(formData, name);

  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
