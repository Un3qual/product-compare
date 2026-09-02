import { graphql } from "react-relay";
import { Form, redirect, useActionData, useNavigation } from "react-router";
import type { LogoutRouteMutation } from "$generated/LogoutRouteMutation.graphql";
import type { Route } from "./+types/LogoutRoute";
import { routeMetaDescriptors } from "$frontend/seo";
import { getRelayEnvironmentFromRouterContext } from "$relay/route-preload";
import { commitEnvironmentMutationPromise } from "$relay/mutations";
import {
  isSuccessfulActionResult,
  type MutationError,
  resolveActionMutationResult,
  transportMutationErrors,
} from "./errors";
import { AuthFormShell, AuthSubmitButton } from "./AuthFormShell";
import { clearRootViewer } from "./viewer-store";

const logoutMutation = graphql`
  mutation LogoutRouteMutation {
    logout {
      ok
      errors {
        code
        field
        message
      }
    }
  }
`;

export function meta() {
  return routeMetaDescriptors({
    title: "Sign out | Product Compare",
    description: "Sign out of your Product Compare account.",
  });
}

export async function clientAction({ context }: Route.ClientActionArgs) {
  const environment = getRelayEnvironmentFromRouterContext(context);

  try {
    const { response, graphQLErrors } =
      await commitEnvironmentMutationPromise<LogoutRouteMutation>(environment, logoutMutation, {
        variables: {},
      });
    const result = resolveActionMutationResult(response.logout, graphQLErrors);

    if (!isSuccessfulActionResult(result)) return { errors: result.errors };

    clearRootViewer(environment);
    return redirect("/auth/login");
  } catch (error) {
    return { errors: transportMutationErrors(error) };
  }
}

export function LogoutRoute() {
  const actionData = useActionData<typeof clientAction>();
  const isSubmitting = useNavigation().state === "submitting";
  const errors: MutationError[] = isSubmitting ? [] : (actionData?.errors ?? []);

  return (
    <AuthFormShell
      description="Sign out of your account."
      errors={errors}
      footerLinks={[
        { label: "Back to sign in", to: "/auth/login" },
        { label: "Browse products", to: "/products" },
      ]}
      successMessage={null}
      title="Sign out"
    >
      <Form method="post">
        <AuthSubmitButton disabled={isSubmitting}>Sign out</AuthSubmitButton>
      </Form>
    </AuthFormShell>
  );
}

export default LogoutRoute;
