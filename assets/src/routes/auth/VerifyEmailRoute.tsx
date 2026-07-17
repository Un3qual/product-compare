import { useEffect, useRef, useState } from "react";
import { useMutation, type MutationCommitFn } from "react-relay";
import { useSearchParams } from "react-router-dom";
import verifyEmailMutation, {
  type VerifyEmailMutation
} from "../../__generated__/VerifyEmailMutation.graphql";
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
  buildVerifyEmailVariables,
  verifyEmailResultIsCacheable,
  VERIFY_EMAIL_MISSING_TOKEN_ERROR,
  VERIFY_EMAIL_SUCCESS_MESSAGE,
  verifyEmailStatusCopy
} from "./verify-email-data";

const verificationRequests = new Map<string, Promise<AuthActionResult>>();
type VerifyEmailCommit = MutationCommitFn<VerifyEmailMutation>;

export function VerifyEmailRoute() {
  const [searchParams] = useSearchParams();
  const requestData = buildVerifyEmailRequestData(searchParams.get("token"));
  const token = requestData.token;
  const [errors, setErrors] = useState<MutationError[]>(requestData.initialErrors);
  const [isLoading, setIsLoading] = useState(requestData.isLoading);
  const [message, setMessage] = useState<string | null>(null);
  const [commitVerifyEmail] = useMutation<VerifyEmailMutation>(verifyEmailMutation);
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

    void consumeVerificationToken();

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
      <p>{verifyEmailStatusCopy(isLoading)}</p>
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
    variables: buildVerifyEmailVariables(token)
  })
    .then(({ response, graphQLErrors }) =>
      resolveActionMutationResult(response?.verifyEmail, graphQLErrors)
    )
    .then((result) => {
      if (!verifyEmailResultIsCacheable(result)) {
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
