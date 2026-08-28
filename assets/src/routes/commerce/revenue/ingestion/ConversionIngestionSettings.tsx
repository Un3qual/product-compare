import { useEffect, useState, type FormEvent } from "react";
import { create, props } from "@stylexjs/stylex";
import { graphql, useFragment, useMutation } from "react-relay";
import type { ConversionIngestionSettings_ingestion$key } from "$generated/ConversionIngestionSettings_ingestion.graphql";
import type { RunCJCommissionIngestionNowMutation } from "$generated/RunCJCommissionIngestionNowMutation.graphql";
import type { UpdateCJCommissionIngestionSettingsMutation } from "$generated/UpdateCJCommissionIngestionSettingsMutation.graphql";
import { commitRouteMutationPromise } from "$relay/mutations";
import { DEFAULT_MUTATION_ERROR_MESSAGE } from "$relay/mutation-errors";
import { Button } from "$ui/primitives/Button";
import { Checkbox } from "$ui/primitives/Checkbox";
import { Input } from "$ui/primitives/Input";
import { tokens } from "$ui/theme/tokens.stylex";
import {
  runCJCommissionIngestionNowMutation,
  updateCJCommissionIngestionSettingsMutation,
} from "./ConversionIngestionOperations";
import {
  SettingsValidationError,
  buildSettingsVariables,
  resolveIngestionMutationOutcome,
} from "./conversion-ingestion-data";

const settingsFragment = graphql`
  fragment ConversionIngestionSettings_ingestion on CJCommissionIngestion {
    settings {
      enabled
      intervalMinutes
      lookbackDays
      maxPages
      updatedAt
    }
    credentials {
      ready
    }
  }
`;

const styles = create({
  surface: {
    borderColor: tokens.borderQuiet,
    borderRadius: "var(--pc-radius-large)",
    borderStyle: "solid",
    borderWidth: "1px",
    display: "grid",
    gap: "1rem",
    padding: "1rem",
  },
  header: { display: "grid", gap: "0.25rem" },
  title: { fontSize: "1rem", margin: 0 },
  description: { color: tokens.textSecondary, fontSize: "0.85rem", margin: 0 },
  fields: {
    display: "grid",
    gap: "0.9rem",
    gridTemplateColumns: {
      default: "repeat(3, minmax(0, 1fr))",
      "@media (max-width: 44rem)": "1fr",
    },
  },
  field: { display: "grid", gap: "0.35rem" },
  label: { fontSize: "0.85rem", fontWeight: 650 },
  hint: { color: tokens.textSecondary, fontSize: "0.75rem", margin: 0 },
  toggle: { alignItems: "center", display: "flex", gap: "0.5rem", minHeight: tokens.controlHeight },
  actions: { alignItems: "center", display: "flex", flexWrap: "wrap", gap: "0.75rem" },
  error: { color: "var(--pc-danger)", fontSize: "0.85rem", margin: 0 },
  success: { color: tokens.freshnessGreen, fontSize: "0.85rem", margin: 0 },
});

export function ConversionIngestionSettings({
  ingestion,
  onRefresh,
}: {
  ingestion: ConversionIngestionSettings_ingestion$key;
  onRefresh: () => void;
}) {
  const data = useFragment(settingsFragment, ingestion);
  const [commitUpdate] = useMutation<UpdateCJCommissionIngestionSettingsMutation>(
    updateCJCommissionIngestionSettingsMutation,
  );
  const [error, setError] = useState<string | null>(null);
  const [focusField, setFocusField] = useState<
    "intervalMinutes" | "lookbackDays" | "maxPages" | null
  >(null);
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!focusField || pending) return;

    focusSetting(focusField);
    setFocusField(null);
  }, [focusField, pending]);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    let variables: UpdateCJCommissionIngestionSettingsMutation["variables"];
    try {
      variables = buildSettingsVariables(new FormData(event.currentTarget));
    } catch (reason) {
      if (reason instanceof SettingsValidationError) {
        setError(reason.message);
        setFocusField(reason.field);
      } else {
        setError(DEFAULT_MUTATION_ERROR_MESSAGE);
      }
      return;
    }

    setPending(true);
    try {
      const { graphQLErrors, response } = await commitRouteMutationPromise(commitUpdate, {
        variables,
      });
      const outcome = resolveIngestionMutationOutcome(
        response.updateCjCommissionIngestionSettings,
        graphQLErrors,
      );

      if (outcome.kind === "error") {
        setError(outcome.message);
        if (
          outcome.field === "intervalMinutes" ||
          outcome.field === "lookbackDays" ||
          outcome.field === "maxPages"
        ) {
          setFocusField(outcome.field);
        }
        return;
      }

      setSuccess("Settings saved.");
      onRefresh();
    } catch {
      setError(DEFAULT_MUTATION_ERROR_MESSAGE);
    } finally {
      setPending(false);
    }
  };

  return (
    <form
      aria-label="Ingestion settings"
      key={data.settings.updatedAt}
      onSubmit={submit}
      {...props(styles.surface)}
    >
      <header {...props(styles.header)}>
        <h2 {...props(styles.title)}>Schedule settings</h2>
        <p {...props(styles.description)}>
          Keep imports bounded; changes apply to the next eligible run.
        </p>
      </header>
      <label {...props(styles.toggle)}>
        <Checkbox defaultChecked={data.settings.enabled} disabled={pending} name="enabled" />
        <span>Enable scheduled ingestion</span>
      </label>
      {!data.credentials.ready ? (
        <p role="status" {...props(styles.hint)}>
          Credentials must be configured before this schedule can run.
        </p>
      ) : null}
      <div {...props(styles.fields)}>
        <NumberField
          label="Interval minutes"
          maximum={10_080}
          minimum={15}
          name="intervalMinutes"
          pending={pending}
          value={data.settings.intervalMinutes}
        />
        <NumberField
          label="Lookback days"
          maximum={90}
          minimum={1}
          name="lookbackDays"
          pending={pending}
          value={data.settings.lookbackDays}
        />
        <NumberField
          label="Maximum pages"
          maximum={100}
          minimum={1}
          name="maxPages"
          pending={pending}
          value={data.settings.maxPages}
        />
      </div>
      <div {...props(styles.actions)}>
        <Button disabled={pending} type="submit">
          {pending ? "Saving…" : "Save settings"}
        </Button>
        {error ? (
          <p role="alert" {...props(styles.error)}>
            {error}
          </p>
        ) : null}
        {success ? (
          <p role="status" {...props(styles.success)}>
            {success}
          </p>
        ) : null}
      </div>
    </form>
  );
}

export function RunNowControl({
  ingestion,
  onRefresh,
}: {
  ingestion: ConversionIngestionSettings_ingestion$key;
  onRefresh: () => void;
}) {
  const data = useFragment(settingsFragment, ingestion);
  const [commitRunNow] = useMutation<RunCJCommissionIngestionNowMutation>(
    runCJCommissionIngestionNowMutation,
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const unavailable = !data.credentials.ready;

  const runNow = async () => {
    setError(null);
    setPending(true);
    try {
      const { graphQLErrors, response } = await commitRouteMutationPromise(commitRunNow, {
        variables: {},
      });
      const outcome = resolveIngestionMutationOutcome(
        response.runCjCommissionIngestionNow,
        graphQLErrors,
      );
      if (outcome.kind === "error") {
        setError(outcome.message);
        return;
      }
      onRefresh();
    } catch {
      setError(DEFAULT_MUTATION_ERROR_MESSAGE);
    } finally {
      setPending(false);
    }
  };

  return (
    <div>
      <Button
        aria-describedby={unavailable ? "run-now-credentials" : undefined}
        disabled={pending || unavailable}
        onClick={runNow}
      >
        {pending ? "Queuing…" : "Run now"}
      </Button>
      {unavailable ? (
        <p id="run-now-credentials" {...props(styles.hint)}>
          Credentials are required to run an import.
        </p>
      ) : null}
      {error ? (
        <p role="alert" {...props(styles.error)}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function NumberField({
  label,
  maximum,
  minimum,
  name,
  pending,
  value,
}: {
  label: string;
  maximum: number;
  minimum: number;
  name: "intervalMinutes" | "lookbackDays" | "maxPages";
  pending: boolean;
  value: number;
}) {
  const id = `${name}-input`;
  return (
    <div {...props(styles.field)}>
      <label htmlFor={id} {...props(styles.label)}>
        {label}
      </label>
      <Input
        defaultValue={value}
        disabled={pending}
        id={id}
        inputMode="numeric"
        max={maximum}
        min={minimum}
        name={name}
        step={1}
        type="number"
      />
      <p {...props(styles.hint)}>
        {minimum}–{maximum}
      </p>
    </div>
  );
}

function focusSetting(field: "intervalMinutes" | "lookbackDays" | "maxPages") {
  document.getElementById(`${field}-input`)?.focus();
}
