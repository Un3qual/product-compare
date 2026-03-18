import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthField, AuthFormShell, AuthSubmitButton } from "../form-shell";

test("auth form shell uses shared primitives for labels, actions, and footer links", () => {
  render(
    <MemoryRouter>
      <AuthFormShell
        description="Use the shared auth shell."
        errors={[{ code: "INVALID_ARGUMENT", field: null, message: "Request failed." }]}
        footerLinks={[{ label: "Create account", to: "/auth/register" }]}
        title="Sign in"
      >
        <form>
          <AuthField error="Email is required." label="Email" name="email" type="email" />
          <AuthSubmitButton disabled>Sign in</AuthSubmitButton>
        </form>
      </AuthFormShell>
    </MemoryRouter>
  );

  expect(screen.getByText("Email").closest("label")).toHaveAttribute("data-slot", "label");
  expect(screen.getByLabelText("Email")).toHaveAttribute("aria-describedby", "email-error");
  expect(screen.getByText("Email is required.")).toHaveAttribute("id", "email-error");
  expect(screen.getByRole("button", { name: "Sign in" })).toHaveAttribute(
    "data-slot",
    "button"
  );
  expect(screen.getByRole("link", { name: "Create account" })).toHaveAttribute(
    "data-slot",
    "button"
  );
  expect(screen.getByRole("alert")).toHaveTextContent("Request failed.");
});
