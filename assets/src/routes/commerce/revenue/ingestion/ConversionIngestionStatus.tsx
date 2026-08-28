import { useEffect, useRef, useState, type ReactNode } from "react";
import { create, props } from "@stylexjs/stylex";
import { graphql, useRefetchableFragment } from "react-relay";
import { useRevalidator } from "react-router-dom";
import type { ConversionIngestionStatus_query$key } from "$generated/ConversionIngestionStatus_query.graphql";
import type { ConversionIngestionStatus_query$data } from "$generated/ConversionIngestionStatus_query.graphql";
import type { ConversionIngestionStatusRefetchQuery } from "$generated/ConversionIngestionStatusRefetchQuery.graphql";
import { formatProductDateTimeLabel } from "$frontend/formatting";
import { StatusBadge, type StatusTone } from "$ui/components/status/StatusBadge";
import { tokens } from "$ui/theme/tokens.stylex";
import { formatIngestionFreshness } from "./conversion-ingestion-data";

const conversionIngestionStatusQuery = graphql`
  fragment ConversionIngestionStatus_query on RootQueryType
  @refetchable(queryName: "ConversionIngestionStatusRefetchQuery") {
    cjCommissionIngestion {
      settings {
        nextRunAt
      }
      credentials {
        apiTokenConfigured
        accountIdConfigured
        ready
      }
      activity {
        state
        scheduledAt
        attemptedAt
      }
      latestSuccess {
        finishedAt
      }
      latestFailure {
        finishedAt
      }
    }
  }
`;

const styles = create({
  band: {
    borderBlockColor: tokens.borderQuiet,
    borderBlockStyle: "solid",
    borderBlockWidth: "1px",
    display: "grid",
    gap: "0.75rem 1.25rem",
    gridTemplateColumns: {
      default: "repeat(4, minmax(0, 1fr))",
      "@media (max-width: 52rem)": "repeat(2, minmax(0, 1fr))",
    },
    paddingBlock: "1rem",
  },
  item: { display: "grid", gap: "0.3rem", minWidth: 0 },
  label: {
    color: tokens.textSecondary,
    fontFamily: tokens.fontMono,
    fontSize: "0.7rem",
    fontWeight: 700,
    letterSpacing: "0.06em",
    margin: 0,
    textTransform: "uppercase",
  },
  value: { fontSize: "0.9rem", fontWeight: 650, margin: 0, overflowWrap: "anywhere" },
  detail: { color: tokens.textSecondary, fontSize: "0.8rem", margin: 0 },
});

export function ConversionIngestionStatus({
  query,
}: {
  query: ConversionIngestionStatus_query$key;
}) {
  const [{ cjCommissionIngestion }, refetch] = useRefetchableFragment<
    ConversionIngestionStatusRefetchQuery,
    ConversionIngestionStatus_query$key
  >(conversionIngestionStatusQuery, query);
  const { revalidate } = useRevalidator();
  const [isVisible, setIsVisible] = useState(
    () => typeof document === "undefined" || document.visibilityState === "visible",
  );
  const refetchRef = useRef(refetch);
  const revalidateRef = useRef(revalidate);
  const wasActiveRef = useRef(false);
  const activityState = cjCommissionIngestion.activity?.state ?? null;
  const activityIsActive = activityState === "SCHEDULED" || activityState === "EXECUTING";

  refetchRef.current = refetch;
  revalidateRef.current = revalidate;

  useEffect(() => {
    if (typeof document === "undefined") return;

    const updateVisibility = () => setIsVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  useEffect(() => {
    if (!activityIsActive || !isVisible) return;

    const timer = window.setInterval(() => {
      refetchRef.current({}, { fetchPolicy: "network-only" });
    }, 10_000);

    return () => window.clearInterval(timer);
  }, [activityIsActive, activityState, isVisible]);

  useEffect(() => {
    if (wasActiveRef.current && !activityIsActive) {
      revalidateRef.current();
    }
    wasActiveRef.current = activityIsActive;
  }, [activityIsActive, activityState]);

  const credentialsLabel = cjCommissionIngestion.credentials.ready
    ? "Credentials configured"
    : "Credentials missing";
  const nextRunAt = cjCommissionIngestion.settings.nextRunAt;
  const latestSuccess = cjCommissionIngestion.latestSuccess?.finishedAt;

  return (
    <section aria-label="Ingestion status" {...props(styles.band)}>
      <StatusItem
        label="Activity"
        value={
          <StatusBadge tone={activityTone(activityState)}>
            {activityLabel(activityState)}
          </StatusBadge>
        }
      />
      <StatusItem
        detail={credentialDetail(cjCommissionIngestion.credentials)}
        label="Credentials"
        value={credentialsLabel}
      />
      <StatusItem
        detail={latestSuccess ? formatIngestionFreshness(latestSuccess) : undefined}
        label="Freshness"
        value={
          latestSuccess ? (
            <time dateTime={latestSuccess}>{formatProductDateTimeLabel(latestSuccess)}</time>
          ) : (
            "No successful run"
          )
        }
      />
      <StatusItem
        detail={nextRunAt ? undefined : "Enable the schedule after credentials are configured."}
        label="Next run"
        value={
          nextRunAt ? (
            <time dateTime={nextRunAt}>{formatProductDateTimeLabel(nextRunAt)}</time>
          ) : (
            "Not scheduled"
          )
        }
      />
    </section>
  );
}

function StatusItem({
  detail,
  label,
  value,
}: {
  detail?: string;
  label: string;
  value: ReactNode;
}) {
  return (
    <div {...props(styles.item)}>
      <p {...props(styles.label)}>{label}</p>
      <div {...props(styles.value)}>{value}</div>
      {detail ? <p {...props(styles.detail)}>{detail}</p> : null}
    </div>
  );
}

function activityLabel(
  state: ConversionIngestionStatus_query$data["cjCommissionIngestion"]["activity"] extends infer Activity
    ? Activity extends { readonly state: infer State }
      ? State
      : null
    : null,
) {
  if (state === "EXECUTING") return "Running";
  if (state === "SCHEDULED") return "Queued";
  if (state === "RETRYABLE") return "Retryable";
  if (state === "SUSPENDED") return "Suspended";
  return "Available";
}

function activityTone(
  state: ConversionIngestionStatus_query$data["cjCommissionIngestion"]["activity"] extends infer Activity
    ? Activity extends { readonly state: infer State }
      ? State
      : null
    : null,
): StatusTone {
  if (state === "EXECUTING") return "accent";
  if (state === "SCHEDULED" || state === "RETRYABLE") return "warning";
  if (state === "SUSPENDED") return "neutral";
  return "positive";
}

function credentialDetail(
  credentials: ConversionIngestionStatus_query$data["cjCommissionIngestion"]["credentials"],
) {
  if (credentials.accountIdConfigured && credentials.apiTokenConfigured) {
    return "Account ID and API token are configured.";
  }

  if (!credentials.accountIdConfigured && !credentials.apiTokenConfigured) {
    return "Account ID and API token are both missing.";
  }

  return credentials.accountIdConfigured ? "API token is missing." : "Account ID is missing.";
}
