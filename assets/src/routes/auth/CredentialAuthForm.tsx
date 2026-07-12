import type { FormEventHandler } from "react";
import { AuthField, AuthFormShell, AuthSubmitButton } from "./AuthFormShell";
import { findMutationError, type MutationError } from "./errors";

interface CredentialAuthFooterLink {
  label: string;
  to: string;
}

interface CredentialAuthFormProps {
  description: string;
  errors: MutationError[];
  footerLinks: CredentialAuthFooterLink[];
  isSubmitting: boolean;
  onSubmit: FormEventHandler<HTMLFormElement>;
  passwordAutoComplete: "current-password" | "new-password";
  submitLabel: string;
  title: string;
}

export function CredentialAuthForm({
  description,
  errors,
  footerLinks,
  isSubmitting,
  onSubmit,
  passwordAutoComplete,
  submitLabel,
  title
}: CredentialAuthFormProps) {
  return (
    <AuthFormShell
      description={description}
      errors={errors}
      fieldNames={["email", "password"]}
      footerLinks={footerLinks}
      title={title}
    >
      <form onSubmit={onSubmit}>
        <AuthField
          autoComplete="email"
          error={findMutationError(errors, "email")}
          label="Email"
          name="email"
          type="email"
        />
        <AuthField
          autoComplete={passwordAutoComplete}
          error={findMutationError(errors, "password")}
          label="Password"
          name="password"
          type="password"
        />
        <AuthSubmitButton disabled={isSubmitting}>{submitLabel}</AuthSubmitButton>
      </form>
    </AuthFormShell>
  );
}
