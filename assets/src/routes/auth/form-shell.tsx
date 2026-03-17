import type { PropsWithChildren } from "react";
import * as stylex from "@stylexjs/stylex";
import { Link } from "react-router-dom";
import type { MutationError } from "./actions";
import { tokens } from "../../ui/theme/tokens.stylex";

const styles = stylex.create({
  section: {
    marginInline: "auto",
    maxWidth: "32rem",
    paddingBlock: "3rem",
    paddingInline: "1.5rem"
  },
  panel: {
    borderColor: tokens.border,
    borderRadius: "1rem",
    borderStyle: "solid",
    borderWidth: "1px",
    display: "grid",
    gap: "1rem",
    padding: "1.5rem"
  },
  headingGroup: {
    display: "grid",
    gap: "0.5rem"
  },
  title: {
    fontSize: "2rem",
    lineHeight: 1.1,
    margin: 0
  },
  copy: {
    color: "color-mix(in srgb, var(--pc-text) 78%, white)",
    margin: 0
  },
  form: {
    display: "grid",
    gap: "1rem"
  },
  field: {
    display: "grid",
    gap: "0.4rem"
  },
  input: {
    borderColor: tokens.border,
    borderRadius: "0.75rem",
    borderStyle: "solid",
    borderWidth: "1px",
    font: "inherit",
    paddingBlock: "0.75rem",
    paddingInline: "0.875rem"
  },
  button: {
    backgroundColor: tokens.text,
    borderRadius: "999px",
    borderStyle: "none",
    color: tokens.surface,
    cursor: "pointer",
    font: "inherit",
    fontWeight: 600,
    paddingBlock: "0.85rem",
    paddingInline: "1.25rem"
  },
  buttonDisabled: {
    cursor: "progress",
    opacity: 0.7
  },
  errorList: {
    borderColor: "#f3c2c2",
    borderRadius: "0.75rem",
    borderStyle: "solid",
    borderWidth: "1px",
    color: "#7d1f1f",
    margin: 0,
    paddingBlock: "0.75rem",
    paddingInline: "1rem"
  },
  footer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.75rem 1rem"
  },
  link: {
    color: "inherit",
    fontWeight: 600,
    textDecoration: "underline"
  },
  success: {
    borderColor: "#c5e7cb",
    borderRadius: "0.75rem",
    borderStyle: "solid",
    borderWidth: "1px",
    color: "#1f5d2e",
    margin: 0,
    paddingBlock: "0.75rem",
    paddingInline: "1rem"
  }
});

interface AuthFormShellProps extends PropsWithChildren {
  description: string;
  errors?: MutationError[];
  footerLinks?: Array<{ label: string; to: string }>;
  fieldNames?: string[];
  successMessage?: string | null;
  title: string;
}

export function AuthFormShell({
  children,
  description,
  errors = [],
  footerLinks = [],
  fieldNames = [],
  successMessage,
  title
}: AuthFormShellProps) {
  const visibleErrors = errors.filter((error) => !error.field || !fieldNames.includes(error.field));

  return (
    <section {...stylex.props(styles.section)}>
      <div {...stylex.props(styles.panel)}>
        <header {...stylex.props(styles.headingGroup)}>
          <h1 {...stylex.props(styles.title)}>{title}</h1>
          <p {...stylex.props(styles.copy)}>{description}</p>
        </header>

        {visibleErrors.length > 0 ? (
          <ul {...stylex.props(styles.errorList)} aria-live="polite">
            {visibleErrors.map((error) => (
              <li key={`${error.code}-${error.field ?? "global"}-${error.message}`}>
                {error.message}
              </li>
            ))}
          </ul>
        ) : null}

        {successMessage ? (
          <p {...stylex.props(styles.success)} aria-live="polite">
            {successMessage}
          </p>
        ) : null}

        <div {...stylex.props(styles.form)}>{children}</div>

        {footerLinks.length > 0 ? (
          <footer {...stylex.props(styles.footer)}>
            {footerLinks.map((link) => (
              <Link key={link.to} to={link.to} {...stylex.props(styles.link)}>
                {link.label}
              </Link>
            ))}
          </footer>
        ) : null}
      </div>
    </section>
  );
}

export function AuthField({
  autoComplete,
  error,
  label,
  name,
  required = true,
  type = "text"
}: {
  autoComplete?: string;
  error?: string | null;
  label: string;
  name: string;
  required?: boolean;
  type?: string;
}) {
  const errorId = error ? `${name}-error` : undefined;

  return (
    <label {...stylex.props(styles.field)}>
      <span>{label}</span>
      <input
        {...stylex.props(styles.input)}
        autoComplete={autoComplete}
        aria-describedby={errorId}
        aria-invalid={error ? true : undefined}
        id={name}
        name={name}
        required={required}
        type={type}
      />
      {error ? (
        <span id={errorId} {...stylex.props(styles.copy)} aria-live="polite">
          {error}
        </span>
      ) : null}
    </label>
  );
}

export function AuthSubmitButton({
  children,
  disabled
}: PropsWithChildren<{ disabled?: boolean }>) {
  return (
    <button
      {...stylex.props(styles.button, disabled && styles.buttonDisabled)}
      disabled={disabled}
      type="submit"
    >
      {children}
    </button>
  );
}
