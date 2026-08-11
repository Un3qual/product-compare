import { Suspense, type FormEvent, useMemo, useRef, useState } from "react";
import { useLoaderData, type LoaderFunctionArgs } from "react-router-dom";
import { graphql, useMutation, usePreloadedQuery } from "react-relay";
import type { AffiliateSetupOperationsCreateCouponMutation } from "../../../__generated__/AffiliateSetupOperationsCreateCouponMutation.graphql";
import type { AffiliateSetupOperationsUpsertAffiliateLinkMutation } from "../../../__generated__/AffiliateSetupOperationsUpsertAffiliateLinkMutation.graphql";
import type { AffiliateSetupOperationsUpsertAffiliateNetworkMutation } from "../../../__generated__/AffiliateSetupOperationsUpsertAffiliateNetworkMutation.graphql";
import type { AffiliateSetupOperationsUpsertAffiliateProgramMutation } from "../../../__generated__/AffiliateSetupOperationsUpsertAffiliateProgramMutation.graphql";
import type { AffiliateSetupRouteQuery } from "$generated/AffiliateSetupRouteQuery.graphql";
import {
  getRelayEnvironmentFromRouterContext,
  preloadRouteQuery,
  useRoutePreloadedQuery,
  type RelayRouteQueryDescriptor,
} from "$relay/route-preload";
import { ResettableErrorBoundary } from "../../../relay/ResettableErrorBoundary";
import { FeedbackState } from "../../../ui/components/feedback/FeedbackState";
import { ContextRail } from "../../../ui/components/layout/ContextRail";
import { PageShell } from "../../../ui/components/layout/PageShell";
import { WorkspaceLayout } from "../../../ui/components/layout/WorkspaceLayout";
import { Pagination } from "../../../ui/components/navigation/Pagination";
import { recoverRouteLoaderError } from "../../loader-errors";
import { merchantPaginationFromUrl } from "../../merchants/pagination";
import { commitRouteMutationPromise } from "../../relay-mutations";
import { DEFAULT_ROUTE_ERROR_MESSAGE } from "../../route-errors";
import {
  AffiliateCouponForm,
  AffiliateLinkForm,
  AffiliateNetworkForm,
  AffiliateProgramForm,
  type CouponResult,
  type LinkResult,
  type NetworkResult,
  type ProgramResult,
} from "./AffiliateSetupForms";
import {
  createCouponMutation,
  upsertAffiliateLinkMutation,
  upsertAffiliateNetworkMutation,
  upsertAffiliateProgramMutation,
} from "./AffiliateSetupOperations";
import {
  buildCouponVariables,
  buildLinkVariables,
  buildMerchantChoices,
  buildNetworkVariables,
  buildProgramVariables,
  getAffiliateMerchantContext,
  resolveAffiliateCouponMutationOutcome,
  resolveAffiliateLinkMutationOutcome,
  resolveAffiliateNetworkMutationOutcome,
  resolveAffiliateProgramMutationOutcome,
} from "./affiliate-setup-data";
import {
  buildAffiliateSetupPaginationData,
  type AffiliateSetupMerchantPagination,
} from "./pagination";

const affiliateSetupRouteQuery = graphql`
  query AffiliateSetupRouteQuery($first: Int!, $after: String) {
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

export type AffiliateSetupLoaderData =
  | {
      status: "ready";
      merchantPagination: AffiliateSetupMerchantPagination;
      merchantQuery: RelayRouteQueryDescriptor<AffiliateSetupRouteQuery["variables"]>;
    }
  | {
      status: "error";
      merchantPagination: AffiliateSetupMerchantPagination;
    };

export async function affiliateSetupLoader({
  context,
  request,
}: LoaderFunctionArgs): Promise<AffiliateSetupLoaderData> {
  const environment = getRelayEnvironmentFromRouterContext(context);
  const merchantPagination = merchantPaginationFromUrl(new URL(request.url));

  try {
    return {
      status: "ready",
      merchantPagination,
      merchantQuery: await preloadRouteQuery<AffiliateSetupRouteQuery>(
        environment,
        affiliateSetupRouteQuery,
        merchantPagination,
        { signal: request.signal },
      ),
    };
  } catch (error) {
    return recoverRouteLoaderError<AffiliateSetupLoaderData>(
      error,
      "Failed to preload affiliate setup merchant choices.",
      {
        status: "error",
        merchantPagination,
      },
    );
  }
}

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
  merchantQuery,
}: {
  merchantPagination: Extract<AffiliateSetupLoaderData, { status: "ready" }>["merchantPagination"];
  merchantQuery: Extract<AffiliateSetupLoaderData, { status: "ready" }>["merchantQuery"];
}) {
  const queryRef = useRoutePreloadedQuery<AffiliateSetupRouteQuery>(
    affiliateSetupRouteQuery,
    merchantQuery,
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
  const [commitUpsertAffiliateNetwork] =
    useMutation<AffiliateSetupOperationsUpsertAffiliateNetworkMutation>(
      upsertAffiliateNetworkMutation,
    );
  const [commitUpsertAffiliateProgram] =
    useMutation<AffiliateSetupOperationsUpsertAffiliateProgramMutation>(
      upsertAffiliateProgramMutation,
    );
  const [commitUpsertAffiliateLink] =
    useMutation<AffiliateSetupOperationsUpsertAffiliateLinkMutation>(upsertAffiliateLinkMutation);
  const [commitCreateCoupon] =
    useMutation<AffiliateSetupOperationsCreateCouponMutation>(createCouponMutation);

  const merchantChoices = useMemo(() => buildMerchantChoices(data.merchants), [data.merchants]);
  const merchantContext = useMemo(
    () => getAffiliateMerchantContext(merchantChoices, selectedMerchantId),
    [merchantChoices, selectedMerchantId],
  );

  if (!data.merchants) {
    return <AffiliateSetupUnavailableFallback />;
  }

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
          variables: buildNetworkVariables(
            formDataToScalarValues(new FormData(event.currentTarget)),
          ),
        },
      );
      const payload = response.upsertAffiliateNetwork;
      const outcome = resolveAffiliateNetworkMutationOutcome(payload, graphQLErrors);

      if (outcome.error === null) {
        setNetworkResult(outcome.result);
        setAffiliateNetworkId(outcome.result.id);
      } else {
        setNetworkError(outcome.error);
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
          variables: buildProgramVariables(
            formDataToScalarValues(new FormData(event.currentTarget)),
          ),
        },
      );
      const payload = response.upsertAffiliateProgram;
      const outcome = resolveAffiliateProgramMutationOutcome(payload, graphQLErrors);

      if (outcome.error === null) {
        setProgramResult(outcome.result);
      } else {
        setProgramError(outcome.error);
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
          variables: buildLinkVariables(formDataToScalarValues(new FormData(event.currentTarget))),
        },
      );
      const payload = response.upsertAffiliateLink;
      const outcome = resolveAffiliateLinkMutationOutcome(payload, graphQLErrors);

      if (outcome.error === null) {
        setLinkResult(outcome.result);
      } else {
        setLinkError(outcome.error);
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
      const { response, graphQLErrors } = await commitRouteMutationPromise(commitCreateCoupon, {
        variables: buildCouponVariables(formDataToScalarValues(new FormData(event.currentTarget))),
      });
      const payload = response.createCoupon;
      const outcome = resolveAffiliateCouponMutationOutcome(payload, graphQLErrors);

      if (outcome.error === null) {
        setCouponResult(outcome.result);
      } else {
        setCouponError(outcome.error);
      }
    } catch {
      setCouponError(DEFAULT_ROUTE_ERROR_MESSAGE);
    } finally {
      couponInFlightRef.current = false;
      setCouponPending(false);
    }
  }

  const paginationData = buildAffiliateSetupPaginationData({
    endCursor: data.merchants.pageInfo.endCursor ?? null,
    hasNextPage: data.merchants.pageInfo.hasNextPage,
    hasPreviousPage: data.merchants.pageInfo.hasPreviousPage,
    pagination: merchantPagination,
  });

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
          {merchantContext.currentMerchantCopy ? (
            <p>{merchantContext.currentMerchantCopy}</p>
          ) : null}
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
          selectedMerchantCopy={merchantContext.selectedMerchantCopy}
          selectedMerchantValue={merchantContext.selectedMerchantValue}
        />
      )}

      <AffiliateLinkForm
        error={linkError}
        onSubmit={handleLinkSubmit}
        pending={linkPending}
        result={linkResult}
        selectedMerchantCopy={merchantContext.selectedMerchantCopy}
      />

      {merchantChoices.length === 0 ? null : (
        <AffiliateCouponForm
          error={couponError}
          merchantChoices={merchantChoices}
          onSelectedMerchantIdChange={setSelectedMerchantId}
          onSubmit={handleCouponSubmit}
          pending={couponPending}
          result={couponResult}
          selectedMerchantCopy={merchantContext.selectedMerchantCopy}
          selectedMerchantValue={merchantContext.selectedMerchantValue}
        />
      )}

      <Pagination
        firstHref={paginationData.firstHref}
        firstLabel="First merchants"
        label="Merchant choice pages"
        nextHref={paginationData.nextHref}
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
