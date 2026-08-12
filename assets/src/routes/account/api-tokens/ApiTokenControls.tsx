import type { FormEvent, RefObject } from "react";
import { create, props } from "@stylexjs/stylex";
import { Link } from "react-router-dom";
import { ActionDialog } from "$ui/components/overlays/ActionDialog";
import { Button } from "$ui/primitives/Button";
import { Input } from "$ui/primitives/Input";
import { tokens } from "$ui/theme/tokens.stylex";
import { ApiTokenExpiryField } from "./ApiTokenExpiryField";
import {
  buildApiTokenStatusFilterNavigationData,
  type ApiTokenStatus,
} from "./api-token-route-data";

const styles = create({
  createForm: {
    backgroundColor: tokens.surfaceMuted,
    borderRadius: "var(--pc-radius-large)",
    display: "grid",
    gap: "1rem",
    gridTemplateColumns: "repeat(auto-fit, minmax(14rem, 1fr))",
    padding: "1.15rem",
  },
});

type ApiTokenControlsProps = {
  createDialogOpen: boolean;
  createError: string | null;
  expiresAtInputRef: RefObject<HTMLInputElement | null>;
  expiresAtPresetInputRef: RefObject<HTMLInputElement | null>;
  onCreate: (event: FormEvent<HTMLFormElement>) => void;
  onCreateDialogOpenChange: (open: boolean) => void;
  submitting: boolean;
  tokenStatus: ApiTokenStatus;
};

export function ApiTokenControls({
  createDialogOpen,
  createError,
  expiresAtInputRef,
  expiresAtPresetInputRef,
  onCreate,
  onCreateDialogOpenChange,
  submitting,
  tokenStatus,
}: ApiTokenControlsProps) {
  return (
    <>
      <ApiTokenStatusFilters tokenStatus={tokenStatus} />
      <ActionDialog
        description="Choose a clear label and expiration for this credential."
        onOpenChange={onCreateDialogOpenChange}
        open={createDialogOpen}
        title="Create API token"
        trigger={<Button>Create API token</Button>}
      >
        <CreateApiTokenForm
          expiresAtInputRef={expiresAtInputRef}
          expiresAtPresetInputRef={expiresAtPresetInputRef}
          onSubmit={onCreate}
          submitting={submitting}
        />
        {createError ? <p role="alert">{createError}</p> : null}
      </ActionDialog>
    </>
  );
}

export function OneTimeApiToken({ token }: { token: string }) {
  return (
    <section aria-labelledby="api-token-one-time-heading">
      <h2 id="api-token-one-time-heading">One-time API token</h2>
      <p>Visible only once. Copy this token now before leaving the page.</p>
      <code>{token}</code>
    </section>
  );
}

function CreateApiTokenForm({
  expiresAtInputRef,
  expiresAtPresetInputRef,
  onSubmit,
  submitting,
}: {
  expiresAtInputRef: RefObject<HTMLInputElement | null>;
  expiresAtPresetInputRef: RefObject<HTMLInputElement | null>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  submitting: boolean;
}) {
  return (
    <form aria-label="Create API token" onSubmit={onSubmit} {...props(styles.createForm)}>
      <div>
        <span id="api-token-label">Label</span>
        <Input aria-labelledby="api-token-label" autoComplete="off" name="label" type="text" />
      </div>
      <ApiTokenExpiryField
        inputLabel="Expires at"
        inputRef={expiresAtInputRef}
        presetInputRef={expiresAtPresetInputRef}
      />
      <Button disabled={submitting} type="submit">
        {submitting ? "Creating API token..." : "Create API token"}
      </Button>
    </form>
  );
}

function ApiTokenStatusFilters({ tokenStatus }: { tokenStatus: ApiTokenStatus }) {
  return (
    <nav aria-label="API token status filters">
      <ul>
        {buildApiTokenStatusFilterNavigationData({ tokenStatus }).map((filter) => (
          <li key={filter.status}>
            <Link aria-current={filter.isCurrent ? "page" : undefined} to={filter.href}>
              {filter.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
