import { create } from "@stylexjs/stylex";

export const productCommunityStyles = create({
  actions: { display: "flex", flexWrap: "wrap", gap: "0.5rem" },
  answer: {
    borderInlineStart: "2px solid var(--pc-border-quiet)",
    display: "grid",
    gap: "0.35rem",
    paddingInlineStart: "0.8rem",
  },
  confirmation: {
    border: "1px solid var(--pc-border-emphasized)",
    borderRadius: "0.4rem",
    display: "grid",
    gap: "0.5rem",
    padding: "0.75rem",
  },
  content: { display: "grid", gap: "1.25rem" },
  field: { display: "grid", gap: "0.35rem" },
  form: { display: "grid", gap: "0.75rem", maxWidth: "38rem" },
  input: {
    backgroundColor: "var(--pc-surface)",
    border: "1px solid var(--pc-border-emphasized)",
    borderRadius: "0.4rem",
    color: "var(--pc-text)",
    minHeight: "2.6rem",
    padding: "0.65rem",
  },
  item: { display: "grid", gap: "0.5rem" },
  list: { display: "grid", gap: "1.2rem", listStyle: "none", margin: 0, padding: 0 },
  metadata: { color: "var(--pc-text-secondary)", margin: 0 },
  title: { fontSize: "1.25rem", margin: 0 },
});
