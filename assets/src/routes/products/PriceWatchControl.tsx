import { type FormEvent, useId, useState } from "react";
import { create, props } from "@stylexjs/stylex";
import { Link } from "react-router-dom";
import { useMutation } from "react-relay";
import type { CreatePriceWatchMutation } from "../../__generated__/CreatePriceWatchMutation.graphql";
import { Button } from "../../ui/primitives/Button";
import { commitRouteMutationPromise } from "../relay-mutations";
import { DEFAULT_ROUTE_ERROR_MESSAGE, routeMutationErrorMessage } from "../route-errors";
import createPriceWatchMutation from "../account/alerts/queries/CreatePriceWatchMutation";

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

type RuleType = "TARGET_PRICE" | "PERCENTAGE_DROP" | "BACK_IN_STOCK" | "NEWLY_AVAILABLE";

export function PriceWatchControl({ productId }: { productId: string }) {
  const amountId = useId();
  const currencyId = useId();
  const ruleId = useId();
  const [ruleType, setRuleType] = useState<RuleType>("TARGET_PRICE");
  const [message, setMessage] = useState<string | null>(null);
  const [commitCreate, mutationPending] = useMutation<CreatePriceWatchMutation>(createPriceWatchMutation);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const currency = String(form.get("currency") ?? "USD").trim().toUpperCase();
    const amount = String(form.get("amount") ?? "").trim();
    const input: CreatePriceWatchMutation["variables"]["input"] = { productId, ruleType, currency };

    if (ruleType === "TARGET_PRICE") input.targetAmount = amount;
    if (ruleType === "PERCENTAGE_DROP") input.percentageDrop = amount;

    try {
      const { response, graphQLErrors } = await commitRouteMutationPromise(commitCreate, { variables: { input } });
      const payload = response.createPriceWatch;
      setMessage(payload?.watch ? "Watch created. New qualifying changes will appear in your inbox." : routeMutationErrorMessage(payload?.errors, graphQLErrors));
    } catch {
      setMessage(DEFAULT_ROUTE_ERROR_MESSAGE);
    }
  }

  const needsAmount = ruleType === "TARGET_PRICE" || ruleType === "PERCENTAGE_DROP";

  return (
    <details {...props(styles.details)}>
      <summary {...props(styles.summary)}>Watch price or availability</summary>
      <form onSubmit={handleSubmit} {...props(styles.form)}>
        <label htmlFor={ruleId} {...props(styles.field)}>
          Alert when
          <select id={ruleId} name="ruleType" value={ruleType} onChange={(event) => setRuleType(event.target.value as RuleType)} {...props(styles.input)}>
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
        {needsAmount ? (
          <label htmlFor={amountId} {...props(styles.field)}>
            {ruleType === "TARGET_PRICE" ? "Target landed price" : "Percentage drop"}
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
