import { useState, type MouseEvent } from "react";
import { useMutation } from "react-relay";
import type { TrackCommerceClickMutation } from "../../__generated__/TrackCommerceClickMutation.graphql";
import { resolveGraphQLEndpoint } from "../../relay/fetch-graphql";
import { commitRouteMutation } from "../relay-mutations";
import {
  DEFAULT_ROUTE_ERROR_MESSAGE,
  hasRouteGraphQLErrors,
  routeMutationErrorMessage
} from "../route-errors";
import { trackCommerceClickMutation } from "./mutations/TrackCommerceClickMutation";

export function TrackedCommerceClickAction({
  label,
  merchantProductId
}: {
  label: string;
  merchantProductId: string;
}) {
  const [commitTrackCommerceClick, isPending] =
    useMutation<TrackCommerceClickMutation>(trackCommerceClickMutation);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (!shouldTrackClick(event)) {
      return;
    }

    event.preventDefault();
    setErrorMessage(null);

    commitRouteMutation(
      commitTrackCommerceClick,
      {
        variables: {
          input: {
            merchantProductId
          }
        },
        onCompleted: (response, graphQLErrors) => {
          const payload = response.trackCommerceClick;

          if (
            payload?.redirectPath &&
            payload.errors.length === 0 &&
            !hasRouteGraphQLErrors(graphQLErrors)
          ) {
            window.location.assign(resolveTrackedCommerceRedirectUrl(payload.redirectPath));
            return;
          }

          setErrorMessage(routeMutationErrorMessage(payload?.errors, graphQLErrors));
        },
        onError: () => {
          setErrorMessage(DEFAULT_ROUTE_ERROR_MESSAGE);
        }
      },
      () => {
        setErrorMessage(DEFAULT_ROUTE_ERROR_MESSAGE);
      }
    );
  }

  return (
    <>
      <a
        aria-disabled={isPending || undefined}
        href={trackedMerchantProductHref(merchantProductId)}
        onClick={isPending ? preventPendingNavigation : handleClick}
      >
        {label}
      </a>
      {errorMessage ? <p role="alert">{errorMessage}</p> : null}
    </>
  );
}

function shouldTrackClick(event: MouseEvent<HTMLAnchorElement>) {
  return (
    event.button === 0 &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.shiftKey
  );
}

function preventPendingNavigation(event: MouseEvent<HTMLAnchorElement>) {
  event.preventDefault();
}

function trackedMerchantProductHref(merchantProductId: string) {
  const params = new URLSearchParams({ merchantProductId });

  return resolveTrackedCommerceRedirectUrl(`/r/merchant-product?${params.toString()}`);
}

export function resolveTrackedCommerceRedirectUrl(
  redirectPath: string,
  graphQLEndpoint = resolveGraphQLEndpoint()
) {
  const endpointUrl = new URL(graphQLEndpoint);

  return new URL(redirectPath, endpointUrl.origin).toString();
}
