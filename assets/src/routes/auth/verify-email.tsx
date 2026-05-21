import { useEffect, useState } from "react";
import { useMutation, type MutationCommitFn } from "react-relay";
import { useSearchParams } from "react-router-dom";
import verifyEmailMutation, {
  type VerifyEmailMutation
} from "../../__generated__/VerifyEmailMutation.graphql";
import {
  type AuthActionResult,
  type MutationError,
  normalizeActionPayload,
  transportMutationError
} from "./errors";
import { AuthFormShell } from "./form-shell";

const verificationRequests = new Map<string, Promise<AuthActionResult>>();
type VerifyEmailCommit = MutationCommitFn<VerifyEmailMutation>;

const missingTokenError: MutationError = {
  code: "INVALID_TOKEN",
  field: "token",
  message: "This verification link is missing or invalid."
};

export function VerifyEmailRoute() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const [errors, setErrors] = useState<MutationError[]>(token ? [] : [missingTokenError]);
  const [isLoading, setIsLoading] = useState(Boolean(token));
  const [message, setMessage] = useState<string | null>(null);
  const [commitVerifyEmail] = useMutation<VerifyEmailMutation>(verifyEmailMutation);

  useEffect(() => {
    let cancelled = false;

    async function consumeVerificationToken() {
      if (!token) {
        setIsLoading(false);
        setMessage(null);
        setErrors([missingTokenError]);
        return;
      }

      try {
        setIsLoading(true);
        setMessage(null);
        setErrors([]);

        const result = await verifyEmailOnce(token, commitVerifyEmail);

        if (cancelled) {
          return;
        }

        if (result.ok && result.errors.length === 0) {
          setMessage("Your email address is verified.");
          setErrors([]);
        } else {
          setErrors(result.errors);
        }
      } catch (error) {
        if (!cancelled) {
          setErrors([
            transportMutationError(error)
          ]);
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
  }, [commitVerifyEmail, token]);

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
      <p>{isLoading ? "Checking your verification link…" : "Verification status is ready."}</p>
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
  const request = new Promise<AuthActionResult>((resolve, reject) => {
    commitVerifyEmail({
      variables: { token },
      onCompleted(response) {
        resolve(normalizeActionPayload(response.verifyEmail));
      },
      onError(error) {
        reject(error);
      }
    });
  })
    .then((result) => {
      if (!result.ok || result.errors.length > 0) {
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
