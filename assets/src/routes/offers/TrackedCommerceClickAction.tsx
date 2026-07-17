import { useState, type MouseEvent } from "react";
import { useMutation } from "react-relay";
import type { TrackCommerceClickMutation } from "../../__generated__/TrackCommerceClickMutation.graphql";
import { resolveGraphQLEndpoint } from "../../relay/fetch-graphql";
import { Button } from "../../ui/primitives/Button";
import { commitRouteMutation } from "../relay-mutations";
import { DEFAULT_ROUTE_ERROR_MESSAGE } from "../route-errors";
import {
  resolveTrackedCommerceClickMutationOutcome,
  shouldTrackCommerceClick,
  trackedMerchantProductHref
} from "./tracked-commerce-click-data";
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
            merchantProductId
          }
        },
        onCompleted: (response, graphQLErrors) => {
          const outcome = resolveTrackedCommerceClickMutationOutcome(
            response.trackCommerceClick,
            graphQLEndpoint,
            graphQLErrors
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
        }
      },
      () => {
        setErrorMessage(DEFAULT_ROUTE_ERROR_MESSAGE);
      }
    );
  }

  return (
    <>
      <Button asChild variant="solid">
        <a
          aria-disabled={isPending || undefined}
          href={trackedMerchantProductHref(merchantProductId, graphQLEndpoint)}
          onClick={isPending ? preventPendingNavigation : handleClick}
        >
          {label}
        </a>
      </Button>
      {errorMessage ? <p role="alert">{errorMessage}</p> : null}
    </>
  );
}

function preventPendingNavigation(event: MouseEvent<HTMLAnchorElement>) {
  event.preventDefault();
}
