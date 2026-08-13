import { render, screen } from "@testing-library/react";
import { RelativeDateTime } from "../../../../src/ui/components/data/RelativeDateTime";

test("shows relative copy while exposing the exact timestamp", () => {
  render(
    <RelativeDateTime
      prefix="Checked"
      referenceTime="2026-08-12T12:00:00Z"
      value="2026-08-12T10:00:00Z"
    />,
  );

  const time = screen.getByText("Checked 2 hours ago", { selector: "time" });

  expect(time).toHaveAttribute("datetime", "2026-08-12T10:00:00Z");
  expect(time).toHaveAttribute("title", "Aug 12, 2026, 10:00 AM UTC");
  expect(time).toHaveAttribute("tabindex", "0");
});

test("uses a truthful fallback for invalid values", () => {
  render(<RelativeDateTime referenceTime="2026-08-12T12:00:00Z" value="not-a-date" />);

  expect(screen.getByText("Unavailable")).toBeVisible();
  expect(document.querySelector("time")).toBeNull();
});
