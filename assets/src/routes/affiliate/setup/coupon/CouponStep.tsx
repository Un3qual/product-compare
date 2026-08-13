import type { FormEventHandler } from "react";
import { props } from "@stylexjs/stylex";
import type { AffiliateSetupOperationsCreateCouponMutation } from "$generated/AffiliateSetupOperationsCreateCouponMutation.graphql";
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
import { affiliateWorkflowStyles as styles } from "../affiliate-workflow.stylex";
import { couponDiscountText, type MerchantChoice } from "../affiliate-setup-data";

export type CouponResult = NonNullable<
  NonNullable<AffiliateSetupOperationsCreateCouponMutation["response"]["createCoupon"]>["coupon"]
>;

export function CouponStep({
  error,
  merchantChoices,
  onSelectedMerchantIdChange,
  onSubmit,
  pending,
  result,
  selectedMerchantCopy,
  selectedMerchantValue,
}: {
  error: string | null;
  merchantChoices: readonly MerchantChoice[];
  onSelectedMerchantIdChange: (merchantId: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  pending: boolean;
  result: CouponResult | null;
  selectedMerchantCopy: string | null;
  selectedMerchantValue: string;
}) {
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
        onSubmit={onSubmit}
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
