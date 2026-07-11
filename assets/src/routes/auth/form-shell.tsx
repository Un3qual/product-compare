import { useId, useMemo, type ComponentProps, type PropsWithChildren } from "react";
import { Callout } from "@radix-ui/themes";
import { create, props } from "@stylexjs/stylex";
import { Link } from "react-router-dom";
import type { MutationError } from "./errors";
import { Button } from "../../ui/primitives/button";
import { Label } from "../../ui/primitives/label";
import { Slot } from "../../ui/primitives/slot";
import { TextField } from "../../ui/primitives/text-field";
import { tokens } from "../../ui/theme/tokens.stylex";

const styles = create({
  section: {
    marginInline: "auto",
    maxWidth: "32rem",
    paddingBlock: "3rem",
    paddingInline: "1.5rem"
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
    boxShadow: "0 1rem 3rem color-mix(in srgb, var(--gray-12) 8%, transparent)"
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
  errorList: {
    margin: 0,
    paddingInlineStart: "1.1rem"
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
  submit: {
    justifyContent: "center",
    width: "100%"
  }
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
  title
}: AuthFormShellProps) {
  const titleId = useId();
  const fieldNameSet = useMemo(() => new Set(fieldNames), [fieldNames]);
  const visibleErrors = errors.filter((error: MutationError) => {
    const field = error.field;

    return field === undefined || field === null || field === "" || !fieldNameSet.has(field);
  });

  return (
    <section aria-labelledby={titleId} {...props(styles.section)}>
      <div {...props(styles.panel)}>
        <header {...props(styles.headingGroup)}>
          <h1 id={titleId} {...props(styles.title)}>{title}</h1>
          <p {...props(styles.copy)}>{description}</p>
        </header>

        <FormGlobalErrors errors={visibleErrors} />

        {successMessage ? (
          <Callout.Root aria-live="polite" color="green" role="status" variant="surface">
            <Callout.Text>{successMessage}</Callout.Text>
          </Callout.Root>
        ) : null}

        <Slot {...props(styles.form)}>{children}</Slot>

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
    <Callout.Root aria-live="assertive" color="red" role="alert" variant="surface">
      <Callout.Text>
        <ul {...props(styles.errorList)}>
          {errors.map((error) => (
            <li key={`${error.code}-${error.field ?? "global"}-${error.message}`}>
              {error.message}
            </li>
          ))}
        </ul>
      </Callout.Text>
    </Callout.Root>
  );
}

function AuthFooterLinks({ footerLinks }: { footerLinks: FooterLink[] }) {
  if (footerLinks.length === 0) {
    return null;
  }

  return (
    <footer {...props(styles.footer)}>
      {footerLinks.map((link) => (
        <Button key={link.to} asChild variant="ghost" {...props(styles.link)}>
          <Link to={link.to}>{link.label}</Link>
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
  type = "text"
}: {
  autoComplete?: string;
  error?: string | null;
  label: string;
  name: string;
  required?: boolean;
  type?: ComponentProps<typeof TextField>["type"];
}) {
  const errorId = error ? `${name}-error` : undefined;

  return (
    <div {...props(styles.field)}>
      <Label htmlFor={name}>{label}</Label>
      <TextField
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
  disabled
}: PropsWithChildren<{ disabled?: boolean }>) {
  return (
    <Button
      {...props(styles.submit)}
      disabled={disabled}
      size="3"
      type="submit"
    >
      {children}
    </Button>
  );
}
