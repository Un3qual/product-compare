import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  type AuthActionResult,
  sanitizeTransportError,
  type MutationError,
  verifyEmail
} from "./actions";
import { AuthFormShell } from "./form-shell";

const verificationRequests = new Map<string, Promise<AuthActionResult>>();

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

        const result = await verifyEmailOnce(token);

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
            { code: "NETWORK_ERROR", field: null, message: sanitizeTransportError(error) }
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
      <p>{isLoading ? "Checking your verification link…" : "Verification status is ready."}</p>
    </AuthFormShell>
  );
}

export function resetVerifyEmailRequestCache() {
  verificationRequests.clear();
}

function verifyEmailOnce(token: string) {
  const existingRequest = verificationRequests.get(token);

  if (existingRequest) {
    return existingRequest;
  }

  // Verification tokens are single-use. Reusing successful in-flight or settled
  // requests keeps StrictMode re-mounts from burning the token twice in dev,
  // but any failed outcome must be evicted so later mounts can retry.
  const request = verifyEmail(token)
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
