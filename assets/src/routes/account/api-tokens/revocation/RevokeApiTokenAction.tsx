import { DestructiveActionDialog } from "$ui/components/overlays/DestructiveActionDialog";
import { Button } from "$ui/primitives/Button";

export function RevokeApiTokenAction({
  copy,
  disabled,
  displayLabel,
  onRevoke,
}: {
  copy: string;
  disabled: boolean;
  displayLabel: string;
  onRevoke: () => void;
}) {
  return (
    <DestructiveActionDialog
      confirmLabel="Revoke token"
      description={`Revoking ${displayLabel} will stop integrations that use this API token.`}
      disabled={disabled}
      onConfirm={onRevoke}
      title="Revoke this API token?"
      trigger={
        <Button disabled={disabled} variant="destructive" type="button">
          {copy}
        </Button>
      }
    />
  );
}
