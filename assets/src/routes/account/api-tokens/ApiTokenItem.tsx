import { type FormEvent, useId, useRef } from "react";
import { create, props } from "@stylexjs/stylex";
import { StatusBadge } from "../../../ui/components/status/StatusBadge";
import { Button } from "../../../ui/primitives/Button";
import { TextField } from "../../../ui/primitives/TextField";
import { tokens } from "../../../ui/theme/tokens.stylex";
import { apiTokenIsActive } from "./api-token-status";
import {
  API_TOKEN_EXPIRES_AT_PRESETS,
  buildApiTokenExpiresAtInputValue
} from "./date-presets";
import { buildApiTokenDisplayData } from "./api-token-route-data";
import type { ApiTokenSummary } from "./loader";

const styles = create({
  item: {
    borderBlockEndColor: tokens.borderQuiet,
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: "1px",
    paddingBlock: "1.25rem"
  },
  token: {
    display: "grid",
    gap: "0.85rem"
  },
  tokenTitle: {
    fontSize: "1.2rem",
    margin: 0
  },
  rotateForm: {
    backgroundColor: tokens.surfaceMuted,
    borderRadius: "var(--pc-radius-medium)",
    display: "grid",
    gap: "0.75rem",
    padding: "0.9rem"
  }
});

type ApiTokenItemProps = {
  onRotate: (token: ApiTokenSummary, form: HTMLFormElement) => void;
  onRevoke: (tokenId: string) => void;
  revokeError: string | null;
  revokePending: boolean;
  rotateError: string | null;
  rotatePending: boolean;
  token: ApiTokenSummary;
};

export function ApiTokenItem({
  onRotate,
  onRevoke,
  revokeError,
  revokePending,
  rotateError,
  rotatePending,
  token
}: ApiTokenItemProps) {
  const displayData = buildApiTokenDisplayData(token);
  const { displayLabel } = displayData;
  const lifecyclePending = revokePending || rotatePending;

  function handleRotateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onRotate(token, event.currentTarget);
  }

  return (
    <li {...props(styles.item)}>
      <article {...props(styles.token)}>
        <h2 {...props(styles.tokenTitle)}>{displayLabel}</h2>
        <ApiTokenDetails displayData={displayData} token={token} />
        <ApiTokenRowErrors revokeError={revokeError} rotateError={rotateError} />
        {token.revokedAt ? null : (
          <ApiTokenActions
            displayLabel={displayLabel}
            lifecyclePending={lifecyclePending}
            onRevoke={onRevoke}
            onRotateSubmit={handleRotateSubmit}
            revokePending={revokePending}
            rotatePending={rotatePending}
            token={token}
          />
        )}
      </article>
    </li>
  );
}

function ApiTokenDetails({
  displayData,
  token
}: {
  displayData: ReturnType<typeof buildApiTokenDisplayData>;
  token: ApiTokenSummary;
}) {
  return (
    <dl>
      <div>
        <dt>Token prefix</dt>
        <dd>{token.tokenPrefix}</dd>
      </div>
      <div>
        <dt>Expires</dt>
        <dd>{displayData.expiresAtLabel}</dd>
      </div>
      <div>
        <dt>Last used</dt>
        <dd>{displayData.lastUsedAtLabel}</dd>
      </div>
      <div>
        <dt>Created</dt>
        <dd>{displayData.insertedAtLabel}</dd>
      </div>
      <div>
        <dt>Status</dt>
        <dd>
          <StatusBadge tone={apiTokenIsActive(token) ? "positive" : "neutral"}>
            {displayData.statusLabel}
          </StatusBadge>
        </dd>
      </div>
    </dl>
  );
}

function ApiTokenRowErrors({
  revokeError,
  rotateError
}: {
  revokeError: string | null;
  rotateError: string | null;
}) {
  return (
    <>
      {rotateError ? <p role="alert">{rotateError}</p> : null}
      {revokeError ? <p role="alert">{revokeError}</p> : null}
    </>
  );
}

function ApiTokenActions({
  displayLabel,
  lifecyclePending,
  onRevoke,
  onRotateSubmit,
  revokePending,
  rotatePending,
  token
}: {
  displayLabel: string;
  lifecyclePending: boolean;
  onRevoke: (tokenId: string) => void;
  onRotateSubmit: (event: FormEvent<HTMLFormElement>) => void;
  revokePending: boolean;
  rotatePending: boolean;
  token: ApiTokenSummary;
}) {
  const rotateExpiresAtInputRef = useRef<HTMLInputElement>(null);
  const rotateExpiresAtPresetInputRef = useRef<HTMLInputElement>(null);
  const rotateLabelInputId = useId();
  const rotateLabelId = `${rotateLabelInputId}-label`;
  const tokenActive = apiTokenIsActive(token);

  return (
    <>
      {tokenActive ? (
        <form
          aria-label={`Rotate ${displayLabel} API token`}
          onSubmit={onRotateSubmit}
          {...props(styles.rotateForm)}
        >
          <div>
            <span id={rotateLabelId}>{`Replacement label for ${displayLabel}`}</span>
            <TextField
              aria-labelledby={rotateLabelId}
              autoComplete="off"
              id={rotateLabelInputId}
              name="label"
              type="text"
            />
          </div>
          <label>
            {`Replacement expiry for ${displayLabel}`}
            <input
              name="expiresAt"
              onChange={() => {
                if (rotateExpiresAtPresetInputRef.current) {
                  rotateExpiresAtPresetInputRef.current.value = "";
                }
              }}
              ref={rotateExpiresAtInputRef}
              type="datetime-local"
            />
          </label>
          <input name="expiresAtPreset" ref={rotateExpiresAtPresetInputRef} type="hidden" />
          <div>
            {API_TOKEN_EXPIRES_AT_PRESETS.map((preset) => (
              <Button
                size="1"
                variant="soft"
                key={`${token.id}-${preset.label}`}
                onClick={() => {
                  if (rotateExpiresAtInputRef.current) {
                    rotateExpiresAtInputRef.current.value = buildApiTokenExpiresAtInputValue(
                      preset.label,
                      new Date(Date.now())
                    );
                  }
                  if (rotateExpiresAtPresetInputRef.current) {
                    rotateExpiresAtPresetInputRef.current.value = preset.label;
                  }
                }}
                type="button"
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <Button disabled={lifecyclePending} type="submit">
            {rotatePending ? "Rotating token..." : "Rotate token"}
          </Button>
        </form>
      ) : null}
      <Button
        disabled={lifecyclePending}
        onClick={() => onRevoke(token.id)}
        tone="danger"
        type="button"
      >
        {revokePending ? "Revoking token..." : "Revoke token"}
      </Button>
    </>
  );
}
