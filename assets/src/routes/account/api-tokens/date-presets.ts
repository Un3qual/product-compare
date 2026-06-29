export const API_TOKEN_EXPIRES_AT_PRESETS = [
  { label: "30 days" },
  { label: "90 days" },
  { label: "1 year" },
  { label: "No expiration" }
] as const;

export type ApiTokenExpiresAtPreset = (typeof API_TOKEN_EXPIRES_AT_PRESETS)[number]["label"];

export function buildApiTokenExpiresAtInputValue(
  preset: ApiTokenExpiresAtPreset,
  currentDate: Date
) {
  if (preset === "No expiration") {
    return "";
  }

  const expiryDate = new Date(currentDate);

  if (preset === "1 year") {
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
  } else {
    const dayOffset = preset === "30 days" ? 30 : 90;
    expiryDate.setDate(expiryDate.getDate() + dayOffset);
  }

  return `${expiryDate.getFullYear()}-${padDateTimePart(
    expiryDate.getMonth() + 1
  )}-${padDateTimePart(expiryDate.getDate())}T${padDateTimePart(
    expiryDate.getHours()
  )}:${padDateTimePart(expiryDate.getMinutes())}`;
}

function padDateTimePart(value: number) {
  return value.toString().padStart(2, "0");
}
