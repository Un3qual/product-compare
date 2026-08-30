import { type FormEvent, useRef, useState } from "react";
import { props } from "@stylexjs/stylex";
import { useMutation } from "react-relay";
import type { AffiliateSetupOperationsUpsertAffiliateNetworkMutation } from "$generated/AffiliateSetupOperationsUpsertAffiliateNetworkMutation.graphql";
import { DEFAULT_MUTATION_ERROR_MESSAGE } from "$relay/mutation-errors";
import { commitRouteMutationPromise } from "$relay/mutations";
import { Button } from "$ui/primitives/Button";
import { Input } from "$ui/primitives/Input";
import { Label } from "$ui/primitives/Label";
import {
  resolveAffiliateNetworkMutationOutcome,
  upsertAffiliateNetworkMutation,
} from "../AffiliateSetupOperations";
import { buildNetworkVariables, formDataToScalarValues } from "../affiliate-form-values";
import { affiliateWorkflowStyles as styles } from "../affiliate-workflow.stylex";

type NetworkResult = NonNullable<
  NonNullable<
    AffiliateSetupOperationsUpsertAffiliateNetworkMutation["response"]["upsertAffiliateNetwork"]
  >["network"]
>;

export function NetworkStep({
  onNetworkIdChange,
}: {
  onNetworkIdChange: (networkId: string) => void;
}) {
  const [commitUpsertAffiliateNetwork] =
    useMutation<AffiliateSetupOperationsUpsertAffiliateNetworkMutation>(
      upsertAffiliateNetworkMutation,
    );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<NetworkResult | null>(null);
  const inFlightRef = useRef(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (inFlightRef.current) return;

    inFlightRef.current = true;
    setPending(true);
    setError(null);
    setResult(null);

    try {
      const { response, graphQLErrors } = await commitRouteMutationPromise(
        commitUpsertAffiliateNetwork,
        {
          variables: buildNetworkVariables(
            formDataToScalarValues(new FormData(event.currentTarget)),
          ),
        },
      );
      const outcome = resolveAffiliateNetworkMutationOutcome(
        response.upsertAffiliateNetwork,
        graphQLErrors,
      );

      if (outcome.error === null) {
        setResult(outcome.result);
        onNetworkIdChange(outcome.result.id);
      } else {
        setError(outcome.error);
      }
    } catch {
      setError(DEFAULT_MUTATION_ERROR_MESSAGE);
    } finally {
      inFlightRef.current = false;
      setPending(false);
    }
  }

  return (
    <section aria-label="Step 1: Network" {...props(styles.step)}>
      <header {...props(styles.stepHeader)}>
        <p {...props(styles.eyebrow)}>Step 1</p>
        <h2 {...props(styles.heading)}>1. Network</h2>
        <p {...props(styles.description)}>
          Establish the affiliate network identity used by downstream programs and links.
        </p>
      </header>
      <form
        aria-label="Save affiliate network"
        method="post"
        onSubmit={handleSubmit}
        {...props(styles.form)}
      >
        <Label>
          Network name
          <Input autoComplete="off" name="networkName" type="text" />
        </Label>
        <Button disabled={pending} type="submit">
          Save network
        </Button>
        {error ? (
          <p role="alert" {...props(styles.feedback)}>
            {error}
          </p>
        ) : null}
        {result ? (
          <section aria-label="Affiliate network result" {...props(styles.result)}>
            <h3>{result.name}</h3>
            <p>{result.id}</p>
          </section>
        ) : null}
      </form>
    </section>
  );
}
