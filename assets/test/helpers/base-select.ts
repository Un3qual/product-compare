import { fireEvent, screen } from "@testing-library/react";

export function chooseSelectOption(select: HTMLElement, optionName: string) {
  if (select.getAttribute("aria-expanded") !== "true") {
    openSelect(select);
  }

  const option = screen.getByRole("option", { name: optionName });
  fireEvent.pointerDown(option, { pointerType: "mouse" });
  fireEvent.click(option);
}

export function openSelect(select: HTMLElement) {
  fireEvent.keyDown(select, { key: "ArrowDown" });
}
