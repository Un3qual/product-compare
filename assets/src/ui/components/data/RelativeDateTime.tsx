import { useId, useState } from "react";
import { create, props } from "@stylexjs/stylex";
import { tokens } from "$ui/theme/tokens.stylex";
import { exactDateTime, relativeDateTime } from "./date-time";

const styles = create({
  root: {
    display: "inline-flex",
    position: "relative",
  },
  trigger: {
    backgroundColor: "transparent",
    borderWidth: 0,
    borderRadius: "0.2rem",
    color: "inherit",
    cursor: "help",
    font: "inherit",
    outline: { ":focus-visible": `2px solid ${tokens.actionAccent}` },
    outlineOffset: "2px",
    padding: 0,
  },
  tooltip: {
    backgroundColor: tokens.text,
    borderRadius: "0.3rem",
    bottom: "calc(100% + 0.4rem)",
    color: tokens.surface,
    fontSize: "0.75rem",
    left: "50%",
    maxWidth: "18rem",
    padding: "0.35rem 0.5rem",
    position: "absolute",
    transform: "translateX(-50%)",
    whiteSpace: "nowrap",
    zIndex: 10,
  },
});

export function RelativeDateTime({
  prefix,
  referenceTime,
  value,
}: {
  prefix?: string;
  referenceTime: string;
  value: string;
}) {
  const tooltipId = useId();
  const [exactVisible, setExactVisible] = useState(false);
  const exact = exactDateTime(value);
  const relative = relativeDateTime(value, referenceTime);

  if (!exact || !relative) return <span>Unavailable</span>;

  const label = prefix ? `${prefix} ${relative}` : relative;

  return (
    <span {...props(styles.root)}>
      <button
        aria-describedby={exactVisible ? tooltipId : undefined}
        onBlur={() => setExactVisible(false)}
        onClick={() => setExactVisible(true)}
        onFocus={() => setExactVisible(true)}
        onMouseEnter={() => setExactVisible(true)}
        onMouseLeave={(event) => {
          if (document.activeElement !== event.currentTarget) setExactVisible(false);
        }}
        title={exact}
        type="button"
        {...props(styles.trigger)}
      >
        <time dateTime={value}>{label}</time>
      </button>
      {exactVisible ? (
        <span id={tooltipId} role="tooltip" {...props(styles.tooltip)}>
          {exact}
        </span>
      ) : null}
    </span>
  );
}
