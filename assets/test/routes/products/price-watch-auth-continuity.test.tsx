import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Outlet, Route, Routes } from "react-router-dom";
import { useMutation } from "react-relay";
import { PriceWatchControl } from "../../../src/routes/products/PriceWatchControl";
import {
  PENDING_INTENT_STORAGE_KEY,
  writePendingIntent,
  type PendingIntent,
} from "../../../src/routes/auth/continuity/pending-intent";

const { commitMutationMock, useMutationMock } = vi.hoisted(() => ({
  commitMutationMock: vi.fn(),
  useMutationMock: vi.fn(),
}));

vi.mock("react-relay", async () => {
  const actual = await vi.importActual<typeof import("react-relay")>("react-relay");
  return { ...actual, useMutation: useMutationMock };
});

const mockedUseMutation = vi.mocked(useMutation);

beforeEach(() => {
  sessionStorage.clear();
  commitMutationMock.mockReset();
  mockedUseMutation.mockReset();
  mockedUseMutation.mockReturnValue([commitMutationMock, false]);
});

test("a guest keeps entered watch values behind the auth modal and commits no mutation", async () => {
  const user = userEvent.setup();
  renderPriceWatch(null);

  await user.click(screen.getByRole("button", { name: "Watch price or availability" }));
  await user.clear(screen.getByLabelText("Target landed price"));
  await user.type(screen.getByLabelText("Target landed price"), "75");
  await user.click(screen.getByRole("button", { name: "Create watch" }));

  expect(commitMutationMock).not.toHaveBeenCalled();
  await waitFor(() =>
    expect(screen.getByRole("dialog", { name: "Sign in to watch this product" })).toBeVisible(),
  );
  expect(screen.getByLabelText("Target landed price")).toHaveValue("75");
  expect(screen.getByRole("button", { name: "Sign in" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Create account" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Cancel" })).toBeVisible();
  expect(sessionStorage.getItem(PENDING_INTENT_STORAGE_KEY)).toBeNull();
});

test("cancel and Escape restore focus without changing entered values or storage", async () => {
  const user = userEvent.setup();
  renderPriceWatch(null);
  await user.click(screen.getByRole("button", { name: "Watch price or availability" }));
  await user.type(screen.getByLabelText("Target landed price"), "75");
  const submit = screen.getByRole("button", { name: "Create watch" });

  await user.click(submit);
  await user.keyboard("{Escape}");

  await waitFor(() => expect(submit).toHaveFocus());
  expect(screen.getByLabelText("Target landed price")).toHaveValue("75");
  expect(sessionStorage.getItem(PENDING_INTENT_STORAGE_KEY)).toBeNull();
});

test("a signed-in shopper submits directly without opening the auth modal", async () => {
  const user = userEvent.setup();
  renderPriceWatch({ id: "viewer-1", email: "person@example.com", isOperator: false });
  await user.click(screen.getByRole("button", { name: "Watch price or availability" }));
  await user.type(screen.getByLabelText("Target landed price"), "75");
  await user.click(screen.getByRole("button", { name: "Create watch" }));

  await waitFor(() => expect(commitMutationMock).toHaveBeenCalledTimes(1));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("an unresolved viewer does not submit as an authenticated shopper", async () => {
  const user = userEvent.setup();
  renderPriceWatch(undefined);
  await user.click(screen.getByRole("button", { name: "Watch price or availability" }));
  await user.type(screen.getByLabelText("Target landed price"), "75");
  await user.click(screen.getByRole("button", { name: "Create watch" }));

  expect(commitMutationMock).not.toHaveBeenCalled();
  await waitFor(() =>
    expect(screen.getByRole("dialog", { name: "Sign in to watch this product" })).toBeVisible(),
  );
});

test("restores a matching draft after the viewer resolves", async () => {
  writePendingIntent({
    kind: "price_watch",
    version: 1,
    expiresAt: Date.now() + 10 * 60_000,
    returnTo: "/products/desk-lamp#watch",
    productId: "product-1",
    ruleType: "PERCENTAGE_DROP",
    amount: "12.5",
    currency: "EUR",
  });

  const view = renderPriceWatch(undefined);
  view.rerender(
    priceWatchElement({ id: "viewer-1", email: "person@example.com", isOperator: false }),
  );
  await userEvent
    .setup()
    .click(screen.getByRole("button", { name: "Watch price or availability" }));

  expect(screen.getByRole("status")).toHaveTextContent(/watch draft was restored/i);
  expect(screen.getByLabelText("Currency")).toHaveValue("EUR");
  expect(screen.getByLabelText("Percentage drop")).toHaveValue("12.5");
  expect(sessionStorage.getItem(PENDING_INTENT_STORAGE_KEY)).toBeNull();
});

test("a matching signed-in return restores the watch for review without submitting", async () => {
  const draft: PendingIntent = {
    kind: "price_watch",
    version: 1,
    expiresAt: Date.now() + 10 * 60_000,
    returnTo: "/products/desk-lamp#watch",
    productId: "product-1",
    ruleType: "PERCENTAGE_DROP",
    amount: "12.5",
    currency: "EUR",
  };
  writePendingIntent(draft);

  renderPriceWatch({ id: "viewer-1", email: "person@example.com", isOperator: false });
  await userEvent
    .setup()
    .click(screen.getByRole("button", { name: "Watch price or availability" }));

  expect(screen.getByRole("status")).toHaveTextContent(/watch draft was restored/i);
  expect(screen.getByLabelText("Currency")).toHaveValue("EUR");
  expect(screen.getByLabelText("Percentage drop")).toHaveValue("12.5");
  expect(commitMutationMock).not.toHaveBeenCalled();
  expect(sessionStorage.getItem(PENDING_INTENT_STORAGE_KEY)).toBeNull();
});

test("a mismatched product preserves the draft and shows a normal empty form", async () => {
  writePendingIntent({
    kind: "price_watch",
    version: 1,
    expiresAt: Date.now() + 10 * 60_000,
    returnTo: "/products/other",
    productId: "other-product",
    ruleType: "TARGET_PRICE",
    amount: "99",
    currency: "USD",
  });

  renderPriceWatch({ id: "viewer-1", email: "person@example.com", isOperator: false });
  await userEvent
    .setup()
    .click(screen.getByRole("button", { name: "Watch price or availability" }));

  expect(screen.getByLabelText("Target landed price")).toHaveValue("");
  expect(screen.queryByText(/draft was restored/i)).not.toBeInTheDocument();
  expect(sessionStorage.getItem(PENDING_INTENT_STORAGE_KEY)).not.toBeNull();
});

test("requires an exact three-letter currency before opening auth", async () => {
  const user = userEvent.setup();
  renderPriceWatch(null);
  await user.click(screen.getByRole("button", { name: "Watch price or availability" }));
  await user.clear(screen.getByLabelText("Currency"));
  await user.type(screen.getByLabelText("Currency"), "US");
  await user.type(screen.getByLabelText("Target landed price"), "75");
  await user.click(screen.getByRole("button", { name: "Create watch" }));

  expect(screen.getByLabelText("Currency")).toBeInvalid();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

type TestViewer = null | undefined | { id: string; email: string; isOperator: boolean };

function priceWatchElement(viewer: TestViewer) {
  return (
    <MemoryRouter initialEntries={["/products/desk-lamp?merchant=one#watch"]}>
      <Routes>
        <Route element={<Outlet context={{ viewer }} />}>
          <Route path="/products/:slug" element={<PriceWatchControl productId="product-1" />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

function renderPriceWatch(viewer: TestViewer) {
  return render(priceWatchElement(viewer));
}
