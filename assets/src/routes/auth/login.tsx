import type { FormEvent } from "react";
import { useState } from "react";
import { useMutation } from "react-relay";
import { useNavigate } from "react-router-dom";
import loginMutation, { type LoginMutation } from "../../__generated__/LoginMutation.graphql";
import {
  findMutationError,
  type MutationError,
  normalizeSessionPayload,
  transportMutationError
} from "./errors";
import { AuthField, AuthFormShell, AuthSubmitButton } from "./form-shell";

export function LoginRoute() {
  const navigate = useNavigate();
  const [errors, setErrors] = useState<MutationError[]>([]);
  const [commitLogin, isSubmitting] = useMutation<LoginMutation>(loginMutation);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors([]);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    commitLogin({
      variables: { email, password },
      onCompleted(response) {
        const result = normalizeSessionPayload(response.login);

        if (result.viewer) {
          navigate("/");
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
