import { create } from "@stylexjs/stylex";
import { tokens } from "$ui/theme/tokens.stylex";

export const affiliateWorkflowStyles = create({
  step: {
    backgroundColor: tokens.surfaceMuted,
    borderColor: tokens.borderQuiet,
    borderRadius: "var(--pc-radius-large)",
    borderStyle: "solid",
    borderWidth: "1px",
    display: "grid",
    gap: "1rem",
    padding: "1.15rem",
  },
  stepHeader: {
    display: "grid",
    gap: "0.25rem",
  },
  eyebrow: {
    color: tokens.textSecondary,
    fontSize: "0.78rem",
    fontWeight: 700,
    letterSpacing: "0.05em",
    margin: 0,
    textTransform: "uppercase",
  },
  heading: {
    margin: 0,
  },
  description: {
    color: tokens.textSecondary,
    margin: 0,
  },
  form: {
    alignItems: "end",
    display: "grid",
    gap: "1rem",
    gridTemplateColumns: "repeat(auto-fit, minmax(14rem, 1fr))",
  },
  result: {
    borderBlockStartColor: tokens.borderQuiet,
    borderBlockStartStyle: "solid",
    borderBlockStartWidth: "1px",
    display: "grid",
    gap: "0.35rem",
    gridColumn: "1 / -1",
    paddingBlockStart: "0.85rem",
  },
  feedback: {
    gridColumn: "1 / -1",
    margin: 0,
  },
});
