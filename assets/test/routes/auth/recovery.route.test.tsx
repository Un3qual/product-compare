import { StrictMode } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { commitMutation, useMutation } from "react-relay";
import { createMemoryRouter, RouterProvider } from "react-router";
import { createRelayRouterContext } from "../../../src/relay/route-preload";
import {
  clientAction as forgotPasswordAction,
  ForgotPasswordRoute,
} from "../../../src/routes/auth/ForgotPasswordRoute";
import {
  clientAction as resetPasswordAction,
  ResetPasswordRoute,
} from "../../../src/routes/auth/ResetPasswordRoute";
import {
  resetVerifyEmailRequestCache,
  VerifyEmailRoute,
} from "../../../src/routes/auth/VerifyEmailRoute";

const { commitMutationMock, relayEnvironment, useMutationMock } = vi.hoisted(() => ({
  commitMutationMock: vi.fn(),
  relayEnvironment: {},
  useMutationMock: vi.fn(),
}));

vi.mock("react-relay", async () => {
  const actual = await vi.importActual<typeof import("react-relay")>("react-relay");

  return {
    ...actual,
    commitMutation: commitMutationMock,
    useMutation: useMutationMock,
  };
});

const mockedCommitMutation = vi.mocked(commitMutation);
const mockedUseMutation = vi.mocked(useMutation);
const hookCommitMock = vi.fn();
const TEST_PASSWORD = ["updated", "credential", "456"].join("-");
const RESET_TOKEN = ["reset", "route", "value"].join("-");
const VERIFY_TOKEN = ["confirm", "route", "value"].join("-");

beforeEach(() => {
  mockedCommitMutation.mockReset();
  hookCommitMock.mockReset();
  mockedUseMutation.mockReset();
  mockedUseMutation.mockReturnValue([hookCommitMock, false]);
  resetVerifyEmailRequestCache();
});

test("forgot-password action submits GraphQL and returns the privacy-safe success state", async () => {
  resolveNextActionMutation({ forgotPassword: { ok: true, errors: [] } });

  await expect(
    forgotPasswordAction(
      buildActionArgs("/auth/forgot-password", { email: "person@example.com" }),
    ),
  ).resolves.toEqual({
    errors: [],
    message: "If an account exists for that email, reset instructions are on the way.",
  });
  expect(mockedCommitMutation).toHaveBeenCalledWith(
    relayEnvironment,
    expect.objectContaining({ variables: { email: "person@example.com" } }),
  );
});

test("forgot-password action hides top-level GraphQL details", async () => {
  resolveNextActionMutation(
    { forgotPassword: { ok: true, errors: [] } },
    [{ message: "database stacktrace" }],
  );

  await expect(
    forgotPasswordAction(
      buildActionArgs("/auth/forgot-password", { email: "person@example.com" }),
    ),
  ).resolves.toEqual({
    errors: [
      { code: "NETWORK_ERROR", field: null, message: "Request failed. Please try again." },
    ],
    message: null,
  });
});

test("forgot-password route stays disabled through revalidation", async () => {
  let finishRevalidation = () => {};
  const revalidation = new Promise<void>((resolve) => {
    finishRevalidation = resolve;
  });
  const routeId = "forgot-password";
  const router = createMemoryRouter(
    [
      {
        id: routeId,
        path: "/auth/forgot-password",
        loader: () => revalidation,
        action: () => ({
          errors: [],
          message: "If an account exists for that email, reset instructions are on the way.",
        }),
        Component: ForgotPasswordRoute,
      },
    ],
    {
      initialEntries: ["/auth/forgot-password"],
      hydrationData: { loaderData: { [routeId]: null } },
    },
  );

  render(<RouterProvider router={router} />);

  const submit = await screen.findByRole("button", { name: "Send reset link" });
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "person@example.com" },
  });
  fireEvent.click(submit);
  await waitFor(() => expect(router.state.navigation.state).toBe("loading"));

  expect(submit).toBeDisabled();

  finishRevalidation();
  await waitFor(() => expect(router.state.navigation.state).toBe("idle"));
});

test("reset-password action reads its single-use token from the route URL", async () => {
  resolveNextActionMutation({ resetPassword: { ok: true, errors: [] } });

  await expect(
    resetPasswordAction(
      buildActionArgs(`/auth/reset-password?token=${RESET_TOKEN}`, {
        password: TEST_PASSWORD,
      }),
    ),
  ).resolves.toEqual({ errors: [], message: "Your password has been updated." });
  expect(mockedCommitMutation).toHaveBeenCalledWith(
    relayEnvironment,
    expect.objectContaining({ variables: { password: TEST_PASSWORD, token: RESET_TOKEN } }),
  );
});

test("reset-password action rejects a missing token without sending GraphQL", async () => {
  await expect(
    resetPasswordAction(
      buildActionArgs("/auth/reset-password", { password: TEST_PASSWORD }),
    ),
  ).resolves.toEqual({
    errors: [
      {
        code: "INVALID_TOKEN",
        field: "token",
        message: "This reset link is missing or invalid.",
      },
    ],
    message: null,
  });
  expect(mockedCommitMutation).not.toHaveBeenCalled();
});

test("reset-password route renders its missing-token state in a Framework form", async () => {
  const router = createMemoryRouter(
    [{ path: "/auth/reset-password", action: () => null, Component: ResetPasswordRoute }],
    { initialEntries: ["/auth/reset-password"] },
  );

  render(<RouterProvider router={router} />);

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "This reset link is missing or invalid.",
  );
  expect(screen.getByRole("button", { name: "Update password" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Update password" }).closest("form")).toHaveAttribute(
    "method",
    "post",
  );
});

test("reset-password route keeps its single-use token disabled through revalidation", async () => {
  let loaderCalls = 0;
  let finishRevalidation = () => {};
  const revalidation = new Promise<void>((resolve) => {
    finishRevalidation = () => resolve();
  });
  const router = createMemoryRouter(
    [
      {
        path: "/auth/reset-password",
        loader: () => (++loaderCalls === 1 ? null : revalidation),
        action: () => ({ errors: [], message: "Your password has been updated." }),
        Component: ResetPasswordRoute,
      },
    ],
    { initialEntries: [`/auth/reset-password?token=${RESET_TOKEN}`] },
  );

  render(<RouterProvider router={router} />);

  const submit = await screen.findByRole("button", { name: "Update password" });
  fireEvent.change(screen.getByLabelText("New password"), {
    target: { value: TEST_PASSWORD },
  });
  fireEvent.click(submit);
  await waitFor(() => expect(router.state.navigation.state).toBe("loading"));

  expect(submit).toBeDisabled();

  finishRevalidation();
  await waitFor(() => expect(router.state.navigation.state).toBe("idle"));
});

test("credential actions normalize synchronous Relay errors", async () => {
  mockedCommitMutation.mockImplementationOnce(() => {
    throw new Error("commit failed: database stacktrace");
  });

  await expect(
    forgotPasswordAction(
      buildActionArgs("/auth/forgot-password", { email: "person@example.com" }),
    ),
  ).resolves.toEqual({
    errors: [
      { code: "NETWORK_ERROR", field: null, message: "Request failed. Please try again." },
    ],
    message: null,
  });
});

test("verify-email route consumes the URL token once and reports success", async () => {
  renderVerifyRoute(`/auth/verify-email?token=${VERIFY_TOKEN}`);

  await waitFor(() => {
    expect(hookCommitMock).toHaveBeenCalledWith(
      expect.objectContaining({ variables: { token: VERIFY_TOKEN } }),
    );
  });

  completeVerifyMutation({ verifyEmail: { ok: true, errors: [] } });

  expect(await screen.findByText("Your email address is verified.")).toBeInTheDocument();
});

test("verify-email route retries a failed single-use request after remount", async () => {
  const firstView = renderVerifyRoute(`/auth/verify-email?token=${VERIFY_TOKEN}`);

  await waitFor(() => expect(hookCommitMock).toHaveBeenCalledTimes(1));
  failVerifyMutation(new Error("temporary outage"));
  expect(await screen.findByRole("alert")).toHaveTextContent("Request failed. Please try again.");

  firstView.unmount();
  renderVerifyRoute(`/auth/verify-email?token=${VERIFY_TOKEN}`);

  await waitFor(() => expect(hookCommitMock).toHaveBeenCalledTimes(2));
});

test("verify-email route deduplicates its single-use mutation under StrictMode", async () => {
  renderVerifyRoute(`/auth/verify-email?token=${VERIFY_TOKEN}`, true);

  await waitFor(() => expect(hookCommitMock).toHaveBeenCalledTimes(1));
});

function renderVerifyRoute(path: string, strictMode = false) {
  const router = createMemoryRouter(
    [{ path: "/auth/verify-email", Component: VerifyEmailRoute }],
    { initialEntries: [path] },
  );
  const content = <RouterProvider router={router} />;

  return render(strictMode ? <StrictMode>{content}</StrictMode> : content);
}

function buildActionArgs(path: string, fields: Record<string, string>) {
  const url = new URL(path, "https://app.example.com");

  return {
    context: createRelayRouterContext(relayEnvironment as never),
    params: {},
    pattern: path.split("?", 1)[0],
    request: new Request(url, { method: "POST", body: new URLSearchParams(fields) }),
    serverAction: vi.fn(),
    url,
  };
}

function resolveNextActionMutation(response: unknown, graphQLErrors?: readonly unknown[]) {
  mockedCommitMutation.mockImplementationOnce((_environment, config) => {
    config.onCompleted?.(response as never, graphQLErrors as never);
    return { dispose: vi.fn() };
  });
}

function completeVerifyMutation(response: unknown) {
  act(() => {
    hookCommitMock.mock.calls.at(-1)?.[0].onCompleted(response, null);
  });
}

function failVerifyMutation(error: Error) {
  act(() => {
    hookCommitMock.mock.calls.at(-1)?.[0].onError(error);
  });
}
