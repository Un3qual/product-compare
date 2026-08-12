import { type FormEvent, useId, useRef } from "react";
import { create, props } from "@stylexjs/stylex";
import { graphql, useFragment } from "react-relay";
import type { ApiTokenItem_token$key } from "$generated/ApiTokenItem_token.graphql";
import { StatusBadge } from "$ui/components/status/StatusBadge";
import { DestructiveActionDialog } from "$ui/components/overlays/DestructiveActionDialog";
import { Button } from "$ui/primitives/Button";
import { Input } from "$ui/primitives/Input";
import { tokens } from "$ui/theme/tokens.stylex";
import { API_TOKEN_EXPIRES_AT_PRESETS, buildApiTokenExpiresAtInputValue } from "./date-presets";
import {
  buildApiTokenActionPolicy,
  buildApiTokenDisplayData,
  summarizeMutationApiToken,
  type ApiTokenRecord,
} from "./api-token-route-data";

const apiTokenItemFragment = graphql`
  fragment ApiTokenItem_token on ApiToken {
    id
    label
    tokenPrefix
    lastUsedAt
    expiresAt
    revokedAt
    insertedAt
  }
`;

const styles = create({
  item: {
    borderBlockEndColor: tokens.borderQuiet,
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: "1px",
    paddingBlock: "1.25rem",
  },
  token: {
    display: "grid",
    gap: "0.85rem",
  },
  tokenTitle: {
    fontSize: "1.2rem",
    margin: 0,
  },
  rotateForm: {
    backgroundColor: tokens.surfaceMuted,
    borderRadius: "var(--pc-radius-medium)",
    display: "grid",
    gap: "0.75rem",
    padding: "0.9rem",
  },
});

type ApiTokenItemLifecycleProps = {
  onRotate: (token: ApiTokenRecord, form: HTMLFormElement) => void;
  onRevoke: (tokenId: string) => void;
  revokeError: string | null;
  revokePending: boolean;
  rotateError: string | null;
  rotatePending: boolean;
};

export function ApiTokenItem({
  token: fragmentRef,
  tokenUpdate,
  ...lifecycle
}: ApiTokenItemLifecycleProps & {
  token: ApiTokenItem_token$key;
  tokenUpdate?: ApiTokenRecord;
}) {
  const data = useFragment(apiTokenItemFragment, fragmentRef);
  const serverToken = summarizeMutationApiToken(data);

  if (!serverToken) return null;

  const token = tokenUpdate
    ? { ...serverToken, revokedAt: serverToken.revokedAt ?? tokenUpdate.revokedAt }
    : serverToken;

  return <ApiTokenSummaryItem {...lifecycle} token={token} />;
}

export function ApiTokenSummaryItem({
  onRotate,
  onRevoke,
  revokeError,
  revokePending,
  rotateError,
  rotatePending,
  token,
}: ApiTokenItemLifecycleProps & { token: ApiTokenRecord }) {
  const displayData = buildApiTokenDisplayData(token);
  const { displayLabel } = displayData;
  const actionPolicy = buildApiTokenActionPolicy(token, {
    revokePending,
    rotatePending,
  });

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
        <ApiTokenActions
          actionPolicy={actionPolicy}
          displayLabel={displayLabel}
          onRevoke={onRevoke}
          onRotateSubmit={handleRotateSubmit}
          token={token}
        />
      </article>
    </li>
  );
}

function ApiTokenDetails({
  displayData,
  token,
}: {
  displayData: ReturnType<typeof buildApiTokenDisplayData>;
  token: ApiTokenRecord;
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
          <StatusBadge tone={displayData.statusTone}>{displayData.statusLabel}</StatusBadge>
        </dd>
      </div>
    </dl>
  );
}

function ApiTokenRowErrors({
  revokeError,
  rotateError,
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
  actionPolicy,
  displayLabel,
  onRevoke,
  onRotateSubmit,
  token,
}: {
  actionPolicy: ReturnType<typeof buildApiTokenActionPolicy>;
  displayLabel: string;
  onRevoke: (tokenId: string) => void;
  onRotateSubmit: (event: FormEvent<HTMLFormElement>) => void;
  token: ApiTokenRecord;
}) {
  const rotateExpiresAtInputRef = useRef<HTMLInputElement>(null);
  const rotateExpiresAtPresetInputRef = useRef<HTMLInputElement>(null);
  const rotateLabelInputId = useId();
  const rotateLabelId = `${rotateLabelInputId}-label`;

  return (
    <>
      {actionPolicy.rotate.visible ? (
        <form
          aria-label={`Rotate ${displayLabel} API token`}
          onSubmit={onRotateSubmit}
          {...props(styles.rotateForm)}
        >
          <div>
            <span id={rotateLabelId}>{`Replacement label for ${displayLabel}`}</span>
            <Input
              aria-labelledby={rotateLabelId}
              autoComplete="off"
              id={rotateLabelInputId}
              name="label"
              type="text"
            />
          </div>
          <label>
            {`Replacement expiry for ${displayLabel}`}
            <Input
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
                size="sm"
                variant="secondary"
                key={`${token.id}-${preset.label}`}
                onClick={() => {
                  if (rotateExpiresAtInputRef.current) {
                    rotateExpiresAtInputRef.current.value = buildApiTokenExpiresAtInputValue(
                      preset.label,
                      new Date(Date.now()),
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
          <Button disabled={actionPolicy.rotate.disabled} type="submit">
            {actionPolicy.rotate.copy}
          </Button>
        </form>
      ) : null}
      {actionPolicy.revoke.visible ? (
        <DestructiveActionDialog
          confirmLabel="Revoke token"
          description={`Revoking ${displayLabel} will stop integrations that use this API token.`}
          disabled={actionPolicy.revoke.disabled}
          onConfirm={() => onRevoke(token.id)}
          title="Revoke this API token?"
          trigger={
            <Button disabled={actionPolicy.revoke.disabled} variant="destructive" type="button">
              {actionPolicy.revoke.copy}
            </Button>
          }
        />
      ) : null}
    </>
  );
}
