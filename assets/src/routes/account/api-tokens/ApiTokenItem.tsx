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
  tokenHeader: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "0.65rem",
    justifyContent: "space-between",
  },
  tokenTitle: {
    fontSize: "1.2rem",
    margin: 0,
  },
  tokenDetails: {
    display: "grid",
    gap: "1rem",
    margin: 0,
  },
  tokenIdentity: {
    borderInlineStartColor: tokens.actionAccent,
    borderInlineStartStyle: "solid",
    borderInlineStartWidth: "2px",
    display: "grid",
    gap: "0.25rem",
    paddingInlineStart: "0.75rem",
  },
  detailLabel: {
    color: tokens.textSecondary,
    fontFamily: tokens.fontMono,
    fontSize: "0.7rem",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
  },
  tokenPrefix: {
    fontFamily: tokens.fontMono,
    fontSize: "1rem",
    fontWeight: 650,
    margin: 0,
    overflowWrap: "anywhere",
  },
  tokenLifecycle: {
    borderBlockStartColor: tokens.borderQuiet,
    borderBlockStartStyle: "solid",
    borderBlockStartWidth: "1px",
    display: "grid",
    gap: "0.75rem 1.25rem",
    gridTemplateColumns: "repeat(auto-fit, minmax(10rem, 1fr))",
    paddingBlockStart: "0.85rem",
  },
  lifecycleItem: {
    display: "grid",
    gap: "0.2rem",
  },
  lifecycleValue: {
    color: tokens.textSecondary,
    fontSize: "0.9rem",
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
        <div data-slot="api-token-header" {...props(styles.tokenHeader)}>
          <h2 {...props(styles.tokenTitle)}>{displayLabel}</h2>
          <StatusBadge tone={displayData.statusTone}>{displayData.statusLabel}</StatusBadge>
        </div>
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
    <dl {...props(styles.tokenDetails)}>
      <div data-slot="api-token-identity" {...props(styles.tokenIdentity)}>
        <dt {...props(styles.detailLabel)}>Token prefix</dt>
        <dd {...props(styles.tokenPrefix)}>{token.tokenPrefix}</dd>
      </div>
      <div data-slot="api-token-lifecycle" {...props(styles.tokenLifecycle)}>
        <div {...props(styles.lifecycleItem)}>
          <dt {...props(styles.detailLabel)}>Created</dt>
          <dd {...props(styles.lifecycleValue)}>{displayData.insertedAtLabel}</dd>
        </div>
        <div {...props(styles.lifecycleItem)}>
          <dt {...props(styles.detailLabel)}>Expires</dt>
          <dd {...props(styles.lifecycleValue)}>{displayData.expiresAtLabel}</dd>
        </div>
        <div {...props(styles.lifecycleItem)}>
          <dt {...props(styles.detailLabel)}>Last used</dt>
          <dd {...props(styles.lifecycleValue)}>{displayData.lastUsedAtLabel}</dd>
        </div>
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
