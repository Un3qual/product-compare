import type { FormEvent } from "react";
import { useState } from "react";
import {
  findMutationError,
  type MutationError,
  requestPasswordReset
} from "./actions";
import { AuthField, AuthFormShell, AuthSubmitButton } from "./form-shell";

const successMessage =
  "If an account exists for that email, reset instructions are on the way.";

export function ForgotPasswordRoute() {
  const [errors, setErrors] = useState<MutationError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors([]);
    setMessage(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);

    try {
      const result = await requestPasswordReset(String(formData.get("email") ?? ""));

      if (result.ok && result.errors.length === 0) {
        setMessage(successMessage);
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
      description="Request a password-reset link through the GraphQL recovery flow."
      errors={errors}
      fieldNames={["email"]}
      footerLinks={[
        { label: "Sign in", to: "/auth/login" },
        { label: "Create account", to: "/auth/register" }
      ]}
      successMessage={message}
      title="Reset your password"
    >
      <form onSubmit={handleSubmit}>
        <AuthField
          autoComplete="email"
          error={findMutationError(errors, "email")}
          label="Email"
          name="email"
          type="email"
        />
        <AuthSubmitButton disabled={isSubmitting}>Send reset link</AuthSubmitButton>
      </form>
    </AuthFormShell>
  );
}

function formatUnknownError(error: unknown) {
  return error instanceof Error ? error.message : "Request failed";
}
