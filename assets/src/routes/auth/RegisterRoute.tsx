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
  type MutationError,
  resolveSessionMutationResult,
  transportMutationErrors
} from "./errors";
import { CredentialAuthForm } from "./CredentialAuthForm";
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
    <CredentialAuthForm
      description="Create an email/password account and let Phoenix establish the browser session."
      errors={errors}
      footerLinks={[
        { label: "Sign in instead", to: "/auth/login" },
        { label: "Forgot password?", to: "/auth/forgot-password" }
      ]}
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
      passwordAutoComplete="new-password"
      submitLabel="Create account"
      title="Create your account"
    />
  );
}
