import { graphql } from "react-relay";
import { redirect, useActionData, useNavigation, useSearchParams } from "react-router";
import type { RegisterRouteMutation } from "$generated/RegisterRouteMutation.graphql";
import type { Route } from "./+types/RegisterRoute";
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

const registerMutation = graphql`
  mutation RegisterRouteMutation($email: String!, $password: String!) {
    register(email: $email, password: $password) {
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
    title: "Create account",
    description: "Create an account to save comparisons and manage connected tools.",
  });
}

export async function clientAction({ context, request }: Route.ClientActionArgs) {
  const environment = getRelayEnvironmentFromRouterContext(context);
  const formData = await request.formData();

  try {
    const { response, graphQLErrors } =
      await commitEnvironmentMutationPromise<RegisterRouteMutation>(environment, registerMutation, {
        variables: {
          email: routeFormValue(formData, "email"),
          password: routeFormValue(formData, "password"),
        },
      });
    const result = resolveSessionMutationResult(response.register, graphQLErrors);

    if (!result.viewer) return { errors: result.errors };

    setRootViewer(environment, result.viewer);
    return redirect(safeRelativeReturnPath(new URL(request.url).searchParams.get("returnTo")) ?? "/");
  } catch (error) {
    return { errors: transportMutationErrors(error) };
  }
}

export function RegisterRoute() {
  const actionData = useActionData<typeof clientAction>();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();
  const isSubmitting = navigation.state === "submitting";
  const errors: MutationError[] = isSubmitting ? [] : (actionData?.errors ?? []);

  return (
    <CredentialAuthForm
      credentialAutoComplete="new-password"
      description="Create an email/password account and let Phoenix establish the browser session."
      errors={errors}
      footerLinks={[
        { label: "Sign in instead", to: authContinuationPath("/auth/login", searchParams) },
        { label: "Forgot password?", to: "/auth/forgot-password" },
      ]}
      isSubmitting={isSubmitting}
      submitLabel="Create account"
      title="Create your account"
    />
  );
}

export default RegisterRoute;
