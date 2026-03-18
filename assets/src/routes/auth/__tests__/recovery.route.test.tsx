import { StrictMode } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { RelayEnvironmentProvider } from "react-relay";
import { BrowserRouter, createMemoryRouter, RouterProvider, Route, createRoutesFromElements, Routes } from "react-router-dom";
import { createRelayEnvironment } from "../../../relay/environment";
import { fetchGraphQL } from "../../../relay/fetch-graphql";
import { ForgotPasswordRoute } from "../forgot-password";
import { ResetPasswordRoute } from "../reset-password";
import {
  resetVerifyEmailRequestCache,
  VerifyEmailRoute
} from "../verify-email";

vi.mock("../../../relay/fetch-graphql", () => ({
  fetchGraphQL: vi.fn()
}));

const fetchGraphQLMock = vi.mocked(fetchGraphQL);

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

  const content = (
    <RelayEnvironmentProvider environment={createRelayEnvironment()}>
      <RouterProvider router={router} />
    </RelayEnvironmentProvider>
  );

  const view = render(
    options?.strictMode ? <StrictMode>{content}</StrictMode> : content
  );

  return { router, unmount: view.unmount };
}

beforeEach(() => {
  fetchGraphQLMock.mockReset();
  resetVerifyEmailRequestCache();
});

test("forgot password route submits the email and shows the privacy-safe success state", async () => {
  fetchGraphQLMock.mockResolvedValue({
    data: {
      forgotPassword: {
        ok: true,
        errors: []
      }
    }
  });

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
    expect(fetchGraphQLMock).toHaveBeenCalledWith(
      expect.stringContaining("mutation ForgotPassword"),
      { email: "person@example.com" }
    );
  });

  expect(
    await screen.findByRole("status")
  ).toHaveTextContent("If an account exists for that email, reset instructions are on the way.");
});

test("reset password route reads the token from the URL and submits the new password", async () => {
  fetchGraphQLMock.mockResolvedValue({
    data: {
      resetPassword: {
        ok: true,
        errors: []
      }
    }
  });

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
    expect(fetchGraphQLMock).toHaveBeenCalledWith(
      expect.stringContaining("mutation ResetPassword"),
      {
        token: "reset-token",
        password: "supersecretpass456"
      }
    );
  });

  expect(await screen.findByText("Your password has been updated.")).toBeInTheDocument();
});

test("reset password route clears stale success state when the token changes", async () => {
  const originalPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  let view: ReturnType<typeof render> | null = null;

  fetchGraphQLMock.mockResolvedValue({
    data: {
      resetPassword: {
        ok: true,
        errors: []
      }
    }
  });

  window.history.pushState({}, "", "/auth/reset-password?token=first-token");

  try {
    view = render(
      <RelayEnvironmentProvider environment={createRelayEnvironment()}>
        <BrowserRouter>
          <Routes>
            <Route path="/auth/reset-password" element={<ResetPasswordRoute />} />
          </Routes>
        </BrowserRouter>
      </RelayEnvironmentProvider>
    );

    fireEvent.change(screen.getByLabelText(/^new password$/i), {
      target: { value: "supersecretpass456" }
    });
    fireEvent.click(screen.getByRole("button", { name: /update password/i }));

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

  let resolveFirstRequest:
    | ((value: { data: { resetPassword: { ok: boolean; errors: never[] } } }) => void)
    | null = null;

  fetchGraphQLMock
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFirstRequest = resolve;
        })
    )
    .mockResolvedValueOnce({
      data: {
        resetPassword: {
          ok: true,
          errors: []
        }
      }
    });

  window.history.pushState({}, "", "/auth/reset-password?token=first-token");

  try {
    view = render(
      <RelayEnvironmentProvider environment={createRelayEnvironment()}>
        <BrowserRouter>
          <Routes>
            <Route path="/auth/reset-password" element={<ResetPasswordRoute />} />
          </Routes>
        </BrowserRouter>
      </RelayEnvironmentProvider>
    );

    fireEvent.change(screen.getByLabelText(/^new password$/i), {
      target: { value: "supersecretpass456" }
    });
    fireEvent.click(screen.getByRole("button", { name: /update password/i }));

    await waitFor(() => {
      expect(fetchGraphQLMock).toHaveBeenCalledWith(
        expect.stringContaining("mutation ResetPassword"),
        {
          token: "first-token",
          password: "supersecretpass456"
        }
      );
    });

    await act(async () => {
      window.history.pushState({}, "", "/auth/reset-password?token=second-token");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    await act(async () => {
      resolveFirstRequest?.({
        data: {
          resetPassword: {
            ok: true,
            errors: []
          }
        }
      });
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.queryByText("Your password has been updated.")).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /update password/i }));

    await waitFor(() => {
      expect(fetchGraphQLMock).toHaveBeenLastCalledWith(
        expect.stringContaining("mutation ResetPassword"),
        {
          token: "second-token",
          password: "supersecretpass456"
        }
      );
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

test("verify email route consumes the URL token and reports success", async () => {
  fetchGraphQLMock.mockResolvedValue({
    data: {
      verifyEmail: {
        ok: true,
        errors: []
      }
    }
  });

  renderRoute("/auth/verify-email?token=confirm-token");

  await waitFor(() => {
    expect(fetchGraphQLMock).toHaveBeenCalledWith(
      expect.stringContaining("mutation VerifyEmail"),
      { token: "confirm-token" }
    );
  });

  expect(await screen.findByText("Your email address is verified.")).toBeInTheDocument();
});

test("verify email route retries after a transient failure on remount", async () => {
  fetchGraphQLMock
    .mockRejectedValueOnce(new Error("temporary outage"))
    .mockResolvedValueOnce({
      data: {
        verifyEmail: {
          ok: true,
          errors: []
        }
      }
    });

  const firstView = renderRoute("/auth/verify-email?token=confirm-token");

  expect(await screen.findByRole("alert")).toHaveTextContent("Request failed. Please try again.");
  expect(fetchGraphQLMock).toHaveBeenCalledTimes(1);

  firstView.unmount();

  renderRoute("/auth/verify-email?token=confirm-token");

  expect(await screen.findByText("Your email address is verified.")).toBeInTheDocument();
  expect(fetchGraphQLMock).toHaveBeenCalledTimes(2);
});

test("verify email route retries after a resolved failed payload on remount", async () => {
  fetchGraphQLMock
    .mockResolvedValueOnce({
      data: {
        verifyEmail: {
          ok: false,
          errors: []
        }
      }
    })
    .mockResolvedValueOnce({
      data: {
        verifyEmail: {
          ok: true,
          errors: []
        }
      }
    });

  const firstView = renderRoute("/auth/verify-email?token=confirm-token");

  expect(await screen.findByRole("alert")).toHaveTextContent("Request failed. Please try again.");
  expect(fetchGraphQLMock).toHaveBeenCalledTimes(1);

  firstView.unmount();

  renderRoute("/auth/verify-email?token=confirm-token");

  expect(await screen.findByText("Your email address is verified.")).toBeInTheDocument();
  expect(fetchGraphQLMock).toHaveBeenCalledTimes(2);
});

test("verify email route only submits a single-use token once in strict mode", async () => {
  fetchGraphQLMock.mockResolvedValue({
    data: {
      verifyEmail: {
        ok: true,
        errors: []
      }
    }
  });

  renderRoute("/auth/verify-email?token=confirm-token", { strictMode: true });

  await waitFor(() => {
    expect(fetchGraphQLMock).toHaveBeenCalledTimes(1);
  });
});
