import type { FormEvent } from "react";
import { useState } from "react";
import { useMutation } from "react-relay";
import { useNavigate } from "react-router-dom";
import registerMutation, {
  type RegisterMutation
} from "../../__generated__/RegisterMutation.graphql";
import {
  findMutationError,
  type MutationError,
  normalizeSessionPayload,
  transportMutationError
} from "./errors";
import { AuthField, AuthFormShell, AuthSubmitButton } from "./form-shell";

export function RegisterRoute() {
  const navigate = useNavigate();
  const [errors, setErrors] = useState<MutationError[]>([]);
  const [commitRegister, isSubmitting] = useMutation<RegisterMutation>(registerMutation);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors([]);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    commitRegister({
      variables: { email, password },
      onCompleted(response) {
        const result = normalizeSessionPayload(response.register);

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
