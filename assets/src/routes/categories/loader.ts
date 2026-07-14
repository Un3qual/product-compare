import { data, type LoaderFunctionArgs } from "react-router-dom";
import type { CategoryRouteQuery } from "../../__generated__/CategoryRouteQuery.graphql";
import {
  fetchRouteQuery,
  getRelayEnvironmentFromRouterContext,
  type RelayRouteQueryDescriptor
} from "../../relay/route-preload";
import { normalizeRouteLoaderThrownError } from "../loader-errors";
import { isCanonicalSlug } from "../route-params";
import type { RouteDocumentMetadata } from "../RouteMetadata";
import { routeMetadataFromSeo } from "../seo";
import categoryRouteQuery from "./queries/CategoryRouteQuery";

export type CategoryLoaderData =
  | {
      status: "ready";
      metadata: RouteDocumentMetadata;
      query: RelayRouteQueryDescriptor<CategoryRouteQuery["variables"]>;
    }
  | { status: "not_found" };

export async function categoryLoader({ context, params, request }: LoaderFunctionArgs) {
  const slug = params.slug?.trim() ?? "";
  if (!isCanonicalSlug(slug)) return notFound();

  const after = new URL(request.url).searchParams.get("after");
  const environment = getRelayEnvironmentFromRouterContext(context);

  try {
    const fetched = await fetchRouteQuery<CategoryRouteQuery>(
      environment,
      categoryRouteQuery,
      { slug, first: 12, after },
      { signal: request.signal }
    );

    if (!fetched.data.category) {
      fetched.dispose();
      return notFound();
    }

    return {
      status: "ready" as const,
      metadata: routeMetadataFromSeo(fetched.data.category.seo, request.url, {
        allowIndexing: new URL(request.url).search === ""
      }),
      query: fetched.descriptor
    };
  } catch (error) {
    throw normalizeRouteLoaderThrownError(error, "Category fetch failed");
  }
}

function notFound() {
  return data<CategoryLoaderData>({ status: "not_found" }, { status: 404 });
}
