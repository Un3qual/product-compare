import type { FormEvent } from "react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  findMutationError,
  type MutationError,
  resetPassword
} from "./actions";
import { AuthField, AuthFormShell, AuthSubmitButton } from "./form-shell";

const missingTokenError: MutationError = {
  code: "INVALID_TOKEN",
  field: "token",
  message: "This reset link is missing or invalid."
};

export function ResetPasswordRoute() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const [errors, setErrors] = useState<MutationError[]>(token ? [] : [missingTokenError]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors(token ? [] : [missingTokenError]);
    setMessage(null);

    if (!token) {
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);

    try {
      const result = await resetPassword(
        token,
        String(formData.get("password") ?? "")
      );

      if (result.ok && result.errors.length === 0) {
        setMessage("Your password has been updated.");
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
      description="Choose a new password after the reset link proves your identity."
      errors={errors}
      fieldNames={["password"]}
      footerLinks={[{ label: "Back to sign in", to: "/auth/login" }]}
      successMessage={message}
      title="Set a new password"
    >
      <form onSubmit={handleSubmit}>
        <AuthField
          autoComplete="new-password"
          error={findMutationError(errors, "password")}
          label="New password"
          name="password"
          type="password"
        />
        <AuthSubmitButton disabled={isSubmitting || !token}>Update password</AuthSubmitButton>
      </form>
    </AuthFormShell>
  );
}

function formatUnknownError(error: unknown) {
  return error instanceof Error ? error.message : "Request failed";
}
