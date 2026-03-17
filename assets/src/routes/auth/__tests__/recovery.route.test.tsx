import { StrictMode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { RelayEnvironmentProvider } from "react-relay";
import { MemoryRouter, Route, Routes } from "react-router-dom";
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
  const content = (
    <RelayEnvironmentProvider environment={createRelayEnvironment()}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/auth/forgot-password" element={<ForgotPasswordRoute />} />
          <Route path="/auth/reset-password" element={<ResetPasswordRoute />} />
          <Route path="/auth/verify-email" element={<VerifyEmailRoute />} />
        </Routes>
      </MemoryRouter>
    </RelayEnvironmentProvider>
  );

  render(
    options?.strictMode ? <StrictMode>{content}</StrictMode> : content
  );
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
    await screen.findByText("If an account exists for that email, reset instructions are on the way.")
  ).toBeInTheDocument();
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
