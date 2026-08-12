import { useId, type ComponentProps, type PropsWithChildren, type ReactElement } from "react";
import { useRender } from "@base-ui/react";
import { create, props } from "@stylexjs/stylex";
import { Link } from "react-router-dom";
import { selectGlobalMutationErrors, type MutationError } from "./errors";
import { Button } from "$ui/primitives/Button";
import { Label } from "$ui/primitives/Label";
import { Input } from "$ui/primitives/Input";
import { tokens } from "$ui/theme/tokens.stylex";

const styles = create({
  section: {
    alignItems: "center",
    display: "grid",
    gap: "clamp(1.5rem, 5vw, 4rem)",
    gridTemplateColumns: {
      default: "minmax(0, 0.8fr) minmax(20rem, 1fr)",
      "@media (max-width: 52rem)": "minmax(0, 1fr)",
    },
    marginInline: "auto",
    maxWidth: "64rem",
    paddingBlock: "3rem",
    paddingInline: "1.5rem",
  },
  context: {
    borderBlockStartColor: tokens.actionAccent,
    borderBlockStartStyle: "solid",
    borderBlockStartWidth: "3px",
    display: "grid",
    gap: "0.75rem",
    paddingBlockStart: "1.25rem",
  },
  contextEyebrow: {
    color: tokens.textSecondary,
    fontSize: "0.78rem",
    fontWeight: 750,
    letterSpacing: "0.08em",
    margin: 0,
    textTransform: "uppercase",
  },
  contextTitle: {
    fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
    letterSpacing: "-0.04em",
    lineHeight: 1.05,
    margin: 0,
  },
  contextCopy: {
    color: tokens.textSecondary,
    lineHeight: 1.65,
    margin: 0,
    maxWidth: "34rem",
  },
  panel: {
    backgroundColor: tokens.surfaceRaised,
    borderColor: tokens.border,
    borderRadius: "1rem",
    borderStyle: "solid",
    borderWidth: "1px",
    display: "grid",
    gap: "1rem",
    padding: "clamp(1.25rem, 4vw, 2rem)",
    boxShadow: "0 1rem 3rem color-mix(in srgb, var(--pc-text-primary) 8%, transparent)",
  },
  headingGroup: {
    display: "grid",
    gap: "0.5rem",
  },
  title: {
    fontSize: "2rem",
    lineHeight: 1.1,
    margin: 0,
  },
  copy: {
    color: "color-mix(in srgb, var(--pc-text) 78%, white)",
    margin: 0,
  },
  form: {
    display: "grid",
    gap: "1rem",
  },
  field: {
    display: "grid",
    gap: "0.4rem",
  },
  errorList: {
    margin: 0,
    paddingInlineStart: "1.1rem",
  },
  footer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.75rem 1rem",
  },
  link: {
    color: "inherit",
    fontWeight: 600,
    textDecoration: "underline",
  },
  submit: {
    justifyContent: "center",
    width: "100%",
  },
});

const EMPTY_ERRORS: MutationError[] = [];
const EMPTY_FIELD_NAMES: string[] = [];
const EMPTY_FOOTER_LINKS: FooterLink[] = [];

interface FooterLink {
  label: string;
  to: string;
}

interface AuthFormShellProps extends PropsWithChildren {
  description: string;
  errors?: MutationError[];
  footerLinks?: FooterLink[];
  fieldNames?: string[];
  successMessage?: string | null;
  title: string;
}

export function AuthFormShell({
  children,
  description,
  errors = EMPTY_ERRORS,
  footerLinks = EMPTY_FOOTER_LINKS,
  fieldNames = EMPTY_FIELD_NAMES,
  successMessage,
  title,
}: AuthFormShellProps) {
  const titleId = useId();
  const visibleErrors = selectGlobalMutationErrors(errors, fieldNames);

  return (
    <section aria-labelledby={titleId} {...props(styles.section)}>
      <aside aria-label="Account context" {...props(styles.context)}>
        <p {...props(styles.contextEyebrow)}>Product Compare account</p>
        <p {...props(styles.contextTitle)}>Keep your shopping decisions connected.</p>
        <p {...props(styles.contextCopy)}>
          Save comparisons, return to product research, and manage connected tools from one secure
          account.
        </p>
      </aside>
      <div {...props(styles.panel)}>
        <header {...props(styles.headingGroup)}>
          <h1 id={titleId} {...props(styles.title)}>
            {title}
          </h1>
          <p {...props(styles.copy)}>{description}</p>
        </header>

        <FormGlobalErrors errors={visibleErrors} />

        {successMessage ? (
          <div
            aria-live="polite"
            data-feedback-kind="success"
            data-slot="feedback-state"
            role="status"
          >
            {successMessage}
          </div>
        ) : null}

        {useRender({
          props: props(styles.form),
          render: children as ReactElement,
        })}

        <AuthFooterLinks footerLinks={footerLinks} />
      </div>
    </section>
  );
}

function FormGlobalErrors({ errors }: { errors: MutationError[] }) {
  if (errors.length === 0) {
    return null;
  }

  return (
    <div aria-live="assertive" data-feedback-kind="error" data-slot="feedback-state" role="alert">
      <ul {...props(styles.errorList)}>
        {errors.map((error) => (
          <li key={`${error.code}-${error.field ?? "global"}-${error.message}`}>{error.message}</li>
        ))}
      </ul>
    </div>
  );
}

function AuthFooterLinks({ footerLinks }: { footerLinks: FooterLink[] }) {
  if (footerLinks.length === 0) {
    return null;
  }

  return (
    <footer {...props(styles.footer)}>
      {footerLinks.map((link) => (
        <Button
          key={link.to}
          render={<Link to={link.to} />}
          variant="ghost"
          {...props(styles.link)}
        >
          {link.label}
        </Button>
      ))}
    </footer>
  );
}

export function AuthField({
  autoComplete,
  error,
  label,
  name,
  required = true,
  type = "text",
}: {
  autoComplete?: string;
  error?: string | null;
  label: string;
  name: string;
  required?: boolean;
  type?: ComponentProps<typeof Input>["type"];
}) {
  const errorId = error ? `${name}-error` : undefined;

  return (
    <div {...props(styles.field)}>
      <Label htmlFor={name}>{label}</Label>
      <Input
        autoComplete={autoComplete}
        aria-describedby={errorId}
        aria-invalid={error ? true : undefined}
        id={name}
        name={name}
        required={required}
        type={type}
      />
      {error ? (
        <span id={errorId} {...props(styles.copy)} aria-live="polite">
          {error}
        </span>
      ) : null}
    </div>
  );
}

export function AuthSubmitButton({
  children,
  disabled,
}: PropsWithChildren<{ disabled?: boolean }>) {
  return (
    <Button {...props(styles.submit)} disabled={disabled} size="lg" type="submit">
      {children}
    </Button>
  );
}
