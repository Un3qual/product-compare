import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AuthRequiredDialog } from "../../../../src/routes/auth/continuity/AuthRequiredDialog";
import {
  PENDING_INTENT_STORAGE_KEY,
  type PendingIntent,
} from "../../../../src/routes/auth/continuity/pending-intent";

const intent: PendingIntent = {
  kind: "save_comparison",
  version: 1,
  expiresAt: Date.now() + 10 * 60_000,
  returnTo: "/compare?slug=lamp&slug=chair#matrix",
  productIds: ["product-lamp", "product-chair"],
};

beforeEach(() => {
  sessionStorage.clear();
});

test("explains the requested benefit and offers sign in, account creation, and cancel", () => {
  render(
    <MemoryRouter>
      <AuthRequiredDialog intent={intent} onOpenChange={vi.fn()} open />
    </MemoryRouter>,
  );

  expect(screen.getByRole("dialog", { name: "Sign in to save this comparison" })).toBeVisible();
  expect(screen.getByText(/keep this product set available/i)).toBeVisible();
  expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
    "href",
    "/auth/login?returnTo=%2Fcompare%3Fslug%3Dlamp%26slug%3Dchair%23matrix&intent=save_comparison",
  );
  expect(screen.getByRole("link", { name: "Create account" })).toHaveAttribute(
    "href",
    "/auth/register?returnTo=%2Fcompare%3Fslug%3Dlamp%26slug%3Dchair%23matrix&intent=save_comparison",
  );
  expect(screen.getByRole("button", { name: "Cancel" })).toBeVisible();
  expect(sessionStorage.getItem(PENDING_INTENT_STORAGE_KEY)).toBeNull();
});

test("stores the minimal draft only after the shopper chooses an auth path", async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <AuthRequiredDialog intent={intent} onOpenChange={vi.fn()} open />
    </MemoryRouter>,
  );

  await user.click(screen.getByRole("link", { name: "Sign in" }));

  expect(JSON.parse(sessionStorage.getItem(PENDING_INTENT_STORAGE_KEY) ?? "null")).toEqual(intent);
});

test("cancel closes without serializing the draft", async () => {
  const user = userEvent.setup();
  const onOpenChange = vi.fn();
  render(
    <MemoryRouter>
      <AuthRequiredDialog intent={intent} onOpenChange={onOpenChange} open />
    </MemoryRouter>,
  );

  await user.click(screen.getByRole("button", { name: "Cancel" }));

  expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything());
  expect(sessionStorage.getItem(PENDING_INTENT_STORAGE_KEY)).toBeNull();
});
