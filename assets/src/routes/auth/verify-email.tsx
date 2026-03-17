import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  type MutationError,
  verifyEmail
} from "./actions";
import { AuthFormShell } from "./form-shell";

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
        return;
      }

      try {
        const result = await verifyEmail(token);

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
            { code: "NETWORK_ERROR", field: null, message: formatUnknownError(error) }
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

function formatUnknownError(error: unknown) {
  return error instanceof Error ? error.message : "Request failed";
}
