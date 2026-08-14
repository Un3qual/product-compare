import type { FormEventHandler } from "react";
import { props } from "@stylexjs/stylex";
import type { AffiliateSetupOperationsUpsertAffiliateNetworkMutation } from "$generated/AffiliateSetupOperationsUpsertAffiliateNetworkMutation.graphql";
import { Button } from "$ui/primitives/Button";
import { Input } from "$ui/primitives/Input";
import { Label } from "$ui/primitives/Label";
import { affiliateWorkflowStyles as styles } from "../affiliate-workflow.stylex";

export type NetworkResult = NonNullable<
  NonNullable<
    AffiliateSetupOperationsUpsertAffiliateNetworkMutation["response"]["upsertAffiliateNetwork"]
  >["network"]
>;

export function NetworkStep({
  error,
  onSubmit,
  pending,
  result,
}: {
  error: string | null;
  onSubmit: FormEventHandler<HTMLFormElement>;
  pending: boolean;
  result: NetworkResult | null;
}) {
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
        onSubmit={onSubmit}
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
