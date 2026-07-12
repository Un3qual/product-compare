import type { FormEvent } from "react";
import { useState } from "react";
import { useMutation, useRelayEnvironment } from "react-relay";
import { useNavigate } from "react-router-dom";
import registerMutation, {
  type RegisterMutation
} from "../../__generated__/RegisterMutation.graphql";
import { routeFormValue } from "../form-data";
import { commitRouteMutation } from "../relay-mutations";
import {
  findMutationError,
  type MutationError,
  resolveSessionMutationResult,
  transportMutationErrors
} from "./errors";
import { AuthField, AuthFormShell, AuthSubmitButton } from "./AuthFormShell";
import { setRootViewer } from "./viewer-store";

export function RegisterRoute() {
  const relayEnvironment = useRelayEnvironment();
  const navigate = useNavigate();
  const [errors, setErrors] = useState<MutationError[]>([]);
  const [commitRegister, isSubmitting] = useMutation<RegisterMutation>(registerMutation);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors([]);

    const formData = new FormData(event.currentTarget);
    const email = routeFormValue(formData, "email");
    const password = routeFormValue(formData, "password");

    commitRouteMutation(
      commitRegister,
      {
        variables: { email, password },
        onCompleted(response, graphQLErrors) {
          const result = resolveSessionMutationResult(response?.register, graphQLErrors);

          if (result.viewer) {
            setRootViewer(relayEnvironment, result.viewer);
            navigate("/");
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
