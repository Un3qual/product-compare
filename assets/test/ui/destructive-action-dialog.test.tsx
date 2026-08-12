import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { ActionDialog } from "../../src/ui/components/overlays/ActionDialog";
import { DestructiveActionDialog } from "../../src/ui/components/overlays/DestructiveActionDialog";

test("ActionDialog keeps its popup above the backdrop", () => {
  render(
    <ActionDialog open title="Create API token" trigger={<button type="button">Create token</button>}>
      <p>Credential details</p>
    </ActionDialog>,
  );

  expectPopupAboveBackdrop("dialog-content", "dialog-overlay");
});

test("DestructiveActionDialog keeps its popup above the backdrop", () => {
  render(
    <DestructiveActionDialog
      confirmLabel="Revoke token"
      description="Existing integrations will stop working."
      onConfirm={() => {}}
      title="Revoke API token?"
      trigger={<button type="button">Revoke access</button>}
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: "Revoke access" }));

  expectPopupAboveBackdrop("alert-dialog-content", "alert-dialog-overlay");
});

test("DestructiveActionDialog requires an explicit confirmation before revoking access", async () => {
  const onConfirm = vi.fn();

  render(
    <DestructiveActionDialog
      confirmLabel="Revoke token"
      description="Existing integrations will stop working."
      onConfirm={onConfirm}
      title="Revoke API token?"
      trigger={<button type="button">Revoke access</button>}
    />,
  );

  const trigger = screen.getByRole("button", { name: "Revoke access" });
  fireEvent.click(trigger);

  const dialog = screen.getByRole("alertdialog", { name: "Revoke API token?" });
  expect(screen.getAllByRole("alertdialog")).toHaveLength(1);
  expect(within(dialog).getByText("Existing integrations will stop working.")).toBeInTheDocument();
  expect(onConfirm).not.toHaveBeenCalled();

  fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));

  await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
  expect(trigger).toHaveFocus();

  fireEvent.click(trigger);
  fireEvent.click(
    within(screen.getByRole("alertdialog", { name: "Revoke API token?" })).getByRole("button", {
      name: "Revoke token",
    }),
  );

  await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
  expect(onConfirm).toHaveBeenCalledTimes(1);
});

function expectPopupAboveBackdrop(popupSlot: string, backdropSlot: string) {
  const popup = document.querySelector<HTMLElement>(`[data-slot="${popupSlot}"]`);
  const backdrop = document.querySelector<HTMLElement>(`[data-slot="${backdropSlot}"]`);

  expect(popup).not.toBeNull();
  expect(backdrop).not.toBeNull();
  expect(Number(getComputedStyle(popup!).zIndex)).toBeGreaterThan(
    Number(getComputedStyle(backdrop!).zIndex),
  );
}
