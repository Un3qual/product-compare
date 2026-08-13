import { useId, useState } from "react";
import { create, props } from "@stylexjs/stylex";
import { tokens } from "$ui/theme/tokens.stylex";
import { exactDateTime, relativeDateTime } from "./date-time";

const styles = create({
  root: {
    display: "inline-flex",
    position: "relative",
  },
  time: {
    borderRadius: "0.2rem",
    outline: { ":focus-visible": `2px solid ${tokens.actionAccent}` },
    outlineOffset: "2px",
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

  return (
    <span
      onBlur={() => setExactVisible(false)}
      onFocus={() => setExactVisible(true)}
      onMouseEnter={() => setExactVisible(true)}
      onMouseLeave={() => setExactVisible(false)}
      {...props(styles.root)}
    >
      <time
        aria-describedby={exactVisible ? tooltipId : undefined}
        dateTime={value}
        onClick={() => setExactVisible((visible) => !visible)}
        tabIndex={0}
        title={exact}
        {...props(styles.time)}
      >
        {prefix ? `${prefix} ` : null}
        {relative}
      </time>
      {exactVisible ? (
        <span id={tooltipId} role="tooltip" {...props(styles.tooltip)}>
          {exact}
        </span>
      ) : null}
    </span>
  );
}
