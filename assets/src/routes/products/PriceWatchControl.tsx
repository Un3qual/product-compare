import { type ChangeEvent, type FormEvent, useEffect, useId, useState } from "react";
import { create, props } from "@stylexjs/stylex";
import { Link, useLocation, useOutletContext } from "react-router-dom";
import { useMutation } from "react-relay";
import type {
  AlertOperationsCreatePriceWatchMutation,
  CreatePriceWatchInput,
} from "$generated/AlertOperationsCreatePriceWatchMutation.graphql";
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
import { commitRouteMutationPromise } from "$relay/mutations";
import {
  DEFAULT_MUTATION_ERROR_MESSAGE,
  hasGraphQLErrors,
  mutationErrorMessage,
  type MutationGraphQLErrors,
} from "$relay/mutation-errors";
import { createPriceWatchMutation } from "../account/alerts/AlertOperations";
import type { RootViewer } from "../root/viewer";
import {
  PRICE_WATCH_RULE_TYPES,
  consumePendingIntent,
  readPendingIntent,
  safeRelativeReturnPath,
  useAuthenticatedIntent,
  type PendingIntent,
  type PriceWatchIntentDraft,
  type PriceWatchRuleType,
} from "../auth/continuity";

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

const PRICE_WATCH_RULE_LABELS: Readonly<Record<PriceWatchRuleType, string>> = {
  TARGET_PRICE: "Landed price reaches a target",
  PERCENTAGE_DROP: "Landed price drops by a percentage",
  BACK_IN_STOCK: "An offer returns in stock",
  NEWLY_AVAILABLE: "A qualifying offer becomes available",
};

const PRICE_WATCH_RULE_OPTIONS = PRICE_WATCH_RULE_TYPES.map((value) => ({
  label: PRICE_WATCH_RULE_LABELS[value],
  value,
}));

export function PriceWatchControl({ productId }: { productId: string }) {
  return <PriceWatchForm key={productId} productId={productId} />;
}

function PriceWatchForm({ productId }: { productId: string }) {
  const outletContext = useOutletContext<{ viewer: RootViewer | null } | null>();
  const viewer = outletContext?.viewer;
  const location = useLocation();
  const [pendingIntent, setPendingIntent] = useState<PendingIntent | null | undefined>(() =>
    viewer ? readPendingIntent() : undefined,
  );
  const restoredIntent =
    pendingIntent?.kind === "price_watch" && pendingIntent.productId === productId
      ? pendingIntent
      : null;
  const amountId = useId();
  const currencyId = useId();
  const ruleId = useId();
  const [ruleType, setRuleType] = useState<PriceWatchRuleType>(
    restoredIntent?.ruleType ?? "TARGET_PRICE",
  );
  const [amount, setAmount] = useState(restoredIntent?.amount ?? "");
  const [currency, setCurrency] = useState(restoredIntent?.currency ?? "USD");
  const [message, setMessage] = useState<string | null>(
    restoredIntent ? "Your watch draft was restored. Review it before creating the watch." : null,
  );
  const [commitCreate, mutationPending] =
    useMutation<AlertOperationsCreatePriceWatchMutation>(createPriceWatchMutation);

  useEffect(() => {
    if (viewer && pendingIntent === undefined) setPendingIntent(readPendingIntent());
  }, [pendingIntent, viewer]);

  useEffect(() => {
    if (!viewer || !restoredIntent) return;

    setRuleType(restoredIntent.ruleType);
    setAmount(restoredIntent.amount ?? "");
    setCurrency(restoredIntent.currency);
    setMessage("Your watch draft was restored. Review it before creating the watch.");
    consumePendingIntent();
    setPendingIntent(null);
  }, [restoredIntent, viewer]);

  function submitWatch() {
    setMessage(null);
    const input = buildCreatePriceWatchInput({
      productId,
      ruleType,
      amount,
      currency,
    });

    void commitRouteMutationPromise(commitCreate, {
      variables: { input },
    })
      .then(({ response, graphQLErrors }) => {
        setMessage(
          resolveCreatePriceWatchMutationMessage(response.createPriceWatch, graphQLErrors),
        );
      })
      .catch(() => setMessage(DEFAULT_MUTATION_ERROR_MESSAGE));
  }

  const returnTo =
    safeRelativeReturnPath(`${location.pathname}${location.search}${location.hash}`) ?? "/";
  const intent: PriceWatchIntentDraft = {
    kind: "price_watch",
    version: 1,
    returnTo,
    productId,
    ruleType,
    amount: amount.trim() || null,
    currency: currency.trim().toUpperCase(),
  };
  const authenticatedIntent = useAuthenticatedIntent({
    viewer,
    intent,
    onAuthenticated: submitWatch,
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    authenticatedIntent.request();
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
              maxLength={3}
              minLength={3}
              onChange={(event) => setCurrency(event.currentTarget.value)}
              pattern="[A-Za-z]{3}"
              required
              style={styles.input}
              value={currency}
            />
          </Label>
          <PriceWatchAmountField
            amount={amount}
            amountField={amountField}
            id={amountId}
            onChange={setAmount}
          />
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
        {authenticatedIntent.dialog}
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
      <Select<PriceWatchRuleType>
        items={PRICE_WATCH_RULE_OPTIONS}
        name="ruleType"
        onValueChange={(nextValue) => {
          if (nextValue) onChange(nextValue);
        }}
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

function buildCreatePriceWatchInput({
  amount: rawAmount,
  currency: rawCurrency,
  productId,
  ruleType,
}: {
  amount: string;
  currency: string;
  productId: string;
  ruleType: PriceWatchRuleType;
}): CreatePriceWatchInput {
  const amount = rawAmount.trim();
  const currency = rawCurrency.trim().toUpperCase();

  return {
    productId,
    ruleType,
    currency,
    ...(ruleType === "TARGET_PRICE" ? { targetAmount: amount } : {}),
    ...(ruleType === "PERCENTAGE_DROP" ? { percentageDrop: amount } : {}),
  };
}

function resolveCreatePriceWatchMutationMessage(
  payload: AlertOperationsCreatePriceWatchMutation["response"]["createPriceWatch"],
  graphQLErrors: MutationGraphQLErrors = null,
) {
  return payload.watch && !hasGraphQLErrors(graphQLErrors)
    ? "Watch created. New qualifying changes will appear in your inbox."
    : mutationErrorMessage(payload.errors, graphQLErrors);
}

function getPriceWatchAmountFieldData(ruleType: PriceWatchRuleType) {
  switch (ruleType) {
    case "TARGET_PRICE":
      return { visible: true, label: "Target landed price" } as const;
    case "PERCENTAGE_DROP":
      return { visible: true, label: "Percentage drop" } as const;
    default:
      return { visible: false, label: null } as const;
  }
}

function PriceWatchAmountField({
  amount,
  amountField,
  id,
  onChange,
}: {
  amount: string;
  amountField: ReturnType<typeof getPriceWatchAmountFieldData>;
  id: string;
  onChange: (value: string) => void;
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
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.currentTarget.value)}
        inputMode="decimal"
        min="0.01"
        step="0.01"
        required
        style={styles.input}
        value={amount}
      />
    </Label>
  );
}
