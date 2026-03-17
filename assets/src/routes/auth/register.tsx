import type { FormEvent } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  findMutationError,
  type MutationError,
  registerWithPassword
} from "./actions";
import { AuthField, AuthFormShell, AuthSubmitButton } from "./form-shell";

export function RegisterRoute() {
  const navigate = useNavigate();
  const [errors, setErrors] = useState<MutationError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors([]);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);

    try {
      const result = await registerWithPassword(
        String(formData.get("email") ?? ""),
        String(formData.get("password") ?? "")
      );

      if (result.viewer) {
        navigate("/");
        return;
      }

      setErrors(result.errors);
    } catch (error) {
      setErrors([{ code: "NETWORK_ERROR", field: null, message: formatUnknownError(error) }]);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthFormShell
      description="Create an email/password account and let Phoenix establish the browser session."
      errors={errors}
      fieldNames={["email", "password"]}
      footerLinks={[
        { label: "Sign in instead", to: "/auth/login" },
        { label: "Forgot password?", to: "/auth/forgot-password" }
      ]}
      title="Create your account"
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
          autoComplete="new-password"
          error={findMutationError(errors, "password")}
          label="Password"
          name="password"
          type="password"
        />
        <AuthSubmitButton disabled={isSubmitting}>Create account</AuthSubmitButton>
      </form>
    </AuthFormShell>
  );
}

function formatUnknownError(error: unknown) {
  return error instanceof Error ? error.message : "Request failed";
}
