import type { FormEventHandler } from "react";
import { props } from "@stylexjs/stylex";
import type { AffiliateSetupOperationsUpsertAffiliateLinkMutation } from "$generated/AffiliateSetupOperationsUpsertAffiliateLinkMutation.graphql";
import { Button } from "$ui/primitives/Button";
import { Input } from "$ui/primitives/Input";
import { Label } from "$ui/primitives/Label";
import { affiliateWorkflowStyles as styles } from "../affiliate-workflow.stylex";

export type LinkResult = NonNullable<
  NonNullable<
    AffiliateSetupOperationsUpsertAffiliateLinkMutation["response"]["upsertAffiliateLink"]
  >["link"]
>;

export function MerchantLinkStep({
  error,
  onSubmit,
  pending,
  result,
  selectedMerchantCopy,
}: {
  error: string | null;
  onSubmit: FormEventHandler<HTMLFormElement>;
  pending: boolean;
  result: LinkResult | null;
  selectedMerchantCopy: string | null;
}) {
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
        onSubmit={onSubmit}
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
