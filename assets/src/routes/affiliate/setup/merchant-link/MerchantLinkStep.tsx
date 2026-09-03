import { type FormEvent, useRef, useState } from "react";
import { props } from "@stylexjs/stylex";
import { useMutation } from "react-relay";
import type { AffiliateSetupOperationsUpsertAffiliateLinkMutation } from "$generated/AffiliateSetupOperationsUpsertAffiliateLinkMutation.graphql";
import { DEFAULT_MUTATION_ERROR_MESSAGE } from "$relay/mutation-errors";
import { commitRouteMutationPromise } from "$relay/mutations";
import { Button } from "$ui/primitives/Button";
import { Input } from "$ui/primitives/Input";
import { Label } from "$ui/primitives/Label";
import {
  resolveAffiliateLinkMutationOutcome,
  upsertAffiliateLinkMutation,
} from "../AffiliateSetupOperations";
import { buildLinkVariables, formDataToScalarValues } from "../affiliate-form-values";
import { affiliateWorkflowStyles as styles } from "../affiliate-workflow.stylex";

type LinkResult = NonNullable<
  NonNullable<
    AffiliateSetupOperationsUpsertAffiliateLinkMutation["response"]["upsertAffiliateLink"]
  >["link"]
>;

export function MerchantLinkStep({
  selectedMerchantCopy,
}: {
  selectedMerchantCopy: string | null;
}) {
  const [commitUpsertAffiliateLink] =
    useMutation<AffiliateSetupOperationsUpsertAffiliateLinkMutation>(upsertAffiliateLinkMutation);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<LinkResult | null>(null);
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
        commitUpsertAffiliateLink,
        {
          variables: buildLinkVariables(formDataToScalarValues(new FormData(event.currentTarget))),
        },
      );
      const outcome = resolveAffiliateLinkMutationOutcome(
        response.upsertAffiliateLink,
        graphQLErrors,
      );

      if (outcome.error === null) {
        setResult(outcome.result);
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
    <section aria-label="Step 3: Merchant link" {...props(styles.step)}>
      <header {...props(styles.stepHeader)}>
        <p {...props(styles.eyebrow)}>Step 3</p>
        <h2 {...props(styles.heading)}>3. Merchant link</h2>
        <p {...props(styles.description)}>
          Register the tracked destination and its last verification fact.
        </p>
      </header>
      <form
        aria-label="Save affiliate link"
        method="post"
        onSubmit={handleSubmit}
        {...props(styles.form)}
      >
        {selectedMerchantCopy ? <p>{selectedMerchantCopy}</p> : null}
        <Label>
          Merchant product ID
          <Input autoComplete="off" name="merchantProductId" type="text" />
        </Label>
        <Label>
          Link affiliate network ID
          <Input autoComplete="off" name="linkAffiliateNetworkId" type="text" />
        </Label>
        <Label>
          Original URL
          <Input autoComplete="off" name="originalUrl" type="url" />
        </Label>
        <Label>
          Affiliate URL
          <Input autoComplete="off" name="affiliateUrl" type="url" />
        </Label>
        <Label>
          Last verified at
          <Input name="lastVerifiedAt" type="datetime-local" />
        </Label>
        <Button disabled={pending} type="submit">
          Save link
        </Button>
        {error ? (
          <p role="alert" {...props(styles.feedback)}>
            {error}
          </p>
        ) : null}
        {result ? (
          <section aria-label="Affiliate link result" {...props(styles.result)}>
            <h3>{result.id}</h3>
            <p>{result.affiliateUrl}</p>
          </section>
        ) : null}
      </form>
    </section>
  );
}
