import { type FormEvent, useRef, useState } from "react";
import { props } from "@stylexjs/stylex";
import { useMutation } from "react-relay";
import type { AffiliateSetupOperationsUpsertAffiliateProgramMutation } from "$generated/AffiliateSetupOperationsUpsertAffiliateProgramMutation.graphql";
import { DEFAULT_MUTATION_ERROR_MESSAGE } from "$relay/mutation-errors";
import { commitRouteMutationPromise } from "$relay/mutations";
import { Button } from "$ui/primitives/Button";
import { Input } from "$ui/primitives/Input";
import { Label } from "$ui/primitives/Label";
import { MerchantChoiceSelect } from "../MerchantChoiceSelect";
import {
  resolveAffiliateProgramMutationOutcome,
  upsertAffiliateProgramMutation,
} from "../AffiliateSetupOperations";
import { buildProgramVariables, formDataToScalarValues } from "../affiliate-form-values";
import { affiliateWorkflowStyles as styles } from "../affiliate-workflow.stylex";
import type { MerchantChoice } from "../merchant-context";

type ProgramResult = NonNullable<
  NonNullable<
    AffiliateSetupOperationsUpsertAffiliateProgramMutation["response"]["upsertAffiliateProgram"]
  >["program"]
>;

export function ProgramStep({
  affiliateNetworkId,
  merchantChoices,
  onAffiliateNetworkIdChange,
  onSelectedMerchantIdChange,
  selectedMerchantCopy,
  selectedMerchantValue,
}: {
  affiliateNetworkId: string;
  merchantChoices: readonly MerchantChoice[];
  onAffiliateNetworkIdChange: (value: string) => void;
  onSelectedMerchantIdChange: (merchantId: string) => void;
  selectedMerchantCopy: string | null;
  selectedMerchantValue: string;
}) {
  const [commitUpsertAffiliateProgram] =
    useMutation<AffiliateSetupOperationsUpsertAffiliateProgramMutation>(
      upsertAffiliateProgramMutation,
    );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<ProgramResult | null>(null);
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
        commitUpsertAffiliateProgram,
        {
          variables: buildProgramVariables(
            formDataToScalarValues(new FormData(event.currentTarget)),
          ),
        },
      );
      const outcome = resolveAffiliateProgramMutationOutcome(
        response.upsertAffiliateProgram,
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
        onSubmit={handleSubmit}
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
