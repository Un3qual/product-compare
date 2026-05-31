import type { FormEvent } from "react";
import { useState } from "react";
import { useMutation } from "react-relay";
import forgotPasswordMutation, {
  type ForgotPasswordMutation
} from "../../__generated__/ForgotPasswordMutation.graphql";
import { routeFormValue } from "../form-data";
import { commitRouteMutation } from "../relay-mutations";
import {
  findMutationError,
  isSuccessfulActionResult,
  type MutationError,
  resolveActionMutationResult,
  transportMutationErrors
} from "./errors";
import { AuthField, AuthFormShell, AuthSubmitButton } from "./form-shell";

const successMessage =
  "If an account exists for that email, reset instructions are on the way.";

export function ForgotPasswordRoute() {
  const [errors, setErrors] = useState<MutationError[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [commitForgotPassword, isSubmitting] =
    useMutation<ForgotPasswordMutation>(forgotPasswordMutation);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors([]);
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    const email = routeFormValue(formData, "email");

    commitRouteMutation(
      commitForgotPassword,
      {
        variables: { email },
        onCompleted(response, graphQLErrors) {
          const result = resolveActionMutationResult(
            response?.forgotPassword,
            graphQLErrors
          );

          if (isSuccessfulActionResult(result)) {
            setMessage(successMessage);
            return;
          }

          setErrors(result.errors);
        },
        onError(error) {
          setErrors(transportMutationErrors(error));
        }
      },
      (error) => {
        setErrors(transportMutationErrors(error));
      }
    );
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
