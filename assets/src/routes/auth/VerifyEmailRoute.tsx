import { useEffect, useRef, useState } from "react";
import { graphql, useMutation, type MutationCommitFn } from "react-relay";
import { useSearchParams } from "react-router-dom";
import type { VerifyEmailRouteMutation } from "$generated/VerifyEmailRouteMutation.graphql";
import { commitRouteMutationPromise } from "../relay-mutations";
import {
  type AuthActionResult,
  isSuccessfulActionResult,
  type MutationError,
  resolveActionMutationResult,
  transportMutationErrors
} from "./errors";
import { AuthFormShell } from "./AuthFormShell";
import {
  buildVerifyEmailRequestData,
  VERIFY_EMAIL_MISSING_TOKEN_ERROR,
  VERIFY_EMAIL_SUCCESS_MESSAGE
} from "./verify-email-data";

const verifyEmailMutation = graphql`
  mutation VerifyEmailRouteMutation($token: String!) {
    verifyEmail(token: $token) {
      ok
      errors {
        code
        field
        message
      }
    }
  }
`;

const verificationRequests = new Map<string, Promise<AuthActionResult>>();
type VerifyEmailCommit = MutationCommitFn<VerifyEmailRouteMutation>;

export function VerifyEmailRoute() {
  const [searchParams] = useSearchParams();
  const requestData = buildVerifyEmailRequestData(searchParams.get("token"));
  const token = requestData.token;
  const [errors, setErrors] = useState<MutationError[]>(requestData.initialErrors);
  const [isLoading, setIsLoading] = useState(requestData.isLoading);
  const [message, setMessage] = useState<string | null>(null);
  const [commitVerifyEmail] = useMutation<VerifyEmailRouteMutation>(verifyEmailMutation);
  // Only token changes should restart verification; still call the latest Relay commit.
  const commitVerifyEmailRef = useRef(commitVerifyEmail);
  commitVerifyEmailRef.current = commitVerifyEmail;

  useEffect(() => {
    let cancelled = false;

    async function consumeVerificationToken() {
      if (!token) {
        setIsLoading(false);
        setMessage(null);
        setErrors([VERIFY_EMAIL_MISSING_TOKEN_ERROR]);
        return;
      }

      try {
        setIsLoading(true);
        setMessage(null);
        setErrors([]);

        const result = await verifyEmailOnce(token, (config) =>
          commitVerifyEmailRef.current(config)
        );

        if (cancelled) {
          return;
        }

        if (isSuccessfulActionResult(result)) {
          setMessage(VERIFY_EMAIL_SUCCESS_MESSAGE);
          setErrors([]);
        } else {
          setErrors(result.errors);
        }
      } catch (error) {
        if (!cancelled) {
          setErrors(transportMutationErrors(error));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    consumeVerificationToken();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <AuthFormShell
      description="Open a verification link from your inbox to confirm the account email."
      errors={errors}
      footerLinks={[
        { label: "Sign in", to: "/auth/login" },
        { label: "Create account", to: "/auth/register" }
      ]}
      successMessage={message}
      title="Verify your email"
    >
      <p>
        {isLoading
          ? "Checking your verification link…"
          : "Verification status is ready."}
      </p>
    </AuthFormShell>
  );
}

export function resetVerifyEmailRequestCache() {
  verificationRequests.clear();
}

function verifyEmailOnce(token: string, commitVerifyEmail: VerifyEmailCommit) {
  const existingRequest = verificationRequests.get(token);

  if (existingRequest) {
    return existingRequest;
  }

  // Verification tokens are single-use. Reusing successful in-flight or settled
  // requests keeps StrictMode re-mounts from burning the token twice in dev,
  // but any failed outcome must be evicted so later mounts can retry.
  const request = commitRouteMutationPromise(commitVerifyEmail, {
    variables: { token }
  })
    .then(({ response, graphQLErrors }) =>
      resolveActionMutationResult(response?.verifyEmail, graphQLErrors)
    )
    .then((result) => {
      if (!isSuccessfulActionResult(result)) {
        verificationRequests.delete(token);
      }

      return result;
    })
    .catch((error: unknown) => {
      verificationRequests.delete(token);
      throw error;
    });
  verificationRequests.set(token, request);
  return request;
}
