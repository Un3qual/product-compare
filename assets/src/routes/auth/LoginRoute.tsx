import type { FormEvent } from "react";
import { useState } from "react";
import { useMutation, useRelayEnvironment } from "react-relay";
import { useNavigate } from "react-router-dom";
import loginMutation, { type LoginMutation } from "../../__generated__/LoginMutation.graphql";
import { routeFormValue } from "../form-data";
import { commitRouteMutation } from "../relay-mutations";
import {
  type MutationError,
  resolveSessionMutationResult,
  transportMutationErrors
} from "./errors";
import { CredentialAuthForm } from "./CredentialAuthForm";
import { setRootViewer } from "./viewer-store";

export function LoginRoute() {
  const relayEnvironment = useRelayEnvironment();
  const navigate = useNavigate();
  const [errors, setErrors] = useState<MutationError[]>([]);
  const [commitLogin, isSubmitting] = useMutation<LoginMutation>(loginMutation);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors([]);

    const formData = new FormData(event.currentTarget);
    const email = routeFormValue(formData, "email");
    const password = routeFormValue(formData, "password");

    commitRouteMutation(
      commitLogin,
      {
        variables: { email, password },
        onCompleted(response, graphQLErrors) {
          const result = resolveSessionMutationResult(response?.login, graphQLErrors);

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
    <CredentialAuthForm
      credentialAutoComplete="current-password"
      description="Use your email and password to continue through the GraphQL auth flow."
      errors={errors}
      footerLinks={[
        { label: "Create account", to: "/auth/register" },
        { label: "Forgot password?", to: "/auth/forgot-password" }
      ]}
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
      submitLabel="Sign in"
      title="Sign in"
    />
  );
}
