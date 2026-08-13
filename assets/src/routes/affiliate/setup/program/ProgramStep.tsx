import type { FormEventHandler } from "react";
import { props } from "@stylexjs/stylex";
import type { AffiliateSetupOperationsUpsertAffiliateProgramMutation } from "$generated/AffiliateSetupOperationsUpsertAffiliateProgramMutation.graphql";
import { Button } from "$ui/primitives/Button";
import { Input } from "$ui/primitives/Input";
import { Label } from "$ui/primitives/Label";
import { MerchantChoiceSelect } from "../MerchantChoiceSelect";
import { affiliateWorkflowStyles as styles } from "../affiliate-workflow.stylex";
import type { MerchantChoice } from "../affiliate-setup-data";

export type ProgramResult = NonNullable<
  NonNullable<
    AffiliateSetupOperationsUpsertAffiliateProgramMutation["response"]["upsertAffiliateProgram"]
  >["program"]
>;

export function ProgramStep({
  affiliateNetworkId,
  error,
  merchantChoices,
  onAffiliateNetworkIdChange,
  onSelectedMerchantIdChange,
  onSubmit,
  pending,
  result,
  selectedMerchantCopy,
  selectedMerchantValue,
}: {
  affiliateNetworkId: string;
  error: string | null;
  merchantChoices: readonly MerchantChoice[];
  onAffiliateNetworkIdChange: (value: string) => void;
  onSelectedMerchantIdChange: (merchantId: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  pending: boolean;
  result: ProgramResult | null;
  selectedMerchantCopy: string | null;
  selectedMerchantValue: string;
}) {
  return (
    <section aria-label="Step 2: Program" {...props(styles.step)}>
      <header {...props(styles.stepHeader)}>
        <p {...props(styles.eyebrow)}>Step 2</p>
        <h2 {...props(styles.heading)}>2. Program</h2>
        <p {...props(styles.description)}>
          Connect the selected merchant to its program within the saved network.
        </p>
      </header>
      <form
        aria-label="Save affiliate program"
        method="post"
        onSubmit={onSubmit}
        {...props(styles.form)}
      >
        {selectedMerchantCopy ? <p>{selectedMerchantCopy}</p> : null}
        <Label>
          Affiliate network ID
          <Input
            autoComplete="off"
            name="affiliateNetworkId"
            onChange={(event) => onAffiliateNetworkIdChange(event.currentTarget.value)}
            type="text"
            value={affiliateNetworkId}
          />
        </Label>
        <MerchantChoiceSelect
          merchantChoices={merchantChoices}
          onSelectedMerchantIdChange={onSelectedMerchantIdChange}
          selectedMerchantValue={selectedMerchantValue}
        />
        <Label>
          Program code
          <Input autoComplete="off" name="programCode" type="text" />
        </Label>
        <Label>
          Program status
          <Input autoComplete="off" name="programStatus" type="text" />
        </Label>
        <Button disabled={pending} type="submit">
          Save program
        </Button>
        {error ? (
          <p role="alert" {...props(styles.feedback)}>
            {error}
          </p>
        ) : null}
        {result ? (
          <section aria-label="Affiliate program result" {...props(styles.result)}>
            <h3>{result.programCode ?? "Affiliate program"}</h3>
            <p>{result.id}</p>
            {result.status ? <p>{result.status}</p> : null}
          </section>
        ) : null}
      </form>
    </section>
  );
}
