import {
  DEFAULT_ROUTE_ERROR_MESSAGE,
  hasRouteGraphQLErrors,
  routeMutationErrorMessage
} from "../route-errors";

type CommerceClick = {
  button: number;
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
};

export type TrackedCommerceClickPayload = {
  readonly errors?: unknown;
  readonly redirectPath?: string | null;
};

export type TrackedCommerceClickMutationOutcome =
  | { readonly error: null; readonly redirectUrl: string }
  | { readonly error: string; readonly redirectUrl: null };

export function shouldTrackCommerceClick(click: CommerceClick) {
  return (
    click.button === 0 &&
    !click.altKey &&
    !click.ctrlKey &&
    !click.metaKey &&
    !click.shiftKey
  );
}

export function trackedMerchantProductHref(
  merchantProductId: string,
  graphQLEndpoint: string
) {
  const params = new URLSearchParams({ merchantProductId });

  return resolveTrackedCommerceRedirectUrl(`/r/merchant-product?${params.toString()}`, graphQLEndpoint);
}

export function resolveTrackedCommerceRedirectUrl(
  redirectPath: string,
  graphQLEndpoint: string
) {
  const endpointUrl = new URL(graphQLEndpoint);
  const redirectUrl = new URL(redirectPath, endpointUrl.origin);
  const usesEndpointHttpProtocol =
    (redirectUrl.protocol === "http:" || redirectUrl.protocol === "https:") &&
    redirectUrl.protocol === endpointUrl.protocol;

  if (redirectUrl.origin !== endpointUrl.origin || !usesEndpointHttpProtocol) {
    throw new Error("Tracked commerce redirect must resolve to the same origin");
  }

  return redirectUrl.toString();
}

export function resolveTrackedCommerceClickMutationOutcome(
  payload: TrackedCommerceClickPayload | null | undefined,
  graphQLEndpoint: string,
  graphQLErrors?: readonly unknown[] | null
): TrackedCommerceClickMutationOutcome {
  if (
    !payload?.redirectPath ||
    !Array.isArray(payload.errors) ||
    payload.errors.length > 0 ||
    hasRouteGraphQLErrors(graphQLErrors)
  ) {
    return {
      error: routeMutationErrorMessage(payload?.errors, graphQLErrors),
      redirectUrl: null
    };
  }

  try {
    return {
      error: null,
      redirectUrl: resolveTrackedCommerceRedirectUrl(
        payload.redirectPath,
        graphQLEndpoint
      )
    };
  } catch {
    return { error: DEFAULT_ROUTE_ERROR_MESSAGE, redirectUrl: null };
  }
}
