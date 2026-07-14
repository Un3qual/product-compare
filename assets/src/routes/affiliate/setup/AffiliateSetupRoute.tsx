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
import { Pagination } from "../../../ui/components/navigation/Pagination";
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
  type NetworkResult,
  type ProgramResult
} from "./AffiliateSetupForms";
import { affiliateSetupLoader, type AffiliateSetupLoaderData } from "./loader";
import {
  buildCouponVariables,
  buildLinkVariables,
  buildMerchantChoices,
  buildNetworkVariables,
  buildProgramVariables,
  getMerchantChoiceById,
  getMerchantSummary
} from "./affiliate-setup-data";
import { affiliateSetupPagePath } from "./pagination";

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
            <AffiliateSetupPanel
              merchantPagination={loaderData.merchantPagination}
              merchantQuery={loaderData.merchantQuery}
            />
          </Suspense>
        </ResettableErrorBoundary>
      )}
    </PageShell>
  );
}

function AffiliateSetupPanel({
  merchantPagination,
  merchantQuery
}: {
  merchantPagination: Extract<AffiliateSetupLoaderData, { status: "ready" }>["merchantPagination"];
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
          variables: buildNetworkVariables(formDataToScalarValues(new FormData(event.currentTarget)))
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
          variables: buildProgramVariables(formDataToScalarValues(new FormData(event.currentTarget)))
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
          variables: buildLinkVariables(formDataToScalarValues(new FormData(event.currentTarget)))
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
          variables: buildCouponVariables(formDataToScalarValues(new FormData(event.currentTarget)))
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

      <Pagination
        firstHref={
          data.merchants.pageInfo.hasPreviousPage && merchantPagination.after
            ? affiliateSetupPagePath({ ...merchantPagination, after: null })
            : null
        }
        firstLabel="First merchants"
        label="Merchant choice pages"
        nextHref={
          data.merchants.pageInfo.hasNextPage && data.merchants.pageInfo.endCursor
            ? affiliateSetupPagePath({
                ...merchantPagination,
                after: data.merchants.pageInfo.endCursor
              })
            : null
        }
        nextLabel="Next merchants"
      />
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

function formDataToScalarValues(formData: FormData) {
  const values: Record<string, string> = {};

  formData.forEach((value, name) => {
    if (!(name in values)) {
      values[name] = typeof value === "string" ? value : "";
    }
  });

  return values;
}
