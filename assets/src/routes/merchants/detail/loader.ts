import { data, type LoaderFunctionArgs } from "react-router-dom";
import type { MerchantDetailRouteQuery } from "../../../__generated__/MerchantDetailRouteQuery.graphql";
import { fetchRouteQuery, getRelayEnvironmentFromRouterContext, type RelayRouteQueryDescriptor } from "../../../relay/route-preload";
import { normalizeRouteLoaderThrownError } from "../../loader-errors";
import { routeMetadataFromSeo } from "../../seo";
import type { RouteDocumentMetadata } from "../../RouteMetadata";
import merchantDetailRouteQuery from "./queries/MerchantDetailRouteQuery";

export type MerchantDetailLoaderData =
  | { status: "ready"; metadata: RouteDocumentMetadata; query: RelayRouteQueryDescriptor<MerchantDetailRouteQuery["variables"]> }
  | { status: "not_found" };

export async function merchantDetailLoader({ context, params, request }: LoaderFunctionArgs) {
  const slug = params.slug?.trim() ?? "";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return notFound();
  const after = new URL(request.url).searchParams.get("after");
  const environment = getRelayEnvironmentFromRouterContext(context);
  try {
    const fetched = await fetchRouteQuery<MerchantDetailRouteQuery>(environment, merchantDetailRouteQuery, { slug, first: 20, after }, { signal: request.signal });
    if (!fetched.data.merchant) { fetched.dispose(); return notFound(); }
    return { status: "ready" as const, metadata: routeMetadataFromSeo(fetched.data.merchant.seo, request.url, { allowIndexing: new URL(request.url).search === "" }), query: fetched.descriptor };
  } catch (error) { throw normalizeRouteLoaderThrownError(error, "Merchant detail fetch failed"); }
}

function notFound() { return data<MerchantDetailLoaderData>({ status: "not_found" }, { status: 404 }); }
