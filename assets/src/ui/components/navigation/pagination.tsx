import { Link } from "react-router-dom";
import { create, props } from "@stylexjs/stylex";
import { Button } from "../../primitives/button";

const styles = create({
  root: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "0.75rem"
  }
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
  nextLabel = "Next page"
}: PaginationProps) {
  if (!firstHref && !nextHref) {
    return null;
  }

  return (
    <nav aria-label={label} {...props(styles.root)}>
      {firstHref ? (
        <Button asChild variant="soft">
          <Link to={firstHref}>{firstLabel}</Link>
        </Button>
      ) : null}
      {nextHref ? (
        <Button asChild variant="solid">
          <Link to={nextHref}>{nextLabel}</Link>
        </Button>
      ) : null}
    </nav>
  );
}
