import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { AuthField, AuthFormShell, AuthSubmitButton } from "../../../src/routes/auth/AuthFormShell";

test("auth form shell uses shared primitives for labels, actions, and footer links", () => {
  render(
    <MemoryRouter>
      <AuthFormShell
        description="Use the shared auth shell."
        errors={[{ code: "INVALID_ARGUMENT", field: null, message: "Request failed." }]}
        footerLinks={[{ label: "Create account", to: "/auth/register" }]}
        successMessage="Request completed."
        title="Sign in"
      >
        <form>
          <AuthField error="Email is required." label="Email" name="email" type="email" />
          <AuthSubmitButton disabled>Sign in</AuthSubmitButton>
        </form>
      </AuthFormShell>
    </MemoryRouter>
  );

  expect(screen.getByLabelText("Email")).toHaveAttribute("aria-describedby", "email-error");
  expect(screen.getByText("Email is required.")).toHaveAttribute("id", "email-error");
  expect(screen.getByRole("button", { name: "Sign in" })).toBeDisabled();
  expect(screen.getByRole("link", { name: "Create account" })).toHaveAttribute("href", "/auth/register");
  expect(screen.getByRole("alert")).toHaveTextContent("Request failed.");
  expect(screen.getByRole("status")).toHaveTextContent("Request completed.");
  expect(screen.getByRole("region", { name: "Sign in" })).toBeInTheDocument();
  expect(screen.getByRole("complementary", { name: "Account context" })).toHaveTextContent(
    "Keep your shopping decisions connected."
  );
});

test("auth global error lists render as valid server markup outside paragraph text", () => {
  const markup = renderToString(
    <MemoryRouter>
      <AuthFormShell
        description="Recover access."
        errors={[{ code: "INVALID_ARGUMENT", field: null, message: "Reset token is required." }]}
        title="Reset password"
      >
        <form />
      </AuthFormShell>
    </MemoryRouter>
  );

  expect(markup).toContain("<ul");
  expect(markup).not.toMatch(/<p[^>]*>\s*<ul/);
});
