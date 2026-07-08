import { useState } from "react";
import { useMutation } from "react-relay";
import type { TrackCommerceClickMutation } from "../../__generated__/TrackCommerceClickMutation.graphql";
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

  function handleClick() {
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
            window.location.assign(payload.redirectPath);
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
      <button disabled={isPending} onClick={handleClick} type="button">
        {label}
      </button>
      {errorMessage ? <p role="alert">{errorMessage}</p> : null}
    </>
  );
}
