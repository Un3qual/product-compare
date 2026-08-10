import { useState } from "react";
import { create, props } from "@stylexjs/stylex";
import { useNavigate } from "react-router-dom";
import { Button } from "../../ui/primitives/Button";
import { TextField } from "../../ui/primitives/TextField";
import { tokens } from "../../ui/theme/tokens.stylex";
import { homeCatalogSearchPath } from "./home-paths";

const styles = create({
  form: {
    alignItems: "end",
    backgroundColor: tokens.surfaceMuted,
    borderBlock: `1px solid ${tokens.borderQuiet}`,
    display: "grid",
    gap: "0.75rem",
    gridTemplateColumns: {
      default: "minmax(0, 1fr) auto",
      "@media (max-width: 36rem)": "minmax(0, 1fr)",
    },
    padding: "1rem",
  },
  field: { display: "grid", gap: "0.4rem" },
  label: { color: tokens.textSecondary, fontSize: "0.88rem", fontWeight: 700 },
});

export function HomeSearch({ selectedSlugs }: { selectedSlugs: readonly string[] }) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  return (
    <form
      aria-label="Search products"
      onSubmit={(event) => {
        event.preventDefault();
        void navigate(homeCatalogSearchPath(query, selectedSlugs));
      }}
      role="search"
      {...props(styles.form)}
    >
      <div {...props(styles.field)}>
        <label htmlFor="home-product-search" {...props(styles.label)}>
          Search products, categories, or model numbers
        </label>
        <TextField
          id="home-product-search"
          name="q"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Try a product name or model number"
          value={query}
        />
      </div>
      <Button type="submit">Search catalog</Button>
    </form>
  );
}
