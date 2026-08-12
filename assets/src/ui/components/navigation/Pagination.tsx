import { Link } from "react-router-dom";
import { create, props } from "@stylexjs/stylex";
import { Button } from "../../primitives/Button";

const styles = create({
  root: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "0.75rem",
  },
});

export type PaginationProps = {
  firstHref?: string | null;
  firstLabel?: string;
  label: string;
  nextHref?: string | null;
  nextLabel?: string;
};

export function Pagination({
  firstHref,
  firstLabel = "First page",
  label,
  nextHref,
  nextLabel = "Next page",
}: PaginationProps) {
  if (!firstHref && !nextHref) {
    return null;
  }

  return (
    <nav aria-label={label} {...props(styles.root)}>
      {firstHref ? (
        <Button render={<Link to={firstHref} />} variant="secondary">
          {firstLabel}
        </Button>
      ) : null}
      {nextHref ? <Button render={<Link to={nextHref} />}>{nextLabel}</Button> : null}
    </nav>
  );
}
