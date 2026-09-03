import { type FormEvent, useRef, useState } from "react";
import { props } from "@stylexjs/stylex";
import { useMutation } from "react-relay";
import type { AffiliateSetupOperationsCreateCouponMutation } from "$generated/AffiliateSetupOperationsCreateCouponMutation.graphql";
import { DEFAULT_MUTATION_ERROR_MESSAGE } from "$relay/mutation-errors";
import { commitRouteMutationPromise } from "$relay/mutations";
import { Button } from "$ui/primitives/Button";
import { Input } from "$ui/primitives/Input";
import { Label } from "$ui/primitives/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "$ui/primitives/Select";
import { MerchantChoiceSelect } from "../MerchantChoiceSelect";
import {
  createCouponMutation,
  resolveAffiliateCouponMutationOutcome,
} from "../AffiliateSetupOperations";
import { buildCouponVariables, formDataToScalarValues } from "../affiliate-form-values";
import { affiliateWorkflowStyles as styles } from "../affiliate-workflow.stylex";
import type { MerchantChoice } from "../merchant-context";

type CouponResult = NonNullable<
  NonNullable<AffiliateSetupOperationsCreateCouponMutation["response"]["createCoupon"]>["coupon"]
>;

export function CouponStep({
  merchantChoices,
  onSelectedMerchantIdChange,
  selectedMerchantCopy,
  selectedMerchantValue,
}: {
  merchantChoices: readonly MerchantChoice[];
  onSelectedMerchantIdChange: (merchantId: string) => void;
  selectedMerchantCopy: string | null;
  selectedMerchantValue: string;
}) {
  const [commitCreateCoupon] =
    useMutation<AffiliateSetupOperationsCreateCouponMutation>(createCouponMutation);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<CouponResult | null>(null);
  const inFlightRef = useRef(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (inFlightRef.current) return;

    inFlightRef.current = true;
    setPending(true);
    setError(null);
    setResult(null);

    try {
      const { response, graphQLErrors } = await commitRouteMutationPromise(commitCreateCoupon, {
        variables: buildCouponVariables(formDataToScalarValues(new FormData(event.currentTarget))),
      });
      const outcome = resolveAffiliateCouponMutationOutcome(response.createCoupon, graphQLErrors);

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
    <section aria-label="Step 4: Coupon" {...props(styles.step)}>
      <header {...props(styles.stepHeader)}>
        <p {...props(styles.eyebrow)}>Step 4</p>
        <h2 {...props(styles.heading)}>4. Coupon</h2>
        <p {...props(styles.description)}>
          Add an eligible merchant offer without obscuring validity or discount facts.
        </p>
      </header>
      <form
        aria-label="Create affiliate coupon"
        method="post"
        onSubmit={handleSubmit}
        {...props(styles.form)}
      >
        {selectedMerchantCopy ? <p>{selectedMerchantCopy}</p> : null}
        <MerchantChoiceSelect
          label="Coupon merchant"
          merchantChoices={merchantChoices}
          name="couponMerchantId"
          onSelectedMerchantIdChange={onSelectedMerchantIdChange}
          selectedMerchantValue={selectedMerchantValue}
        />
        <Label>
          Coupon affiliate network ID
          <Input autoComplete="off" name="couponAffiliateNetworkId" type="text" />
        </Label>
        <Label>
          Coupon code
          <Input autoComplete="off" name="couponCode" type="text" />
        </Label>
        <Label>
          Description
          <Input autoComplete="off" name="couponDescription" type="text" />
        </Label>
        <DiscountTypeSelect />
        <Label>
          Discount value
          <Input autoComplete="off" name="discountValue" type="text" />
        </Label>
        <Label>
          Currency
          <Input autoComplete="off" maxLength={3} name="currency" type="text" />
        </Label>
        <Label>
          Valid from
          <Input name="validFrom" type="datetime-local" />
        </Label>
        <Label>
          Valid to
          <Input name="validTo" type="datetime-local" />
        </Label>
        <Label>
          Terms
          <Input autoComplete="off" name="terms" type="text" />
        </Label>
        <Button disabled={pending} type="submit">
          Create coupon
        </Button>
        {error ? (
          <p role="alert" {...props(styles.feedback)}>
            {error}
          </p>
        ) : null}
        {result ? <CouponResultPanel coupon={result} /> : null}
      </form>
    </section>
  );
}

function DiscountTypeSelect() {
  const options = ["OTHER", "PERCENT", "AMOUNT", "FREE_SHIPPING"].map((value) => ({
    label: value,
    value,
  }));

  return (
    <Label>
      Discount type
      <Select defaultValue="OTHER" items={options} name="discountType">
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Label>
  );
}

function CouponResultPanel({ coupon }: { coupon: CouponResult }) {
  const discountText = couponDiscountText(coupon);

  return (
    <section aria-label="Coupon result" {...props(styles.result)}>
      <h3>{coupon.code}</h3>
      <p>{coupon.id}</p>
      {discountText ? <p>{discountText}</p> : null}
    </section>
  );
}

export function couponDiscountText(
  coupon: Pick<CouponResult, "currency" | "discountType" | "discountValue">,
) {
  const value = coupon.discountValue;

  switch (coupon.discountType) {
    case "AMOUNT":
      return value && coupon.currency ? `${value} ${coupon.currency}` : null;
    case "PERCENT":
      return value ? `${value}% off` : null;
    case "FREE_SHIPPING":
      return "Free shipping";
    case "OTHER":
      return value ? `${value} off` : "Other discount";
    default:
      return null;
  }
}
