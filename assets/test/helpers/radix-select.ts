import { fireEvent, screen } from "@testing-library/react";

export function chooseSelectOption(select: HTMLElement, optionName: string) {
  if (select.getAttribute("aria-expanded") !== "true") {
    openSelect(select);
  }

  fireEvent.click(screen.getByRole("option", { name: optionName }));
}

export function openSelect(select: HTMLElement) {
  fireEvent.keyDown(select, { key: "ArrowDown" });
}
