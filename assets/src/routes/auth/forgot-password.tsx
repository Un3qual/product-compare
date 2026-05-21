import type { FormEvent } from "react";
import { useState } from "react";
import { useMutation } from "react-relay";
import forgotPasswordMutation, {
  type ForgotPasswordMutation
} from "../../__generated__/ForgotPasswordMutation.graphql";
import {
  findMutationError,
  type MutationError,
  normalizeActionPayload,
  relayGraphQLError,
  transportMutationError
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
    const email = String(formData.get("email") ?? "");

    commitForgotPassword({
      variables: { email },
      onCompleted(response, graphQLErrors) {
        const graphQLError = relayGraphQLError(graphQLErrors);

        if (graphQLError) {
          setErrors([graphQLError]);
          return;
        }

        const result = normalizeActionPayload(response?.forgotPassword);

        if (result.ok && result.errors.length === 0) {
          setMessage(successMessage);
          return;
        }

        setErrors(result.errors);
      },
      onError(error) {
        setErrors([transportMutationError(error)]);
      }
    });
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
