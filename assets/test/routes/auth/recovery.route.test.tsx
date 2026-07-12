import { StrictMode } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useMutation } from "react-relay";
import {
  BrowserRouter,
  createMemoryRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
  Routes
} from "react-router-dom";
import { ForgotPasswordRoute } from "../../../src/routes/auth/ForgotPasswordRoute";
import { ResetPasswordRoute } from "../../../src/routes/auth/ResetPasswordRoute";
import {
  resetVerifyEmailRequestCache,
  VerifyEmailRoute
} from "../../../src/routes/auth/VerifyEmailRoute";

const { commitMutationMock, useMutationMock } = vi.hoisted(() => ({
  commitMutationMock: vi.fn(),
  useMutationMock: vi.fn()
}));

vi.mock("react-relay", async () => {
  const actual = await vi.importActual<typeof import("react-relay")>("react-relay");

  return {
    ...actual,
    useMutation: useMutationMock
  };
});

const mockedUseMutation = vi.mocked(useMutation);
const TEST_RESET_PASSWORD = ["updated", "credential", "456"].join("-");
const RESET_PASSWORD_PATH = "/auth/reset-password";
const VERIFY_EMAIL_PATH = "/auth/verify-email";
const ROUTE_TOKEN_PARAM = "token";
const RESET_ROUTE_TOKEN = ["reset", "route", "value"].join("-");
const FIRST_ROUTE_TOKEN = ["first", "route", "value"].join("-");
const SECOND_ROUTE_TOKEN = ["second", "route", "value"].join("-");
const VERIFY_EMAIL_ROUTE_TOKEN = ["confirm", "route", "value"].join("-");

function renderRoute(initialEntry: string, options?: { strictMode?: boolean }) {
  const router = createMemoryRouter(
    createRoutesFromElements(
      <>
        <Route path="/auth/forgot-password" element={<ForgotPasswordRoute />} />
        <Route path="/auth/reset-password" element={<ResetPasswordRoute />} />
        <Route path="/auth/verify-email" element={<VerifyEmailRoute />} />
      </>
    ),
    { initialEntries: [initialEntry] }
  );

  const content = <RouterProvider router={router} />;

  const view = render(
    options?.strictMode ? <StrictMode>{content}</StrictMode> : content
  );

  return { router, unmount: view.unmount };
}

function authTokenRoute(path: string, token: string) {
  return `${path}?${ROUTE_TOKEN_PARAM}=${token}`;
}

function latestMutationOptions() {
  return commitMutationMock.mock.calls.at(-1)?.[0];
}

function completeLatestMutation(response: unknown, graphQLErrors?: unknown[]) {
  act(() => {
    latestMutationOptions()?.onCompleted(response, graphQLErrors);
  });
}

function failLatestMutation(error: Error) {
  act(() => {
    latestMutationOptions()?.onError(error);
  });
}

beforeEach(() => {
  commitMutationMock.mockReset();
  mockedUseMutation.mockReset();
  mockedUseMutation.mockReturnValue([commitMutationMock, false]);
  resetVerifyEmailRequestCache();
});

test("forgot password route commits the email through Relay and shows the privacy-safe success state", async () => {
  renderRoute("/auth/forgot-password");

  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: "person@example.com" }
  });
  fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));

  await waitFor(() => {
    expect(commitMutationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: { email: "person@example.com" }
      })
    );
  });

  completeLatestMutation({
    forgotPassword: {
      ok: true,
      errors: []
    }
  });

  expect(
    await screen.findByRole("status")
  ).toHaveTextContent("If an account exists for that email, reset instructions are on the way.");
});

test("forgot password route hides top-level GraphQL error details behind a generic alert", async () => {
  renderRoute("/auth/forgot-password");

  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: "person@example.com" }
  });
  fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));

  await waitFor(() => {
    expect(commitMutationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: { email: "person@example.com" }
      })
    );
  });

  completeLatestMutation(
    {
      forgotPassword: {
        ok: true,
        errors: []
      }
    },
    [{ message: "GraphQL request failed (500): database stacktrace" }]
  );

  const alert = await screen.findByRole("alert");

  expect(alert).toHaveTextContent("Request failed. Please try again.");
  expect(alert).not.toHaveTextContent("database stacktrace");
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});

test("forgot password route hides synchronous Relay commit errors behind a generic alert", async () => {
  commitMutationMock.mockImplementation(() => {
    throw new Error("commit failed: database stacktrace");
  });

  renderRoute("/auth/forgot-password");

  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: "person@example.com" }
  });
  fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));

  const alert = await screen.findByRole("alert");

  expect(alert).toHaveTextContent("Request failed. Please try again.");
  expect(alert).not.toHaveTextContent("database stacktrace");
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});

test("reset password route reads the token from the URL and commits the new password", async () => {
  renderRoute(authTokenRoute(RESET_PASSWORD_PATH, RESET_ROUTE_TOKEN));

  fireEvent.change(screen.getByLabelText(/^new password$/i), {
    target: { value: TEST_RESET_PASSWORD }
  });
  fireEvent.click(screen.getByRole("button", { name: /update password/i }));

  await waitFor(() => {
    expect(commitMutationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          token: RESET_ROUTE_TOKEN,
          password: TEST_RESET_PASSWORD
        }
      })
    );
  });

  completeLatestMutation({
    resetPassword: {
      ok: true,
      errors: []
    }
  });

  expect(await screen.findByText("Your password has been updated.")).toBeInTheDocument();
});

test("reset password route shows a generic alert when the action payload fails without errors", async () => {
  renderRoute(authTokenRoute(RESET_PASSWORD_PATH, RESET_ROUTE_TOKEN));

  fireEvent.change(screen.getByLabelText(/^new password$/i), {
    target: { value: TEST_RESET_PASSWORD }
  });
  fireEvent.click(screen.getByRole("button", { name: /update password/i }));

  await waitFor(() => {
    expect(commitMutationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          token: RESET_ROUTE_TOKEN,
          password: TEST_RESET_PASSWORD
        }
      })
    );
  });

  completeLatestMutation({
    resetPassword: {
      ok: false,
      errors: []
    }
  });

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Request failed. Please try again."
  );
});

test("reset password route hides top-level GraphQL error details behind a generic alert", async () => {
  renderRoute(authTokenRoute(RESET_PASSWORD_PATH, RESET_ROUTE_TOKEN));

  fireEvent.change(screen.getByLabelText(/^new password$/i), {
    target: { value: TEST_RESET_PASSWORD }
  });
  fireEvent.click(screen.getByRole("button", { name: /update password/i }));

  await waitFor(() => {
    expect(commitMutationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          token: RESET_ROUTE_TOKEN,
          password: TEST_RESET_PASSWORD
        }
      })
    );
  });

  completeLatestMutation(
    {
      resetPassword: {
        ok: true,
        errors: []
      }
    },
    [{ message: "GraphQL request failed (500): database stacktrace" }]
  );

  const alert = await screen.findByRole("alert");

  expect(alert).toHaveTextContent("Request failed. Please try again.");
  expect(alert).not.toHaveTextContent("database stacktrace");
});

test("reset password route hides synchronous Relay commit errors and unlocks the form", async () => {
  commitMutationMock.mockImplementation(() => {
    throw new Error("commit failed: database stacktrace");
  });

  renderRoute(authTokenRoute(RESET_PASSWORD_PATH, RESET_ROUTE_TOKEN));

  fireEvent.change(screen.getByLabelText(/^new password$/i), {
    target: { value: TEST_RESET_PASSWORD }
  });
  fireEvent.click(screen.getByRole("button", { name: /update password/i }));

  const alert = await screen.findByRole("alert");

  expect(alert).toHaveTextContent("Request failed. Please try again.");
  expect(alert).not.toHaveTextContent("database stacktrace");
  expect(screen.getByRole("button", { name: /update password/i })).toBeEnabled();
});

test("reset password route clears stale success state when the token changes", async () => {
  const originalPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  let view: ReturnType<typeof render> | null = null;

  window.history.pushState({}, "", authTokenRoute(RESET_PASSWORD_PATH, FIRST_ROUTE_TOKEN));

  try {
    view = render(
      <BrowserRouter>
        <Routes>
          <Route path="/auth/reset-password" element={<ResetPasswordRoute />} />
        </Routes>
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/^new password$/i), {
      target: { value: TEST_RESET_PASSWORD }
    });
    fireEvent.click(screen.getByRole("button", { name: /update password/i }));

    await waitFor(() => {
      expect(commitMutationMock).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: {
            token: FIRST_ROUTE_TOKEN,
            password: TEST_RESET_PASSWORD
          }
        })
      );
    });

    completeLatestMutation({
      resetPassword: {
        ok: true,
        errors: []
      }
    });

    expect(await screen.findByText("Your password has been updated.")).toBeInTheDocument();

    act(() => {
      window.history.pushState({}, "", authTokenRoute(RESET_PASSWORD_PATH, SECOND_ROUTE_TOKEN));
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    await waitFor(() => {
      expect(screen.queryByText("Your password has been updated.")).not.toBeInTheDocument();
    });
  } finally {
    view?.unmount();
    window.history.pushState({}, "", originalPath);
  }

  expect(`${window.location.pathname}${window.location.search}${window.location.hash}`).toBe(
    originalPath
  );
});

test("reset password route ignores stale responses after the token changes", async () => {
  const originalPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  let view: ReturnType<typeof render> | null = null;

  window.history.pushState({}, "", authTokenRoute(RESET_PASSWORD_PATH, FIRST_ROUTE_TOKEN));

  try {
    view = render(
      <BrowserRouter>
        <Routes>
          <Route path="/auth/reset-password" element={<ResetPasswordRoute />} />
        </Routes>
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/^new password$/i), {
      target: { value: TEST_RESET_PASSWORD }
    });
    fireEvent.click(screen.getByRole("button", { name: /update password/i }));

    await waitFor(() => {
      expect(commitMutationMock).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: {
            token: FIRST_ROUTE_TOKEN,
            password: TEST_RESET_PASSWORD
          }
        })
      );
    });

    const firstRequest = latestMutationOptions();

    act(() => {
      window.history.pushState({}, "", authTokenRoute(RESET_PASSWORD_PATH, SECOND_ROUTE_TOKEN));
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    act(() => {
      firstRequest?.onCompleted({
        resetPassword: {
          ok: true,
          errors: []
        }
      });
    });

    await waitFor(() => {
      expect(screen.queryByText("Your password has been updated.")).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /update password/i }));

    await waitFor(() => {
      expect(commitMutationMock).toHaveBeenLastCalledWith(
        expect.objectContaining({
          variables: {
            token: SECOND_ROUTE_TOKEN,
            password: TEST_RESET_PASSWORD
          }
        })
      );
    });

    completeLatestMutation({
      resetPassword: {
        ok: true,
        errors: []
      }
    });

    expect(await screen.findByText("Your password has been updated.")).toBeInTheDocument();
  } finally {
    view?.unmount();
    window.history.pushState({}, "", originalPath);
  }

  expect(`${window.location.pathname}${window.location.search}${window.location.hash}`).toBe(
    originalPath
  );
});

test("verify email route consumes the URL token through Relay and reports success", async () => {
  renderRoute(authTokenRoute(VERIFY_EMAIL_PATH, VERIFY_EMAIL_ROUTE_TOKEN));

  await waitFor(() => {
    expect(commitMutationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: { token: VERIFY_EMAIL_ROUTE_TOKEN }
      })
    );
  });

  completeLatestMutation({
    verifyEmail: {
      ok: true,
      errors: []
    }
  });

  expect(await screen.findByText("Your email address is verified.")).toBeInTheDocument();
});

test("verify email route retries after a transient failure on remount", async () => {
  const firstView = renderRoute(authTokenRoute(VERIFY_EMAIL_PATH, VERIFY_EMAIL_ROUTE_TOKEN));

  await waitFor(() => {
    expect(commitMutationMock).toHaveBeenCalledTimes(1);
  });

  failLatestMutation(new Error("temporary outage"));

  expect(await screen.findByRole("alert")).toHaveTextContent("Request failed. Please try again.");

  firstView.unmount();

  renderRoute(authTokenRoute(VERIFY_EMAIL_PATH, VERIFY_EMAIL_ROUTE_TOKEN));

  await waitFor(() => {
    expect(commitMutationMock).toHaveBeenCalledTimes(2);
  });

  completeLatestMutation({
    verifyEmail: {
      ok: true,
      errors: []
    }
  });

  expect(await screen.findByText("Your email address is verified.")).toBeInTheDocument();
});

test("verify email route retries after a top-level GraphQL error on remount", async () => {
  const firstView = renderRoute(authTokenRoute(VERIFY_EMAIL_PATH, VERIFY_EMAIL_ROUTE_TOKEN));

  await waitFor(() => {
    expect(commitMutationMock).toHaveBeenCalledTimes(1);
  });

  completeLatestMutation(
    {
      verifyEmail: {
        ok: true,
        errors: []
      }
    },
    [{ message: "GraphQL request failed (500): database stacktrace" }]
  );

  const alert = await screen.findByRole("alert");

  expect(alert).toHaveTextContent("Request failed. Please try again.");
  expect(alert).not.toHaveTextContent("database stacktrace");

  firstView.unmount();

  renderRoute(authTokenRoute(VERIFY_EMAIL_PATH, VERIFY_EMAIL_ROUTE_TOKEN));

  await waitFor(() => {
    expect(commitMutationMock).toHaveBeenCalledTimes(2);
  });

  completeLatestMutation({
    verifyEmail: {
      ok: true,
      errors: []
    }
  });

  expect(await screen.findByText("Your email address is verified.")).toBeInTheDocument();
});

test("verify email route retries after a resolved failed payload on remount", async () => {
  const firstView = renderRoute(authTokenRoute(VERIFY_EMAIL_PATH, VERIFY_EMAIL_ROUTE_TOKEN));

  await waitFor(() => {
    expect(commitMutationMock).toHaveBeenCalledTimes(1);
  });

  completeLatestMutation({
    verifyEmail: {
      ok: false,
      errors: []
    }
  });

  expect(await screen.findByRole("alert")).toHaveTextContent("Request failed. Please try again.");

  firstView.unmount();

  renderRoute(authTokenRoute(VERIFY_EMAIL_PATH, VERIFY_EMAIL_ROUTE_TOKEN));

  await waitFor(() => {
    expect(commitMutationMock).toHaveBeenCalledTimes(2);
  });

  completeLatestMutation({
    verifyEmail: {
      ok: true,
      errors: []
    }
  });

  expect(await screen.findByText("Your email address is verified.")).toBeInTheDocument();
});

test("verify email route only submits a single-use token once in strict mode", async () => {
  renderRoute(authTokenRoute(VERIFY_EMAIL_PATH, VERIFY_EMAIL_ROUTE_TOKEN), { strictMode: true });

  await waitFor(() => {
    expect(commitMutationMock).toHaveBeenCalledTimes(1);
  });
});
