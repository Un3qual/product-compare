import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RelativeDateTime } from "../../../../src/ui/components/data/RelativeDateTime";

test("shows relative copy and exposes the exact timestamp to keyboard focus", async () => {
  const user = userEvent.setup();

  render(
    <RelativeDateTime
      prefix="Checked"
      referenceTime="2026-08-12T12:00:00Z"
      value="2026-08-12T10:00:00Z"
    />,
  );

  const time = screen.getByText("Checked 2 hours ago", { selector: "time" });
  const trigger = screen.getByRole("button", { name: "Checked 2 hours ago" });

  expect(time).toHaveAttribute("datetime", "2026-08-12T10:00:00Z");
  expect(trigger).toHaveAttribute("title", "Aug 12, 2026, 10:00 AM UTC");
  expect(time).not.toHaveAttribute("tabindex");

  await user.tab();

  expect(trigger).toHaveFocus();
  expect(screen.getByRole("tooltip")).toHaveTextContent("Aug 12, 2026, 10:00 AM UTC");
});

test("uses a truthful fallback for invalid values", () => {
  render(<RelativeDateTime referenceTime="2026-08-12T12:00:00Z" value="not-a-date" />);

  expect(screen.getByText("Unavailable")).toBeVisible();
  expect(document.querySelector("time")).toBeNull();
});
