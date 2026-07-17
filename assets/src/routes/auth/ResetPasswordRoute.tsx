import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { useMutation } from "react-relay";
import { useSearchParams } from "react-router-dom";
import resetPasswordMutation, {
  type ResetPasswordMutation
} from "../../__generated__/ResetPasswordMutation.graphql";
import { routeFormValue } from "../form-data";
import { commitRouteMutation } from "../relay-mutations";
import {
  findMutationError,
  isSuccessfulActionResult,
  type MutationError,
  resolveActionMutationResult,
  transportMutationErrors
} from "./errors";
import {
  RESET_PASSWORD_SUCCESS_MESSAGE,
  buildResetPasswordVariables,
  isCurrentResetPasswordRequest,
  normalizeResetPasswordToken,
  resetPasswordErrorsForToken
} from "./reset-password-data";
import { AuthField, AuthFormShell, AuthSubmitButton } from "./AuthFormShell";

export function ResetPasswordRoute() {
  const [searchParams] = useSearchParams();
  const token = normalizeResetPasswordToken(searchParams.get("token"));
  const [errors, setErrors] = useState<MutationError[]>(
    resetPasswordErrorsForToken(token)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const activeRequestVersion = useRef(0);
  const [commitResetPassword] = useMutation<ResetPasswordMutation>(resetPasswordMutation);

  useEffect(() => {
    // Bump the active request marker so late responses from an older token do not
    // overwrite the UI after navigation or a newer submit.
    activeRequestVersion.current += 1;
    setErrors(resetPasswordErrorsForToken(token));
    setMessage(null);
    setIsSubmitting(false);
  }, [token]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors(resetPasswordErrorsForToken(token));
    setMessage(null);

    if (!token) {
      return;
    }

    setIsSubmitting(true);
    activeRequestVersion.current += 1;
    const requestVersion = activeRequestVersion.current;

    const formData = new FormData(event.currentTarget);
    const password = routeFormValue(formData, "password");

    commitRouteMutation(
      commitResetPassword,
      {
        variables: buildResetPasswordVariables({ token, password }),
        onCompleted(response, graphQLErrors) {
          if (!isCurrentResetPasswordRequest(requestVersion, activeRequestVersion.current)) {
            return;
          }

          const result = resolveActionMutationResult(response?.resetPassword, graphQLErrors);

          if (isSuccessfulActionResult(result)) {
            setMessage(RESET_PASSWORD_SUCCESS_MESSAGE);
            setIsSubmitting(false);
            return;
          }

          setErrors(result.errors);
          setIsSubmitting(false);
        },
        onError(error) {
          if (!isCurrentResetPasswordRequest(requestVersion, activeRequestVersion.current)) {
            return;
          }

          setErrors(transportMutationErrors(error));
          setIsSubmitting(false);
        }
      },
      (error) => {
        if (!isCurrentResetPasswordRequest(requestVersion, activeRequestVersion.current)) {
          return;
        }

        setErrors(transportMutationErrors(error));
        setIsSubmitting(false);
      }
    );
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
