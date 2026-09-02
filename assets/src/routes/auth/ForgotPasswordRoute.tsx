import { graphql } from "react-relay";
import { Form, useActionData, useNavigation } from "react-router";
import type { ForgotPasswordRouteMutation } from "$generated/ForgotPasswordRouteMutation.graphql";
import type { Route } from "./+types/ForgotPasswordRoute";
import { routeMetaDescriptors } from "$frontend/seo";
import { routeFormValue } from "$frontend/forms/route-form";
import { getRelayEnvironmentFromRouterContext } from "$relay/route-preload";
import { commitEnvironmentMutationPromise } from "$relay/mutations";
import {
  findMutationError,
  isSuccessfulActionResult,
  type MutationError,
  resolveActionMutationResult,
  transportMutationErrors,
} from "./errors";
import { AuthField, AuthFormShell, AuthSubmitButton } from "./AuthFormShell";

const forgotPasswordMutation = graphql`
  mutation ForgotPasswordRouteMutation($email: String!) {
    forgotPassword(email: $email) {
      ok
      errors {
        code
        field
        message
      }
    }
  }
`;

const successMessage = "If an account exists for that email, reset instructions are on the way.";

export function meta() {
  return routeMetaDescriptors({
    title: "Forgot password | Product Compare",
    description: "Request a secure Product Compare password reset link.",
  });
}

export async function clientAction({ context, request }: Route.ClientActionArgs) {
  const environment = getRelayEnvironmentFromRouterContext(context);
  const formData = await request.formData();

  try {
    const { response, graphQLErrors } =
      await commitEnvironmentMutationPromise<ForgotPasswordRouteMutation>(
        environment,
        forgotPasswordMutation,
        { variables: { email: routeFormValue(formData, "email") } },
      );
    const result = resolveActionMutationResult(response.forgotPassword, graphQLErrors);

    return isSuccessfulActionResult(result)
      ? { errors: [], message: successMessage }
      : { errors: result.errors, message: null };
  } catch (error) {
    return { errors: transportMutationErrors(error), message: null };
  }
}

export function ForgotPasswordRoute() {
  const actionData = useActionData<typeof clientAction>();
  const isSubmitting = useNavigation().state === "submitting";
  const errors: MutationError[] = isSubmitting ? [] : (actionData?.errors ?? []);
  const message = isSubmitting ? null : (actionData?.message ?? null);

  return (
    <AuthFormShell
      description="Request a password-reset link through the GraphQL recovery flow."
      errors={errors}
      fieldNames={["email"]}
      footerLinks={[
        { label: "Sign in", to: "/auth/login" },
        { label: "Create account", to: "/auth/register" },
      ]}
      successMessage={message}
      title="Reset your password"
    >
      <Form method="post">
        <AuthField
          autoComplete="email"
          error={findMutationError(errors, "email")}
          label="Email"
          name="email"
          type="email"
        />
        <AuthSubmitButton disabled={isSubmitting}>Send reset link</AuthSubmitButton>
      </Form>
    </AuthFormShell>
  );
}

export default ForgotPasswordRoute;
