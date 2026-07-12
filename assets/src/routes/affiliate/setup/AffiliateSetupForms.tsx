import { type FormEventHandler, type ReactElement } from "react";
import { create, props } from "@stylexjs/stylex";
import type { CreateCouponMutation } from "../../../__generated__/CreateCouponMutation.graphql";
import type { UpsertAffiliateLinkMutation } from "../../../__generated__/UpsertAffiliateLinkMutation.graphql";
import type { UpsertAffiliateNetworkMutation } from "../../../__generated__/UpsertAffiliateNetworkMutation.graphql";
import type { UpsertAffiliateProgramMutation } from "../../../__generated__/UpsertAffiliateProgramMutation.graphql";
import { Button } from "../../../ui/primitives/Button";
import { TextField } from "../../../ui/primitives/TextField";
import { tokens } from "../../../ui/theme/tokens.stylex";

export type MerchantChoice = {
  domain: string;
  id: string;
  name: string;
};

export type NetworkResult = NonNullable<
  NonNullable<
    UpsertAffiliateNetworkMutation["response"]["upsertAffiliateNetwork"]
  >["network"]
>;

export type ProgramResult = NonNullable<
  NonNullable<
    UpsertAffiliateProgramMutation["response"]["upsertAffiliateProgram"]
  >["program"]
>;

export type LinkResult = NonNullable<
  NonNullable<UpsertAffiliateLinkMutation["response"]["upsertAffiliateLink"]>["link"]
>;

export type CouponResult = NonNullable<
  NonNullable<CreateCouponMutation["response"]["createCoupon"]>["coupon"]
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
    padding: "1.15rem"
  }
});

export function AffiliateNetworkForm({
  error,
  onSubmit,
  pending,
  result
}: {
  error: string | null;
  onSubmit: FormEventHandler<HTMLFormElement>;
  pending: boolean;
  result: NetworkResult | null;
}): ReactElement {
  return (
    <form aria-label="Save affiliate network" method="post" onSubmit={onSubmit} {...props(styles.form)}>
      <h2>Network</h2>
      <label>
        Network name
        <TextField autoComplete="off" name="networkName" type="text" />
      </label>
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
  selectedMerchantSummary,
  selectedMerchantValue
}: {
  affiliateNetworkId: string;
  error: string | null;
  merchantChoices: MerchantChoice[];
  onAffiliateNetworkIdChange: (value: string) => void;
  onSelectedMerchantIdChange: (merchantId: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  pending: boolean;
  result: ProgramResult | null;
  selectedMerchantSummary: string | null;
  selectedMerchantValue: string;
}): ReactElement {
  return (
    <form aria-label="Save affiliate program" method="post" onSubmit={onSubmit} {...props(styles.form)}>
      <h2>Program</h2>
      {selectedMerchantSummary ? <p>{`Selected merchant: ${selectedMerchantSummary}`}</p> : null}
      <label>
        Affiliate network ID
        <TextField
          autoComplete="off"
          name="affiliateNetworkId"
          onChange={(event) => onAffiliateNetworkIdChange(event.currentTarget.value)}
          type="text"
          value={affiliateNetworkId}
        />
      </label>
      <MerchantSelect
        merchantChoices={merchantChoices}
        onSelectedMerchantIdChange={onSelectedMerchantIdChange}
        selectedMerchantValue={selectedMerchantValue}
      />
      <label>
        Program code
        <TextField autoComplete="off" name="programCode" type="text" />
      </label>
      <label>
        Program status
        <TextField autoComplete="off" name="programStatus" type="text" />
      </label>
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
  selectedMerchantSummary
}: {
  error: string | null;
  onSubmit: FormEventHandler<HTMLFormElement>;
  pending: boolean;
  result: LinkResult | null;
  selectedMerchantSummary: string | null;
}): ReactElement {
  return (
    <form aria-label="Save affiliate link" method="post" onSubmit={onSubmit} {...props(styles.form)}>
      <h2>Link</h2>
      {selectedMerchantSummary ? <p>{`Selected merchant: ${selectedMerchantSummary}`}</p> : null}
      <label>
        Merchant product ID
        <TextField autoComplete="off" name="merchantProductId" type="text" />
      </label>
      <label>
        Link affiliate network ID
        <TextField autoComplete="off" name="linkAffiliateNetworkId" type="text" />
      </label>
      <label>
        Original URL
        <TextField autoComplete="off" name="originalUrl" type="url" />
      </label>
      <label>
        Affiliate URL
        <TextField autoComplete="off" name="affiliateUrl" type="url" />
      </label>
      <label>
        Last verified at
        <input name="lastVerifiedAt" type="datetime-local" />
      </label>
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
  selectedMerchantSummary,
  selectedMerchantValue
}: {
  error: string | null;
  merchantChoices: MerchantChoice[];
  onSelectedMerchantIdChange: (merchantId: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  pending: boolean;
  result: CouponResult | null;
  selectedMerchantSummary: string | null;
  selectedMerchantValue: string;
}): ReactElement {
  return (
    <form aria-label="Create affiliate coupon" method="post" onSubmit={onSubmit} {...props(styles.form)}>
      <h2>Coupon</h2>
      {selectedMerchantSummary ? <p>{`Selected merchant: ${selectedMerchantSummary}`}</p> : null}
      <MerchantSelect
        label="Coupon merchant"
        merchantChoices={merchantChoices}
        name="couponMerchantId"
        onSelectedMerchantIdChange={onSelectedMerchantIdChange}
        selectedMerchantValue={selectedMerchantValue}
      />
      <label>
        Coupon affiliate network ID
        <TextField autoComplete="off" name="couponAffiliateNetworkId" type="text" />
      </label>
      <label>
        Coupon code
        <TextField autoComplete="off" name="couponCode" type="text" />
      </label>
      <label>
        Description
        <TextField autoComplete="off" name="couponDescription" type="text" />
      </label>
      <DiscountTypeSelect />
      <label>
        Discount value
        <TextField autoComplete="off" name="discountValue" type="text" />
      </label>
      <label>
        Currency
        <TextField autoComplete="off" maxLength={3} name="currency" type="text" />
      </label>
      <label>
        Valid from
        <input name="validFrom" type="datetime-local" />
      </label>
      <label>
        Valid to
        <input name="validTo" type="datetime-local" />
      </label>
      <label>
        Terms
        <TextField autoComplete="off" name="terms" type="text" />
      </label>
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
  selectedMerchantValue
}: {
  label?: string;
  merchantChoices: MerchantChoice[];
  name?: string;
  onSelectedMerchantIdChange: (merchantId: string) => void;
  selectedMerchantValue: string;
}) {
  return (
    <label>
      {label}
      <select
        name={name}
        onChange={(event) => onSelectedMerchantIdChange(event.currentTarget.value)}
        value={selectedMerchantValue}
      >
        {merchantChoices.map((merchant) => (
          <option key={merchant.id} value={merchant.id}>
            {merchant.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function DiscountTypeSelect() {
  return (
    <label>
      Discount type
      <select defaultValue="OTHER" name="discountType">
        <option value="OTHER">OTHER</option>
        <option value="PERCENT">PERCENT</option>
        <option value="AMOUNT">AMOUNT</option>
        <option value="FREE_SHIPPING">FREE_SHIPPING</option>
      </select>
    </label>
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

function couponDiscountText(coupon: CouponResult) {
  const value = coupon.discountValue == null ? null : String(coupon.discountValue);

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
