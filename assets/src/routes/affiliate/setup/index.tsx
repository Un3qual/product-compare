import { Suspense, type FormEvent, useRef, useState } from "react";
import { useLoaderData } from "react-router-dom";
import { useMutation, usePreloadedQuery } from "react-relay";
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
  const merchantChoices = buildMerchantChoices(data);
  const [networkResult, setNetworkResult] = useState<NetworkResult | null>(null);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [networkPending, setNetworkPending] = useState(false);
  const networkInFlightRef = useRef(false);
  const [programResult, setProgramResult] = useState<ProgramResult | null>(null);
  const [programError, setProgramError] = useState<string | null>(null);
  const [programPending, setProgramPending] = useState(false);
  const programInFlightRef = useRef(false);
  const [affiliateNetworkId, setAffiliateNetworkId] = useState("");
  const [commitUpsertAffiliateNetwork] = useMutation<UpsertAffiliateNetworkMutation>(
    upsertAffiliateNetworkMutation
  );
  const [commitUpsertAffiliateProgram] = useMutation<UpsertAffiliateProgramMutation>(
    upsertAffiliateProgramMutation
  );

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
    </>
  );
}

function AffiliateSetupUnavailableFallback() {
  return (
    <section role="alert">
      <p>Affiliate setup unavailable.</p>
    </section>
  );
}

function buildMerchantChoices(data: AffiliateSetupRouteQuery["response"]): MerchantChoice[] {
  return (
    data.merchants?.edges.flatMap(({ node }) => {
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
    }) ?? []
  );
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

function requiredFormString(formData: FormData, name: string) {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : "";
}

function optionalFormString(formData: FormData, name: string) {
  const value = requiredFormString(formData, name);

  return value || null;
}
