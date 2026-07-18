import { type FormEvent, useId, useState } from "react";
import { create, props } from "@stylexjs/stylex";
import { Link } from "react-router-dom";
import { useMutation } from "react-relay";
import type { CreatePriceWatchMutation } from "../../__generated__/CreatePriceWatchMutation.graphql";
import { Button } from "../../ui/primitives/Button";
import { commitRouteMutationPromise } from "../relay-mutations";
import { DEFAULT_ROUTE_ERROR_MESSAGE } from "../route-errors";
import createPriceWatchMutation from "../account/alerts/queries/CreatePriceWatchMutation";
import {
  buildCreatePriceWatchInput,
  getPriceWatchAmountFieldData,
  priceWatchRuleTypeFromValue,
  resolveCreatePriceWatchMutationMessage,
  type PriceWatchRuleType
} from "./price-watch-data";

const styles = create({
  details: {
    borderBlockStart: "1px solid var(--pc-border-quiet)",
    paddingBlockStart: "0.85rem"
  },
  form: { display: "grid", gap: "0.75rem", paddingBlockStart: "0.8rem" },
  field: { display: "grid", gap: "0.35rem" },
  input: {
    backgroundColor: "var(--pc-surface)",
    border: "1px solid var(--pc-border-emphasized)",
    borderRadius: "0.4rem",
    color: "var(--pc-text)",
    minHeight: "2.6rem",
    paddingInline: "0.7rem"
  },
  message: { color: "var(--pc-text-secondary)", margin: 0 },
  summary: { cursor: "pointer", fontWeight: 650 }
});

export function PriceWatchControl({ productId }: { productId: string }) {
  return <PriceWatchForm key={productId} productId={productId} />;
}

function PriceWatchForm({ productId }: { productId: string }) {
  const amountId = useId();
  const currencyId = useId();
  const ruleId = useId();
  const [ruleType, setRuleType] = useState<PriceWatchRuleType>("TARGET_PRICE");
  const [message, setMessage] = useState<string | null>(null);
  const [commitCreate, mutationPending] = useMutation<CreatePriceWatchMutation>(createPriceWatchMutation);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const input = buildCreatePriceWatchInput({
      productId,
      ruleType,
      amount: form.get("amount"),
      currency: form.get("currency")
    });

    try {
      const { response, graphQLErrors } = await commitRouteMutationPromise(commitCreate, { variables: { input } });
      const payload = response.createPriceWatch;
      setMessage(resolveCreatePriceWatchMutationMessage(payload, graphQLErrors));
    } catch {
      setMessage(DEFAULT_ROUTE_ERROR_MESSAGE);
    }
  }

  const amountField = getPriceWatchAmountFieldData(ruleType);

  return (
    <details {...props(styles.details)}>
      <summary {...props(styles.summary)}>Watch price or availability</summary>
      <form onSubmit={handleSubmit} {...props(styles.form)}>
        <label htmlFor={ruleId} {...props(styles.field)}>
          Alert when
          <select
            id={ruleId}
            name="ruleType"
            value={ruleType}
            onChange={(event) =>
              setRuleType(priceWatchRuleTypeFromValue(event.currentTarget.value))
            }
            {...props(styles.input)}
          >
            <option value="TARGET_PRICE">Landed price reaches a target</option>
            <option value="PERCENTAGE_DROP">Landed price drops by a percentage</option>
            <option value="BACK_IN_STOCK">An offer returns in stock</option>
            <option value="NEWLY_AVAILABLE">A qualifying offer becomes available</option>
          </select>
        </label>
        <label htmlFor={currencyId} {...props(styles.field)}>
          Currency
          <input id={currencyId} name="currency" defaultValue="USD" maxLength={3} required {...props(styles.input)} />
        </label>
        {amountField.visible ? (
          <label htmlFor={amountId} {...props(styles.field)}>
            {amountField.label}
            <input id={amountId} name="amount" inputMode="decimal" min="0.01" step="0.01" required {...props(styles.input)} />
          </label>
        ) : null}
        <Button disabled={mutationPending} type="submit">
          {mutationPending ? "Creating watch…" : "Create watch"}
        </Button>
        {message ? <p role="status" {...props(styles.message)}>{message}</p> : null}
        <Link to="/account/alerts">Open price alert inbox</Link>
      </form>
    </details>
  );
}
