import { create, props } from "@stylexjs/stylex";
import { tokens } from "../../theme/tokens.stylex";

const styles = create({
  mark: {
    alignItems: "center",
    display: "inline-flex",
    fontSize: "1rem",
    fontWeight: 750,
    gap: "0.55rem",
    letterSpacing: "-0.025em",
    minHeight: tokens.controlHeight,
  },
  glyph: {
    alignItems: "end",
    display: "inline-flex",
    gap: "0.14rem",
    height: "1.25rem",
  },
  leftBar: {
    backgroundColor: "currentColor",
    borderRadius: "0.08rem",
    height: "0.8rem",
    width: "0.28rem",
  },
  rightBar: {
    backgroundColor: "currentColor",
    borderRadius: "0.08rem",
    height: "1.2rem",
    width: "0.28rem",
  },
});

export function CompareMark({ label }: { label: string }) {
  return (
    <span aria-label={label} {...props(styles.mark)}>
      <span aria-hidden="true" {...props(styles.glyph)}>
        <span {...props(styles.leftBar)} />
        <span {...props(styles.rightBar)} />
      </span>
      {label}
    </span>
  );
}
