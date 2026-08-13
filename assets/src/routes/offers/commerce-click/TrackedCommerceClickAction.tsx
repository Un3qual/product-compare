import { useState, type MouseEvent } from "react";
import { graphql, useMutation } from "react-relay";
import type { TrackedCommerceClickActionMutation } from "$generated/TrackedCommerceClickActionMutation.graphql";
import { resolveGraphQLEndpoint } from "$relay/fetch-graphql";
import { Button } from "$ui/primitives/Button";
import { commitRouteMutation } from "../../relay-mutations";
import {
  DEFAULT_ROUTE_ERROR_MESSAGE,
  hasRouteGraphQLErrors,
  routeMutationErrorMessage,
} from "../../route-errors";

export const trackCommerceClickMutation = graphql`
  mutation TrackedCommerceClickActionMutation($input: TrackCommerceClickInput!) {
    trackCommerceClick(input: $input) {
      redirectPath
      errors {
        code
        field
        message
      }
    }
  }
`;

export function TrackedCommerceClickAction({
  label,
  merchantProductId,
}: {
  label: string;
  merchantProductId: string;
}) {
  const [commitTrackCommerceClick, isPending] = useMutation<TrackedCommerceClickActionMutation>(
    trackCommerceClickMutation,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const graphQLEndpoint = resolveGraphQLEndpoint();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (!shouldTrackCommerceClick(event)) {
      return;
    }

    event.preventDefault();
    setErrorMessage(null);

    commitRouteMutation(
      commitTrackCommerceClick,
      {
        variables: {
          input: {
            merchantProductId,
          },
        },
        onCompleted: (response, graphQLErrors) => {
          const outcome = resolveTrackedCommerceClickMutationOutcome(
            response.trackCommerceClick,
            graphQLEndpoint,
            graphQLErrors,
          );

          if (outcome.redirectUrl) {
            try {
              window.location.assign(outcome.redirectUrl);
            } catch {
              setErrorMessage(DEFAULT_ROUTE_ERROR_MESSAGE);
            }
            return;
          }

          setErrorMessage(outcome.error);
        },
        onError: () => {
          setErrorMessage(DEFAULT_ROUTE_ERROR_MESSAGE);
        },
      },
      () => {
        setErrorMessage(DEFAULT_ROUTE_ERROR_MESSAGE);
      },
    );
  }

  return (
    <>
      <Button
        render={
          <a
            aria-disabled={isPending || undefined}
            href={trackedMerchantProductHref(merchantProductId, graphQLEndpoint)}
            onClick={isPending ? preventPendingNavigation : handleClick}
          />
        }
      >
        {label}
      </Button>
      {errorMessage ? <p role="alert">{errorMessage}</p> : null}
    </>
  );
}

function preventPendingNavigation(event: MouseEvent<HTMLAnchorElement>) {
  event.preventDefault();
}

type CommerceClick = Pick<
  MouseEvent<HTMLAnchorElement>,
  "altKey" | "button" | "ctrlKey" | "metaKey" | "shiftKey"
>;

type TrackedCommerceClickPayload = NonNullable<
  TrackedCommerceClickActionMutation["response"]["trackCommerceClick"]
>;

export type TrackedCommerceClickMutationOutcome =
  | { readonly error: null; readonly redirectUrl: string }
  | { readonly error: string; readonly redirectUrl: null };

export function shouldTrackCommerceClick(click: CommerceClick) {
  return click.button === 0 && !click.altKey && !click.ctrlKey && !click.metaKey && !click.shiftKey;
}

export function trackedMerchantProductHref(merchantProductId: string, graphQLEndpoint: string) {
  const params = new URLSearchParams({ merchantProductId });

  return resolveTrackedCommerceRedirectUrl(
    `/r/merchant-product?${params.toString()}`,
    graphQLEndpoint,
  );
}

export function resolveTrackedCommerceRedirectUrl(redirectPath: string, graphQLEndpoint: string) {
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
  graphQLErrors?: readonly unknown[] | null,
): TrackedCommerceClickMutationOutcome {
  if (!payload?.redirectPath || payload.errors.length > 0 || hasRouteGraphQLErrors(graphQLErrors)) {
    return {
      error: routeMutationErrorMessage(payload?.errors, graphQLErrors),
      redirectUrl: null,
    };
  }

  try {
    return {
      error: null,
      redirectUrl: resolveTrackedCommerceRedirectUrl(payload.redirectPath, graphQLEndpoint),
    };
  } catch {
    return { error: DEFAULT_ROUTE_ERROR_MESSAGE, redirectUrl: null };
  }
}
