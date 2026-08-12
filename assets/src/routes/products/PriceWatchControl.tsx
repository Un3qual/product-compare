import { type FormEvent, useId, useState } from "react";
import { create, props } from "@stylexjs/stylex";
import { Link } from "react-router-dom";
import { useMutation } from "react-relay";
import type { AlertOperationsCreatePriceWatchMutation } from "$generated/AlertOperationsCreatePriceWatchMutation.graphql";
import { Button } from "$ui/primitives/Button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "$ui/primitives/Collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "$ui/primitives/Select";
import { Input } from "$ui/primitives/Input";
import { Label } from "$ui/primitives/Label";
import { commitRouteMutationPromise } from "../relay-mutations";
import { DEFAULT_ROUTE_ERROR_MESSAGE } from "../route-errors";
import {
  buildCreatePriceWatchInput,
  getPriceWatchAmountFieldData,
  priceWatchRuleTypeFromValue,
  resolveCreatePriceWatchMutationMessage,
  type PriceWatchRuleType,
} from "./price-watch-data";
import { createPriceWatchMutation } from "../account/alerts/AlertOperations";

const styles = create({
  content: {
    display: {
      default: "block",
      ":where([data-closed])": "none",
    },
  },
  details: {
    borderBlockStart: "1px solid var(--pc-border-quiet)",
    paddingBlockStart: "0.85rem",
  },
  form: { display: "grid", gap: "0.75rem", paddingBlockStart: "0.8rem" },
  field: { display: "grid", gap: "0.35rem" },
  input: {
    backgroundColor: "var(--pc-surface)",
    border: "1px solid var(--pc-border-emphasized)",
    borderRadius: "0.4rem",
    color: "var(--pc-text)",
    minHeight: "2.6rem",
    paddingInline: "0.7rem",
  },
  message: { color: "var(--pc-text-secondary)", margin: 0 },
});

const PRICE_WATCH_RULE_OPTIONS = [
  { label: "Landed price reaches a target", value: "TARGET_PRICE" },
  {
    label: "Landed price drops by a percentage",
    value: "PERCENTAGE_DROP",
  },
  { label: "An offer returns in stock", value: "BACK_IN_STOCK" },
  {
    label: "A qualifying offer becomes available",
    value: "NEWLY_AVAILABLE",
  },
];

export function PriceWatchControl({ productId }: { productId: string }) {
  return <PriceWatchForm key={productId} productId={productId} />;
}

function PriceWatchForm({ productId }: { productId: string }) {
  const amountId = useId();
  const currencyId = useId();
  const ruleId = useId();
  const [ruleType, setRuleType] = useState<PriceWatchRuleType>("TARGET_PRICE");
  const [message, setMessage] = useState<string | null>(null);
  const [commitCreate, mutationPending] =
    useMutation<AlertOperationsCreatePriceWatchMutation>(createPriceWatchMutation);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const input = buildCreatePriceWatchInput({
      productId,
      ruleType,
      amount: form.get("amount"),
      currency: form.get("currency"),
    });

    try {
      const { response, graphQLErrors } = await commitRouteMutationPromise(commitCreate, {
        variables: { input },
      });
      const payload = response.createPriceWatch;
      setMessage(resolveCreatePriceWatchMutationMessage(payload, graphQLErrors));
    } catch {
      setMessage(DEFAULT_ROUTE_ERROR_MESSAGE);
    }
  }

  const amountField = getPriceWatchAmountFieldData(ruleType);

  return (
    <Collapsible style={styles.details}>
      <CollapsibleTrigger render={<Button variant="link" />}>
        Watch price or availability
      </CollapsibleTrigger>
      <CollapsibleContent keepMounted style={styles.content}>
        <form onSubmit={handleSubmit} {...props(styles.form)}>
          <PriceWatchRuleField id={ruleId} onChange={setRuleType} value={ruleType} />
          <Label htmlFor={currencyId} style={styles.field}>
            Currency
            <Input
              id={currencyId}
              name="currency"
              defaultValue="USD"
              maxLength={3}
              required
              style={styles.input}
            />
          </Label>
          <PriceWatchAmountField amountField={amountField} id={amountId} />
          <Button disabled={mutationPending} type="submit">
            {mutationPending ? "Creating watch…" : "Create watch"}
          </Button>
          {message ? (
            <p role="status" {...props(styles.message)}>
              {message}
            </p>
          ) : null}
          <Link to="/account/alerts">Open price alert inbox</Link>
        </form>
      </CollapsibleContent>
    </Collapsible>
  );
}

function PriceWatchRuleField({
  id,
  onChange,
  value,
}: {
  id: string;
  onChange: (value: PriceWatchRuleType) => void;
  value: PriceWatchRuleType;
}) {
  return (
    <Label htmlFor={id} style={styles.field}>
      Alert when
      <Select
        items={PRICE_WATCH_RULE_OPTIONS}
        name="ruleType"
        onValueChange={(nextValue) => onChange(priceWatchRuleTypeFromValue(nextValue ?? ""))}
        value={value}
      >
        <SelectTrigger id={id} style={styles.input}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PRICE_WATCH_RULE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Label>
  );
}

function PriceWatchAmountField({
  amountField,
  id,
}: {
  amountField: ReturnType<typeof getPriceWatchAmountFieldData>;
  id: string;
}) {
  if (!amountField.visible) {
    return null;
  }

  return (
    <Label htmlFor={id} style={styles.field}>
      {amountField.label}
      <Input
        id={id}
        name="amount"
        inputMode="decimal"
        min="0.01"
        step="0.01"
        required
        style={styles.input}
      />
    </Label>
  );
}
