import { graphql } from "react-relay";
import { redirect, useActionData, useNavigation, useSearchParams } from "react-router";
import type { LoginRouteMutation } from "$generated/LoginRouteMutation.graphql";
import type { Route } from "./+types/LoginRoute";
import { staticRouteMetaDescriptors } from "$frontend/seo";
import { routeFormValue } from "$frontend/forms/route-form";
import { getRelayEnvironmentFromRouterContext } from "$relay/route-preload";
import { commitEnvironmentMutationPromise } from "$relay/mutations";
import {
  type MutationError,
  resolveSessionMutationResult,
  transportMutationErrors,
} from "./errors";
import { CredentialAuthForm } from "./CredentialAuthForm";
import { authContinuationPath, safeRelativeReturnPath } from "./continuity";
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

export function meta() {
  return staticRouteMetaDescriptors({
    title: "Sign in",
    description: "Sign in to manage saved comparisons and account tools.",
  });
}

export async function clientAction({ context, request }: Route.ClientActionArgs) {
  const environment = getRelayEnvironmentFromRouterContext(context);
  const formData = await request.formData();

  try {
    const { response, graphQLErrors } =
      await commitEnvironmentMutationPromise<LoginRouteMutation>(environment, loginMutation, {
        variables: {
          email: routeFormValue(formData, "email"),
          password: routeFormValue(formData, "password"),
        },
      });
    const result = resolveSessionMutationResult(response.login, graphQLErrors);

    if (!result.viewer) return { errors: result.errors };

    setRootViewer(environment, result.viewer);
    return redirect(safeRelativeReturnPath(new URL(request.url).searchParams.get("returnTo")) ?? "/");
  } catch (error) {
    return { errors: transportMutationErrors(error) };
  }
}

export function LoginRoute() {
  const actionData = useActionData<typeof clientAction>();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();
  const isSubmitting = navigation.state === "submitting";
  const errors: MutationError[] = isSubmitting ? [] : (actionData?.errors ?? []);

  return (
    <CredentialAuthForm
      credentialAutoComplete="current-password"
      description="Use your email and password to continue through the GraphQL auth flow."
      errors={errors}
      footerLinks={[
        { label: "Create account", to: authContinuationPath("/auth/register", searchParams) },
        { label: "Forgot password?", to: "/auth/forgot-password" },
      ]}
      isSubmitting={isSubmitting}
      submitLabel="Sign in"
      title="Sign in"
    />
  );
}

export default LoginRoute;
