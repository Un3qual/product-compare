import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { useMutation } from "react-relay";
import { useSearchParams } from "react-router-dom";
import resetPasswordMutation, {
  type ResetPasswordMutation
} from "../../__generated__/ResetPasswordMutation.graphql";
import {
  findMutationError,
  type MutationError,
  normalizeActionPayload,
  transportMutationError
} from "./errors";
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
  const activeRequestVersion = useRef(0);
  const [commitResetPassword] = useMutation<ResetPasswordMutation>(resetPasswordMutation);

  useEffect(() => {
    // Bump the active request marker so late responses from an older token do not
    // overwrite the UI after navigation or a newer submit.
    activeRequestVersion.current += 1;
    setErrors(token ? [] : [missingTokenError]);
    setMessage(null);
    setIsSubmitting(false);
  }, [token]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors(token ? [] : [missingTokenError]);
    setMessage(null);

    if (!token) {
      return;
    }

    setIsSubmitting(true);
    activeRequestVersion.current += 1;
    const requestVersion = activeRequestVersion.current;

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");

    commitResetPassword({
      variables: { token, password },
      onCompleted(response) {
        const result = normalizeActionPayload(response.resetPassword);

        if (requestVersion !== activeRequestVersion.current) {
          return;
        }

        if (result.ok && result.errors.length === 0) {
          setMessage("Your password has been updated.");
          setIsSubmitting(false);
          return;
        }

        setErrors(result.errors);
        setIsSubmitting(false);
      },
      onError(error) {
        if (requestVersion !== activeRequestVersion.current) {
          return;
        }

        setErrors([transportMutationError(error)]);
        setIsSubmitting(false);
      }
    });
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
