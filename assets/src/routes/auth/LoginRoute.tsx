import type { FormEvent } from "react";
import { useState } from "react";
import { graphql, useMutation, useRelayEnvironment } from "react-relay";
import { useNavigate } from "react-router-dom";
import type { LoginRouteMutation } from "$generated/LoginRouteMutation.graphql";
import { routeFormValue } from "$frontend/forms/route-form";
import { commitRouteMutation } from "$relay/mutations";
import {
  type MutationError,
  resolveSessionMutationResult,
  transportMutationErrors,
} from "./errors";
import { CredentialAuthForm } from "./CredentialAuthForm";
import { setRootViewer } from "./viewer-store";

const loginMutation = graphql`
  mutation LoginRouteMutation($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      viewer {
        id
        email
        isOperator
      }
      errors {
        code
        field
        message
      }
    }
  }
`;

export function LoginRoute() {
  const relayEnvironment = useRelayEnvironment();
  const navigate = useNavigate();
  const [errors, setErrors] = useState<MutationError[]>([]);
  const [commitLogin, isSubmitting] = useMutation<LoginRouteMutation>(loginMutation);

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
          const result = resolveSessionMutationResult(response.login, graphQLErrors);

          if (result.viewer) {
            setRootViewer(relayEnvironment, result.viewer);
            navigate("/");
            return;
          }

          setErrors(result.errors);
        },
        onError(error) {
          setErrors(transportMutationErrors(error));
        },
      },
      (error) => {
        setErrors(transportMutationErrors(error));
      },
    );
  }

  return (
    <CredentialAuthForm
      credentialAutoComplete="current-password"
      description="Use your email and password to continue through the GraphQL auth flow."
      errors={errors}
      footerLinks={[
        { label: "Create account", to: "/auth/register" },
        { label: "Forgot password?", to: "/auth/forgot-password" },
      ]}
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
      submitLabel="Sign in"
      title="Sign in"
    />
  );
}
