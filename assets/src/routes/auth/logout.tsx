import type { FormEvent } from "react";
import { useState } from "react";
import { useMutation, useRelayEnvironment } from "react-relay";
import { useNavigate } from "react-router-dom";
import logoutMutation, {
  type LogoutMutation
} from "../../__generated__/LogoutMutation.graphql";
import { commitRouteMutation } from "../relay-mutations";
import {
  isSuccessfulActionResult,
  type MutationError,
  resolveActionMutationResult,
  transportMutationErrors
} from "./errors";
import { AuthFormShell, AuthSubmitButton } from "./form-shell";
import { clearRootViewer } from "./viewer-store";

export function LogoutRoute() {
  const relayEnvironment = useRelayEnvironment();
  const navigate = useNavigate();
  const [errors, setErrors] = useState<MutationError[]>([]);
  const [commitLogout, isSubmitting] = useMutation<LogoutMutation>(logoutMutation);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors([]);

    commitRouteMutation(
      commitLogout,
      {
        variables: {},
        onCompleted(response, graphQLErrors) {
          const result = resolveActionMutationResult(response?.logout, graphQLErrors);

          if (isSuccessfulActionResult(result)) {
            clearRootViewer(relayEnvironment);
            navigate("/auth/login");
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
      description="Clear the Phoenix browser session with the GraphQL logout flow."
      errors={errors}
      footerLinks={[
        { label: "Back to sign in", to: "/auth/login" },
        { label: "Browse products", to: "/products" }
      ]}
      title="Sign out"
    >
      <form onSubmit={handleSubmit}>
        <AuthSubmitButton disabled={isSubmitting}>Sign out</AuthSubmitButton>
      </form>
    </AuthFormShell>
  );
}
