import { Suspense, type FormEvent, useMemo, useRef, useState } from "react";
import * as stylex from "@stylexjs/stylex";
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
import { FeedbackState } from "../../../ui/components/feedback/feedback-state";
import { PageShell } from "../../../ui/components/layout/page-shell";
import { Button } from "../../../ui/primitives/button";
import { TextField } from "../../../ui/primitives/text-field";
import { tokens } from "../../../ui/theme/tokens.stylex";
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

const styles = stylex.create({
  form: {
    backgroundColor: tokens.surfaceMuted,
    borderColor: tokens.borderQuiet,
    borderRadius: "var(--radius-4)",
    borderStyle: "solid",
    borderWidth: "1px",
    display: "grid",
    gap: "1rem",
    gridTemplateColumns: "repeat(auto-fit, minmax(14rem, 1fr))",
    padding: "1.15rem"
  }
});

export function AffiliateSetupRoute() {
  const loaderData = useLoaderData<typeof affiliateSetupLoader>() as AffiliateSetupLoaderData;

  return (
    <PageShell
      description="Configure the networks, merchant programs, tracked links, and coupons that power affiliate commerce."
      eyebrow="Commerce operations"
      title="Affiliate setup"
    >
      {loaderData.status === "error" ? (
        <AffiliateSetupUnavailableFallback />
      ) : (
        <ResettableErrorBoundary
          fallback={<AffiliateSetupUnavailableFallback />}
          resetToken={loaderData.merchantQuery}
        >
          <Suspense fallback={<FeedbackState kind="loading" title="Loading affiliate setup..." />}>
            <AffiliateSetupPanel merchantQuery={loaderData.merchantQuery} />
          </Suspense>
        </ResettableErrorBoundary>
      )}
    </PageShell>
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
  const [selectedMerchantId, setSelectedMerchantId] = useState("");
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

  const merchantChoices = useMemo(
    () => buildMerchantChoices(data.merchants),
    [data.merchants]
  );
  const selectedMerchant = useMemo(
    () => getMerchantChoiceById(merchantChoices, selectedMerchantId) ?? merchantChoices[0],
    [merchantChoices, selectedMerchantId]
  );

  if (!data.merchants) {
    return <AffiliateSetupUnavailableFallback />;
  }

  const selectedMerchantSummary = getMerchantSummary(selectedMerchant);
  const selectedMerchantValue = selectedMerchant?.id ?? "";

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
      <form aria-label="Save affiliate network" method="post" onSubmit={handleNetworkSubmit} {...stylex.props(styles.form)}>
        <h2>Network</h2>
        <label>
          Network name
          <TextField autoComplete="off" name="networkName" type="text" />
        </label>
        <Button disabled={networkPending} type="submit">
          Save network
        </Button>
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
        <form aria-label="Save affiliate program" method="post" onSubmit={handleProgramSubmit} {...stylex.props(styles.form)}>
          <h2>Program</h2>
          {selectedMerchantSummary ? (
            <p>{`Selected merchant: ${selectedMerchantSummary}`}</p>
          ) : null}
          <label>
            Affiliate network ID
            <TextField
              autoComplete="off"
              name="affiliateNetworkId"
              onChange={(event) => setAffiliateNetworkId(event.currentTarget.value)}
              type="text"
              value={affiliateNetworkId}
            />
          </label>
          <label>
            Merchant
            <select
              name="merchantId"
              onChange={(event) => setSelectedMerchantId(event.currentTarget.value)}
              value={selectedMerchantValue}
            >
              {merchantChoices.map((merchant) => (
                <option key={merchant.id} value={merchant.id}>
                  {merchant.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Program code
            <TextField autoComplete="off" name="programCode" type="text" />
          </label>
          <label>
            Program status
            <TextField autoComplete="off" name="programStatus" type="text" />
          </label>
          <Button disabled={programPending} type="submit">
            Save program
          </Button>
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

      <form aria-label="Save affiliate link" method="post" onSubmit={handleLinkSubmit} {...stylex.props(styles.form)}>
        <h2>Link</h2>
        {selectedMerchantSummary ? (
          <p>{`Selected merchant: ${selectedMerchantSummary}`}</p>
        ) : null}
        <label>
          Merchant product ID
          <TextField autoComplete="off" name="merchantProductId" type="text" />
        </label>
        <label>
          Link affiliate network ID
          <TextField autoComplete="off" name="linkAffiliateNetworkId" type="text" />
        </label>
        <label>
          Original URL
          <TextField autoComplete="off" name="originalUrl" type="url" />
        </label>
        <label>
          Affiliate URL
          <TextField autoComplete="off" name="affiliateUrl" type="url" />
        </label>
        <label>
          Last verified at
          <input name="lastVerifiedAt" type="datetime-local" />
        </label>
        <Button disabled={linkPending} type="submit">
          Save link
        </Button>
        {linkError ? <p role="alert">{linkError}</p> : null}
        {linkResult ? (
          <section aria-label="Affiliate link result">
            <h3>{linkResult.id}</h3>
            <p>{linkResult.affiliateUrl}</p>
          </section>
        ) : null}
      </form>

      {merchantChoices.length === 0 ? null : (
        <form aria-label="Create affiliate coupon" method="post" onSubmit={handleCouponSubmit} {...stylex.props(styles.form)}>
          <h2>Coupon</h2>
          {selectedMerchantSummary ? (
            <p>{`Selected merchant: ${selectedMerchantSummary}`}</p>
          ) : null}
          <label>
            Coupon merchant
            <select
              name="couponMerchantId"
              onChange={(event) => setSelectedMerchantId(event.currentTarget.value)}
              value={selectedMerchantValue}
            >
              {merchantChoices.map((merchant) => (
                <option key={merchant.id} value={merchant.id}>
                  {merchant.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Coupon affiliate network ID
            <TextField autoComplete="off" name="couponAffiliateNetworkId" type="text" />
          </label>
          <label>
            Coupon code
            <TextField autoComplete="off" name="couponCode" type="text" />
          </label>
          <label>
            Description
            <TextField autoComplete="off" name="couponDescription" type="text" />
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
            <TextField autoComplete="off" name="discountValue" type="text" />
          </label>
          <label>
            Currency
            <TextField autoComplete="off" maxLength={3} name="currency" type="text" />
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
            <TextField autoComplete="off" name="terms" type="text" />
          </label>
          <Button disabled={couponPending} type="submit">
            Create coupon
          </Button>
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

function buildMerchantChoices(
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

function getMerchantChoiceById(merchantChoices: MerchantChoice[], merchantId: string) {
  return merchantChoices.find((merchant) => merchant.id === merchantId);
}

function getMerchantSummary(merchantChoice: MerchantChoice | undefined) {
  if (!merchantChoice) {
    return null;
  }

  return `${merchantChoice.name} (${merchantChoice.domain})`;
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
