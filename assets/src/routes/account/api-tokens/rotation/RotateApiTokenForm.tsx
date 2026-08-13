import { type FormEvent, useId, useRef } from "react";
import { create, props } from "@stylexjs/stylex";
import { Button } from "$ui/primitives/Button";
import { Input } from "$ui/primitives/Input";
import { tokens } from "$ui/theme/tokens.stylex";
import { ApiTokenExpiryField } from "../create/ApiTokenExpiryField";

const styles = create({
  form: {
    backgroundColor: tokens.surfaceMuted,
    borderRadius: "var(--pc-radius-medium)",
    display: "grid",
    gap: "0.75rem",
    padding: "0.9rem",
  },
});

export function RotateApiTokenForm({
  copy,
  disabled,
  displayLabel,
  onSubmit,
}: {
  copy: string;
  disabled: boolean;
  displayLabel: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const expiresAtInputRef = useRef<HTMLInputElement>(null);
  const expiresAtPresetInputRef = useRef<HTMLInputElement>(null);
  const labelInputId = useId();
  const labelId = `${labelInputId}-label`;

  return (
    <form
      aria-label={`Rotate ${displayLabel} API token`}
      onSubmit={onSubmit}
      {...props(styles.form)}
    >
      <div>
        <span id={labelId}>{`Replacement label for ${displayLabel}`}</span>
        <Input
          aria-labelledby={labelId}
          autoComplete="off"
          id={labelInputId}
          name="label"
          type="text"
        />
      </div>
      <ApiTokenExpiryField
        inputLabel={`Replacement expiry for ${displayLabel}`}
        inputRef={expiresAtInputRef}
        presetInputRef={expiresAtPresetInputRef}
      />
      <Button disabled={disabled} type="submit">
        {copy}
      </Button>
    </form>
  );
}
