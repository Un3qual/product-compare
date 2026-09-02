import { Form } from "react-router";
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
  credentialAutoComplete: "current-password" | "new-password";
  submitLabel: string;
  title: string;
}

export function CredentialAuthForm({
  description,
  errors,
  footerLinks,
  isSubmitting,
  credentialAutoComplete,
  submitLabel,
  title,
}: CredentialAuthFormProps) {
  return (
    <AuthFormShell
      description={description}
      errors={errors}
      fieldNames={["email", "password"]}
      footerLinks={footerLinks}
      successMessage={null}
      title={title}
    >
      <Form method="post">
        <AuthField
          autoComplete="email"
          error={findMutationError(errors, "email")}
          label="Email"
          name="email"
          type="email"
        />
        <AuthField
          autoComplete={credentialAutoComplete}
          error={findMutationError(errors, "password")}
          label="Password"
          name="password"
          type="password"
        />
        <AuthSubmitButton disabled={isSubmitting}>{submitLabel}</AuthSubmitButton>
      </Form>
    </AuthFormShell>
  );
}
