import { type FormEventHandler, type ReactElement } from "react";
import { create, props } from "@stylexjs/stylex";
import type { AffiliateSetupOperationsCreateCouponMutation } from "$generated/AffiliateSetupOperationsCreateCouponMutation.graphql";
import type { AffiliateSetupOperationsUpsertAffiliateLinkMutation } from "$generated/AffiliateSetupOperationsUpsertAffiliateLinkMutation.graphql";
import type { AffiliateSetupOperationsUpsertAffiliateNetworkMutation } from "$generated/AffiliateSetupOperationsUpsertAffiliateNetworkMutation.graphql";
import type { AffiliateSetupOperationsUpsertAffiliateProgramMutation } from "$generated/AffiliateSetupOperationsUpsertAffiliateProgramMutation.graphql";
import { Button } from "$ui/primitives/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "$ui/primitives/Select";
import { Input } from "$ui/primitives/Input";
import { Label } from "$ui/primitives/Label";
import { tokens } from "$ui/theme/tokens.stylex";
import { couponDiscountText } from "./affiliate-setup-data";

export type MerchantChoice = {
  domain: string;
  id: string;
  name: string;
};

export type NetworkResult = NonNullable<
  NonNullable<
    AffiliateSetupOperationsUpsertAffiliateNetworkMutation["response"]["upsertAffiliateNetwork"]
  >["network"]
>;

export type ProgramResult = NonNullable<
  NonNullable<
    AffiliateSetupOperationsUpsertAffiliateProgramMutation["response"]["upsertAffiliateProgram"]
  >["program"]
>;

export type LinkResult = NonNullable<
  NonNullable<
    AffiliateSetupOperationsUpsertAffiliateLinkMutation["response"]["upsertAffiliateLink"]
  >["link"]
>;

export type CouponResult = NonNullable<
  NonNullable<AffiliateSetupOperationsCreateCouponMutation["response"]["createCoupon"]>["coupon"]
>;

const styles = create({
  form: {
    backgroundColor: tokens.surfaceMuted,
    borderColor: tokens.borderQuiet,
    borderRadius: "var(--pc-radius-large)",
    borderStyle: "solid",
    borderWidth: "1px",
    display: "grid",
    gap: "1rem",
    gridTemplateColumns: "repeat(auto-fit, minmax(14rem, 1fr))",
    padding: "1.15rem",
  },
});

export function AffiliateNetworkForm({
  error,
  onSubmit,
  pending,
  result,
}: {
  error: string | null;
  onSubmit: FormEventHandler<HTMLFormElement>;
  pending: boolean;
  result: NetworkResult | null;
}): ReactElement {
  return (
    <form
      aria-label="Save affiliate network"
      method="post"
      onSubmit={onSubmit}
      {...props(styles.form)}
    >
      <h2>Network</h2>
      <Label>
        Network name
        <Input autoComplete="off" name="networkName" type="text" />
      </Label>
      <Button disabled={pending} type="submit">
        Save network
      </Button>
      {error ? <p role="alert">{error}</p> : null}
      {result ? (
        <section aria-label="Affiliate network result">
          <h3>{result.name}</h3>
          <p>{result.id}</p>
        </section>
      ) : null}
    </form>
  );
}

export function AffiliateProgramForm({
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
  merchantChoices: MerchantChoice[];
  onAffiliateNetworkIdChange: (value: string) => void;
  onSelectedMerchantIdChange: (merchantId: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  pending: boolean;
  result: ProgramResult | null;
  selectedMerchantCopy: string | null;
  selectedMerchantValue: string;
}): ReactElement {
  return (
    <form
      aria-label="Save affiliate program"
      method="post"
      onSubmit={onSubmit}
      {...props(styles.form)}
    >
      <h2>Program</h2>
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
      <MerchantSelect
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
      {error ? <p role="alert">{error}</p> : null}
      {result ? (
        <section aria-label="Affiliate program result">
          <h3>{result.programCode ?? "Affiliate program"}</h3>
          <p>{result.id}</p>
          {result.status ? <p>{result.status}</p> : null}
        </section>
      ) : null}
    </form>
  );
}

export function AffiliateLinkForm({
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
}): ReactElement {
  return (
    <form
      aria-label="Save affiliate link"
      method="post"
      onSubmit={onSubmit}
      {...props(styles.form)}
    >
      <h2>Link</h2>
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
      {error ? <p role="alert">{error}</p> : null}
      {result ? (
        <section aria-label="Affiliate link result">
          <h3>{result.id}</h3>
          <p>{result.affiliateUrl}</p>
        </section>
      ) : null}
    </form>
  );
}

export function AffiliateCouponForm({
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
  merchantChoices: MerchantChoice[];
  onSelectedMerchantIdChange: (merchantId: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  pending: boolean;
  result: CouponResult | null;
  selectedMerchantCopy: string | null;
  selectedMerchantValue: string;
}): ReactElement {
  return (
    <form
      aria-label="Create affiliate coupon"
      method="post"
      onSubmit={onSubmit}
      {...props(styles.form)}
    >
      <h2>Coupon</h2>
      {selectedMerchantCopy ? <p>{selectedMerchantCopy}</p> : null}
      <MerchantSelect
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
      {error ? <p role="alert">{error}</p> : null}
      {result ? <CouponResultPanel coupon={result} /> : null}
    </form>
  );
}

function MerchantSelect({
  label = "Merchant",
  merchantChoices,
  name = "merchantId",
  onSelectedMerchantIdChange,
  selectedMerchantValue,
}: {
  label?: string;
  merchantChoices: MerchantChoice[];
  name?: string;
  onSelectedMerchantIdChange: (merchantId: string) => void;
  selectedMerchantValue: string;
}) {
  const options = merchantChoices.map((merchant) => ({
    label: merchant.name,
    value: merchant.id,
  }));

  return (
    <Label>
      {label}
      <Select
        items={options}
        name={name}
        onValueChange={(value) => onSelectedMerchantIdChange(value ?? "")}
        value={selectedMerchantValue}
      >
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
    <section aria-label="Coupon result">
      <h3>{coupon.code}</h3>
      <p>{coupon.id}</p>
      {discountText ? <p>{discountText}</p> : null}
    </section>
  );
}
