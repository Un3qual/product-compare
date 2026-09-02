import { graphql } from "react-relay";
import { Form, useActionData, useNavigation, useSearchParams } from "react-router";
import type { ResetPasswordRouteMutation } from "$generated/ResetPasswordRouteMutation.graphql";
import type { Route } from "./+types/ResetPasswordRoute";
import { routeMetaDescriptors } from "$frontend/seo";
import { routeFormValue } from "$frontend/forms/route-form";
import { getRelayEnvironmentFromRouterContext } from "$relay/route-preload";
import { commitEnvironmentMutationPromise } from "$relay/mutations";
import {
  findMutationError,
  invalidTokenMutationError,
  isSuccessfulActionResult,
  type MutationError,
  resolveActionMutationResult,
  transportMutationErrors,
} from "./errors";
import { AuthField, AuthFormShell, AuthSubmitButton } from "./AuthFormShell";

const RESET_PASSWORD_MISSING_TOKEN_ERROR = Object.freeze(
  invalidTokenMutationError("This reset link is missing or invalid."),
);
const CREDENTIAL_RESET_COMPLETION_MESSAGE = "Your password has been updated.";

export function meta() {
  return routeMetaDescriptors({
    title: "Reset password | Product Compare",
    description: "Choose a new password for your Product Compare account.",
  });
}

const resetPasswordMutation = graphql`
  mutation ResetPasswordRouteMutation($token: String!, $password: String!) {
    resetPassword(token: $token, password: $password) {
      ok
      errors {
        code
        field
        message
      }
    }
  }
`;

export async function clientAction({ context, request }: Route.ClientActionArgs) {
  const token = normalizeResetPasswordToken(new URL(request.url).searchParams.get("token"));
  if (!token) return { errors: [RESET_PASSWORD_MISSING_TOKEN_ERROR], message: null };

  const environment = getRelayEnvironmentFromRouterContext(context);
  const formData = await request.formData();

  try {
    const { response, graphQLErrors } =
      await commitEnvironmentMutationPromise<ResetPasswordRouteMutation>(
        environment,
        resetPasswordMutation,
        { variables: { token, password: routeFormValue(formData, "password") } },
      );
    const result = resolveActionMutationResult(response.resetPassword, graphQLErrors);

    return isSuccessfulActionResult(result)
      ? { errors: [], message: CREDENTIAL_RESET_COMPLETION_MESSAGE }
      : { errors: result.errors, message: null };
  } catch (error) {
    return { errors: transportMutationErrors(error), message: null };
  }
}

export function ResetPasswordRoute() {
  const [searchParams] = useSearchParams();
  const token = normalizeResetPasswordToken(searchParams.get("token"));
  const actionData = useActionData<typeof clientAction>();
  const isSubmitting = useNavigation().state === "submitting";
  const errors: MutationError[] = isSubmitting
    ? []
    : (actionData?.errors ?? resetPasswordErrorsForToken(token));
  const message = isSubmitting ? null : (actionData?.message ?? null);

  return (
    <AuthFormShell
      description="Choose a new password after the reset link proves your identity."
      errors={errors}
      fieldNames={["password"]}
      footerLinks={[{ label: "Back to sign in", to: "/auth/login" }]}
      successMessage={message}
      title="Set a new password"
    >
      <Form method="post">
        <AuthField
          autoComplete="new-password"
          error={findMutationError(errors, "password")}
          label="New password"
          name="password"
          type="password"
        />
        <AuthSubmitButton disabled={isSubmitting || !token}>Update password</AuthSubmitButton>
      </Form>
    </AuthFormShell>
  );
}

export default ResetPasswordRoute;

function normalizeResetPasswordToken(token: string | null) {
  return token?.trim() ?? "";
}

function resetPasswordErrorsForToken(token: string): MutationError[] {
  return token ? [] : [RESET_PASSWORD_MISSING_TOKEN_ERROR];
}
