import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AuthRequiredDialog } from "../../../../src/routes/auth/continuity/AuthRequiredDialog";
import {
  PENDING_INTENT_STORAGE_KEY,
  PENDING_INTENT_TTL_MS,
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
  expect(screen.getByRole("button", { name: "Sign in" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Create account" })).toBeVisible();
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

  await user.click(screen.getByRole("button", { name: "Sign in" }));

  expect(JSON.parse(sessionStorage.getItem(PENDING_INTENT_STORAGE_KEY) ?? "null")).toEqual({
    ...intent,
    expiresAt: expect.any(Number),
  });
});

test("stores the same draft when the shopper chooses account creation", async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <AuthRequiredDialog intent={intent} onOpenChange={vi.fn()} open />
    </MemoryRouter>,
  );

  await user.click(screen.getByRole("button", { name: "Create account" }));

  expect(JSON.parse(sessionStorage.getItem(PENDING_INTENT_STORAGE_KEY) ?? "null")).toEqual({
    ...intent,
    expiresAt: expect.any(Number),
  });
});

test("starts the pending-intent lifetime when the shopper chooses an auth path", async () => {
  const startedAt = Date.UTC(2026, 7, 13, 12, 0, 0);
  vi.useFakeTimers();
  vi.setSystemTime(startedAt);
  const delayedIntent: PendingIntent = { ...intent, expiresAt: startedAt + 1 };

  try {
    render(
      <MemoryRouter>
        <AuthRequiredDialog intent={delayedIntent} onOpenChange={vi.fn()} open />
      </MemoryRouter>,
    );
    vi.advanceTimersByTime(20 * 60_000);
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(JSON.parse(sessionStorage.getItem(PENDING_INTENT_STORAGE_KEY) ?? "null")).toEqual({
      ...delayedIntent,
      expiresAt: startedAt + 20 * 60_000 + PENDING_INTENT_TTL_MS,
    });
  } finally {
    vi.useRealTimers();
  }
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
