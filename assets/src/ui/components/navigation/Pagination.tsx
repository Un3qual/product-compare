import { Link } from "react-router-dom";
import { create, props } from "@stylexjs/stylex";
import { tokens } from "../../theme/tokens.stylex";

const styles = create({
  root: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "0.75rem",
  },
  link: {
    alignItems: "center",
    color: tokens.actionAccent,
    display: "inline-flex",
    fontWeight: 700,
    minHeight: tokens.controlHeight,
    textDecoration: "none",
    textDecorationLine: { ":hover": "underline", default: "none" },
    textUnderlineOffset: "0.2em",
  },
  arrow: { fontFamily: tokens.fontMono },
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
        <Link to={firstHref} {...props(styles.link)}>
          <span aria-hidden="true" {...props(styles.arrow)}>
            ←&nbsp;
          </span>
          {firstLabel}
        </Link>
      ) : null}
      {nextHref ? (
        <Link to={nextHref} {...props(styles.link)}>
          {nextLabel}
          <span aria-hidden="true" {...props(styles.arrow)}>
            &nbsp;→
          </span>
        </Link>
      ) : null}
    </nav>
  );
}
