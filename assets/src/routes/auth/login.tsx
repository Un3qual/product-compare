import type { FormEvent } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  findMutationError,
  sanitizeTransportError,
  type MutationError,
  loginWithPassword
} from "./actions";
import { AuthField, AuthFormShell, AuthSubmitButton } from "./form-shell";

export function LoginRoute() {
  const navigate = useNavigate();
  const [errors, setErrors] = useState<MutationError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors([]);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);

    try {
      const result = await loginWithPassword(
        String(formData.get("email") ?? ""),
        String(formData.get("password") ?? "")
      );

      if (result.viewer) {
        navigate("/");
        return;
      }

      setErrors(result.errors);
    } catch (error) {
      setErrors([{ code: "NETWORK_ERROR", field: null, message: sanitizeTransportError(error) }]);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthFormShell
      description="Use your email and password to continue through the GraphQL auth flow."
      errors={errors}
      fieldNames={["email", "password"]}
      footerLinks={[
        { label: "Create account", to: "/auth/register" },
        { label: "Forgot password?", to: "/auth/forgot-password" }
      ]}
      title="Sign in"
    >
      <form onSubmit={handleSubmit}>
        <AuthField
          autoComplete="email"
          error={findMutationError(errors, "email")}
          label="Email"
          name="email"
          type="email"
        />
        <AuthField
          autoComplete="current-password"
          error={findMutationError(errors, "password")}
          label="Password"
          name="password"
          type="password"
        />
        <AuthSubmitButton disabled={isSubmitting}>Sign in</AuthSubmitButton>
      </form>
    </AuthFormShell>
  );
}
