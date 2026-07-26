import type { LoaderFunctionArgs } from "react-router-dom";
import cjProgramsRouteQuery, {
  type CJProgramsRouteQuery
} from "../../../__generated__/CJProgramsRouteQuery.graphql";
import {
  getRelayEnvironmentFromRouterContext,
  preloadRouteQuery,
  type RelayRouteQueryDescriptor
} from "../../../relay/route-preload";
import { recoverRouteLoaderError } from "../../loader-errors";
import {
  cjProgramsPaginationFromUrl,
  type CJProgramsPagination
} from "./pagination";

export type CJProgramsLoaderData =
  | {
      status: "ready";
      pagination: CJProgramsPagination;
      query: RelayRouteQueryDescriptor<CJProgramsRouteQuery["variables"]>;
    }
  | {
      status: "error";
      pagination: CJProgramsPagination;
    };

export async function cjProgramsLoader({
  context,
  request
}: LoaderFunctionArgs): Promise<CJProgramsLoaderData> {
  const environment = getRelayEnvironmentFromRouterContext(context);
  const pagination = cjProgramsPaginationFromUrl(new URL(request.url));

  try {
    return {
      status: "ready",
      pagination,
      query: await preloadRouteQuery<CJProgramsRouteQuery>(
        environment,
        cjProgramsRouteQuery,
        pagination,
        { signal: request.signal }
      )
    };
  } catch (error) {
    return recoverRouteLoaderError<CJProgramsLoaderData>(
      error,
      "Failed to preload CJ programs route query.",
      {
        status: "error",
        pagination
      }
    );
  }
}
