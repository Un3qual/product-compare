import type { LoaderFunctionArgs } from "react-router-dom";
import type { AffiliateSetupOperationsQuery } from "../../../__generated__/AffiliateSetupOperationsQuery.graphql";
import {
  getRelayEnvironmentFromRouterContext,
  preloadRouteQuery,
  type RelayRouteQueryDescriptor,
} from "../../../relay/route-preload";
import { recoverRouteLoaderError } from "../../loader-errors";
import { merchantPaginationFromUrl } from "../../merchants/pagination";
import { affiliateSetupOperationsQuery } from "./AffiliateSetupOperations";
import type { AffiliateSetupMerchantPagination } from "./pagination";

export type AffiliateSetupLoaderData =
  | {
      status: "ready";
      merchantPagination: AffiliateSetupMerchantPagination;
      merchantQuery: RelayRouteQueryDescriptor<AffiliateSetupOperationsQuery["variables"]>;
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
      merchantQuery: await preloadRouteQuery<AffiliateSetupOperationsQuery>(
        environment,
        affiliateSetupOperationsQuery,
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
