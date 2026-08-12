import { type FormEventHandler, type ReactElement } from "react";
import { create, props } from "@stylexjs/stylex";
import type { AffiliateSetupOperationsCreateCouponMutation } from "$generated/AffiliateSetupOperationsCreateCouponMutation.graphql";
import type { AffiliateSetupOperationsUpsertAffiliateLinkMutation } from "$generated/AffiliateSetupOperationsUpsertAffiliateLinkMutation.graphql";
import type { AffiliateSetupOperationsUpsertAffiliateNetworkMutation } from "$generated/AffiliateSetupOperationsUpsertAffiliateNetworkMutation.graphql";
import type { AffiliateSetupOperationsUpsertAffiliateProgramMutation } from "$generated/AffiliateSetupOperationsUpsertAffiliateProgramMutation.graphql";
import { Button } from "$ui/primitives/Button";
import { Select } from "$ui/primitives/Select";
import { TextField } from "$ui/primitives/TextField";
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
  NonNullable<AffiliateSetupOperationsUpsertAffiliateLinkMutation["response"]["upsertAffiliateLink"]>["link"]
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
  selectedMerchantCopy,
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
  selectedMerchantCopy: string | null;
  selectedMerchantValue: string;
}): ReactElement {
  return (
    <form aria-label="Save affiliate program" method="post" onSubmit={onSubmit} {...props(styles.form)}>
      <h2>Program</h2>
      {selectedMerchantCopy ? <p>{selectedMerchantCopy}</p> : null}
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
  selectedMerchantCopy
}: {
  error: string | null;
  onSubmit: FormEventHandler<HTMLFormElement>;
  pending: boolean;
  result: LinkResult | null;
  selectedMerchantCopy: string | null;
}): ReactElement {
  return (
    <form aria-label="Save affiliate link" method="post" onSubmit={onSubmit} {...props(styles.form)}>
      <h2>Link</h2>
      {selectedMerchantCopy ? <p>{selectedMerchantCopy}</p> : null}
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
        <TextField name="lastVerifiedAt" type="datetime-local" />
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
  selectedMerchantCopy,
  selectedMerchantValue
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
    <form aria-label="Create affiliate coupon" method="post" onSubmit={onSubmit} {...props(styles.form)}>
      <h2>Coupon</h2>
      {selectedMerchantCopy ? <p>{selectedMerchantCopy}</p> : null}
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
        <TextField name="validFrom" type="datetime-local" />
      </label>
      <label>
        Valid to
        <TextField name="validTo" type="datetime-local" />
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
      <Select
        name={name}
        onValueChange={onSelectedMerchantIdChange}
        options={merchantChoices.map((merchant) => ({
          label: merchant.name,
          value: merchant.id
        }))}
        value={selectedMerchantValue}
      />
    </label>
  );
}

function DiscountTypeSelect() {
  return (
    <label>
      Discount type
      <Select
        defaultValue="OTHER"
        name="discountType"
        options={["OTHER", "PERCENT", "AMOUNT", "FREE_SHIPPING"].map((value) => ({
          label: value,
          value
        }))}
      />
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
