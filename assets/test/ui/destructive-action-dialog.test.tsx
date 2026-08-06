import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { DestructiveActionDialog } from "../../src/ui/components/overlays/DestructiveActionDialog";

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
