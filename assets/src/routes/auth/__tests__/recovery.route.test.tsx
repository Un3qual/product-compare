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
import { ForgotPasswordRoute } from "../forgot-password";
import { ResetPasswordRoute } from "../reset-password";
import {
  resetVerifyEmailRequestCache,
  VerifyEmailRoute
} from "../verify-email";

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

  expect(screen.getByText("Email").closest("label")).toHaveAttribute("data-slot", "label");
  expect(screen.getByRole("button", { name: /send reset link/i })).toHaveAttribute(
    "data-slot",
    "button"
  );
  expect(screen.getByRole("link", { name: /create account/i })).toHaveAttribute(
    "data-slot",
    "button"
  );

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
  renderRoute("/auth/reset-password?token=reset-token");

  expect(screen.getByText("New password").closest("label")).toHaveAttribute(
    "data-slot",
    "label"
  );
  expect(screen.getByRole("button", { name: /update password/i })).toHaveAttribute(
    "data-slot",
    "button"
  );
  expect(screen.getByRole("link", { name: /back to sign in/i })).toHaveAttribute(
    "data-slot",
    "button"
  );

  fireEvent.change(screen.getByLabelText(/^new password$/i), {
    target: { value: "supersecretpass456" }
  });
  fireEvent.click(screen.getByRole("button", { name: /update password/i }));

  await waitFor(() => {
    expect(commitMutationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          token: "reset-token",
          password: "supersecretpass456"
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
  renderRoute("/auth/reset-password?token=reset-token");

  fireEvent.change(screen.getByLabelText(/^new password$/i), {
    target: { value: "supersecretpass456" }
  });
  fireEvent.click(screen.getByRole("button", { name: /update password/i }));

  await waitFor(() => {
    expect(commitMutationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          token: "reset-token",
          password: "supersecretpass456"
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
  renderRoute("/auth/reset-password?token=reset-token");

  fireEvent.change(screen.getByLabelText(/^new password$/i), {
    target: { value: "supersecretpass456" }
  });
  fireEvent.click(screen.getByRole("button", { name: /update password/i }));

  await waitFor(() => {
    expect(commitMutationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          token: "reset-token",
          password: "supersecretpass456"
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

  renderRoute("/auth/reset-password?token=reset-token");

  fireEvent.change(screen.getByLabelText(/^new password$/i), {
    target: { value: "supersecretpass456" }
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

  window.history.pushState({}, "", "/auth/reset-password?token=first-token");

  try {
    view = render(
      <BrowserRouter>
        <Routes>
          <Route path="/auth/reset-password" element={<ResetPasswordRoute />} />
        </Routes>
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/^new password$/i), {
      target: { value: "supersecretpass456" }
    });
    fireEvent.click(screen.getByRole("button", { name: /update password/i }));

    await waitFor(() => {
      expect(commitMutationMock).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: {
            token: "first-token",
            password: "supersecretpass456"
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

    await act(async () => {
      window.history.pushState({}, "", "/auth/reset-password?token=second-token");
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

  window.history.pushState({}, "", "/auth/reset-password?token=first-token");

  try {
    view = render(
      <BrowserRouter>
        <Routes>
          <Route path="/auth/reset-password" element={<ResetPasswordRoute />} />
        </Routes>
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/^new password$/i), {
      target: { value: "supersecretpass456" }
    });
    fireEvent.click(screen.getByRole("button", { name: /update password/i }));

    await waitFor(() => {
      expect(commitMutationMock).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: {
            token: "first-token",
            password: "supersecretpass456"
          }
        })
      );
    });

    const firstRequest = latestMutationOptions();

    await act(async () => {
      window.history.pushState({}, "", "/auth/reset-password?token=second-token");
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
            token: "second-token",
            password: "supersecretpass456"
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
  renderRoute("/auth/verify-email?token=confirm-token");

  await waitFor(() => {
    expect(commitMutationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: { token: "confirm-token" }
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
  const firstView = renderRoute("/auth/verify-email?token=confirm-token");

  await waitFor(() => {
    expect(commitMutationMock).toHaveBeenCalledTimes(1);
  });

  failLatestMutation(new Error("temporary outage"));

  expect(await screen.findByRole("alert")).toHaveTextContent("Request failed. Please try again.");

  firstView.unmount();

  renderRoute("/auth/verify-email?token=confirm-token");

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
  const firstView = renderRoute("/auth/verify-email?token=confirm-token");

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

  renderRoute("/auth/verify-email?token=confirm-token");

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
  const firstView = renderRoute("/auth/verify-email?token=confirm-token");

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

  renderRoute("/auth/verify-email?token=confirm-token");

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
  renderRoute("/auth/verify-email?token=confirm-token", { strictMode: true });

  await waitFor(() => {
    expect(commitMutationMock).toHaveBeenCalledTimes(1);
  });
});
