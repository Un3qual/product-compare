import { useEffect, useState, type RefObject } from "react";
import { create, props } from "@stylexjs/stylex";
import { Input } from "$ui/primitives/Input";
import { Label } from "$ui/primitives/Label";
import { RadioGroup, RadioGroupItem } from "$ui/primitives/RadioGroup";
import { tokens } from "$ui/theme/tokens.stylex";
import { API_TOKEN_EXPIRES_AT_PRESETS, buildApiTokenExpiresAtInputValue } from "./date-presets";

const styles = create({
  field: { display: "grid", gap: "0.75rem" },
  presets: {
    borderWidth: 0,
    display: "grid",
    gap: "0.35rem",
    margin: 0,
    padding: 0,
  },
  legend: {
    color: tokens.textSecondary,
    fontSize: "0.78rem",
    fontWeight: 700,
    marginBlockEnd: "0.25rem",
    padding: 0,
  },
  presetGrid: {
    display: "grid",
    gap: "0.25rem 0.75rem",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  },
  presetLabel: {
    alignItems: "center",
    cursor: "pointer",
    display: "flex",
    fontSize: "0.88rem",
    gap: "0.15rem",
    minHeight: tokens.controlHeight,
  },
});

export function ApiTokenExpiryField({
  inputLabel,
  inputRef,
  presetInputRef,
}: {
  inputLabel: string;
  inputRef: RefObject<HTMLInputElement | null>;
  presetInputRef: RefObject<HTMLInputElement | null>;
}) {
  const [selectedPreset, setSelectedPreset] = useState("");

  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) return;

    const clearSelectedPreset = () => setSelectedPreset("");
    form.addEventListener("reset", clearSelectedPreset);
    return () => {
      form.removeEventListener("reset", clearSelectedPreset);
    };
  }, [inputRef]);

  return (
    <div {...props(styles.field)}>
      <Label>
        {inputLabel}
        <Input
          name="expiresAt"
          onChange={() => setSelectedPreset("")}
          ref={inputRef}
          type="datetime-local"
        />
      </Label>
      <fieldset {...props(styles.presets)}>
        <legend {...props(styles.legend)}>Quick expiry choices</legend>
        <RadioGroup
          aria-label={`${inputLabel} presets`}
          inputRef={presetInputRef}
          name="expiresAtPreset"
          onValueChange={(value) => {
            const preset = API_TOKEN_EXPIRES_AT_PRESETS.find(({ label }) => label === value);
            if (!preset) return;

            setSelectedPreset(preset.label);
            if (inputRef.current) {
              inputRef.current.value = buildApiTokenExpiresAtInputValue(
                preset.label,
                new Date(Date.now()),
              );
            }
          }}
          style={styles.presetGrid}
          value={selectedPreset}
        >
          {API_TOKEN_EXPIRES_AT_PRESETS.map((preset) => (
            <label key={preset.label} {...props(styles.presetLabel)}>
              <RadioGroupItem value={preset.label} />
              <span>{preset.label}</span>
            </label>
          ))}
        </RadioGroup>
      </fieldset>
    </div>
  );
}
