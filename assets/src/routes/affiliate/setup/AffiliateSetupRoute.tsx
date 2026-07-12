import { Suspense, type FormEvent, useMemo, useRef, useState } from "react";
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
import { ResettableErrorBoundary } from "../../../relay/ResettableErrorBoundary";
import { FeedbackState } from "../../../ui/components/feedback/FeedbackState";
import { ContextRail } from "../../../ui/components/layout/ContextRail";
import { PageShell } from "../../../ui/components/layout/PageShell";
import { WorkspaceLayout } from "../../../ui/components/layout/WorkspaceLayout";
import { commitRouteMutationPromise } from "../../relay-mutations";
import {
  DEFAULT_ROUTE_ERROR_MESSAGE,
  hasRouteGraphQLErrors,
  routeMutationErrorMessage
} from "../../route-errors";
import {
  AffiliateCouponForm,
  AffiliateLinkForm,
  AffiliateNetworkForm,
  AffiliateProgramForm,
  type CouponResult,
  type LinkResult,
  type MerchantChoice,
  type NetworkResult,
  type ProgramResult
} from "./AffiliateSetupForms";
import { affiliateSetupLoader, type AffiliateSetupLoaderData } from "./loader";

type AffiliateSetupMerchantConnection = NonNullable<
  AffiliateSetupRouteQuery["response"]["merchants"]
>;

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
    <WorkspaceLayout
      context={
        <ContextRail
          description="Work from network identity through the merchant-facing assets that depend on it."
          label="Setup sequence"
        >
          <ol>
            <li>Save the affiliate network.</li>
            <li>Connect a merchant program.</li>
            <li>Register a tracked link.</li>
            <li>Add an eligible coupon.</li>
          </ol>
          {selectedMerchantSummary ? <p>{`Current merchant: ${selectedMerchantSummary}`}</p> : null}
        </ContextRail>
      }
      label="Affiliate configuration workflow"
    >
      <AffiliateNetworkForm
        error={networkError}
        onSubmit={handleNetworkSubmit}
        pending={networkPending}
        result={networkResult}
      />

      {merchantChoices.length === 0 ? (
        <p role="status">No merchants available for affiliate setup yet.</p>
      ) : (
        <AffiliateProgramForm
          affiliateNetworkId={affiliateNetworkId}
          error={programError}
          merchantChoices={merchantChoices}
          onAffiliateNetworkIdChange={setAffiliateNetworkId}
          onSelectedMerchantIdChange={setSelectedMerchantId}
          onSubmit={handleProgramSubmit}
          pending={programPending}
          result={programResult}
          selectedMerchantSummary={selectedMerchantSummary}
          selectedMerchantValue={selectedMerchantValue}
        />
      )}

      <AffiliateLinkForm
        error={linkError}
        onSubmit={handleLinkSubmit}
        pending={linkPending}
        result={linkResult}
        selectedMerchantSummary={selectedMerchantSummary}
      />

      {merchantChoices.length === 0 ? null : (
        <AffiliateCouponForm
          error={couponError}
          merchantChoices={merchantChoices}
          onSelectedMerchantIdChange={setSelectedMerchantId}
          onSubmit={handleCouponSubmit}
          pending={couponPending}
          result={couponResult}
          selectedMerchantSummary={selectedMerchantSummary}
          selectedMerchantValue={selectedMerchantValue}
        />
      )}
    </WorkspaceLayout>
  );
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
