import { useEffect, useRef, type ReactNode } from "react";
import { create, props } from "@stylexjs/stylex";
import { graphql, useRefetchableFragment } from "react-relay";
import type { ConversionIngestionStatus_query$key } from "$generated/ConversionIngestionStatus_query.graphql";
import type {
  CJCommissionIngestionActivityState,
  ConversionIngestionStatus_query$data,
} from "$generated/ConversionIngestionStatus_query.graphql";
import type { ConversionIngestionStatusRefetchQuery } from "$generated/ConversionIngestionStatusRefetchQuery.graphql";
import { formatProductDateTimeLabel } from "$frontend/formatting";
import { StatusBadge, type StatusTone } from "$ui/components/status/StatusBadge";
import { tokens } from "$ui/theme/tokens.stylex";
import { formatIngestionFreshness } from "./conversion-ingestion-data";

export const conversionIngestionStatusQuery = graphql`
  fragment ConversionIngestionStatus_query on RootQueryType
  @refetchable(queryName: "ConversionIngestionStatusRefetchQuery") {
    cjCommissionIngestion {
      ...ConversionIngestionSettings_ingestion
      settings {
        nextRunAt
      }
      credentials {
        apiTokenConfigured
        publisherIdsConfigured
        ready
      }
      activity {
        state
        windowStart
        windowEnd
        scheduledAt
        attemptedAt
      }
      latestSuccess {
        finishedAt
      }
      latestFailure {
        finishedAt
        errorSummary
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
  wideItem: { gridColumn: "1 / -1" },
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

export function useConversionIngestionStatus(query: ConversionIngestionStatus_query$key) {
  return useRefetchableFragment<
    ConversionIngestionStatusRefetchQuery,
    ConversionIngestionStatus_query$key
  >(conversionIngestionStatusQuery, query);
}

export function ConversionIngestionStatus({
  ingestion,
  isVisible,
  onOverviewRefresh,
  onTerminal,
}: {
  ingestion: ConversionIngestionStatus_query$data["cjCommissionIngestion"];
  isVisible: boolean;
  onOverviewRefresh: () => void;
  onTerminal: () => void;
}) {
  const activityState = ingestion.activity?.state ?? null;
  const activityIsPresent = Boolean(ingestion.activity);
  const onOverviewRefreshRef = useRef(onOverviewRefresh);
  const onTerminalRef = useRef(onTerminal);
  const hadActivityRef = useRef(false);

  onOverviewRefreshRef.current = onOverviewRefresh;
  onTerminalRef.current = onTerminal;

  useEffect(() => {
    if (!activityIsPresent || !isVisible) return;

    const timer = window.setInterval(() => {
      onOverviewRefreshRef.current();
    }, 10_000);

    return () => window.clearInterval(timer);
  }, [activityIsPresent, isVisible]);

  useEffect(() => {
    if (hadActivityRef.current && !activityIsPresent) {
      onTerminalRef.current();
    }
    hadActivityRef.current = activityIsPresent;
  }, [activityIsPresent]);

  const credentialsLabel = ingestion.credentials.ready
    ? "Credentials configured"
    : "Credentials missing";
  const nextRunAt = ingestion.settings.nextRunAt;
  const latestSuccess = ingestion.latestSuccess?.finishedAt;
  const latestFailure = ingestion.latestFailure;

  return (
    <section aria-label="Ingestion status" {...props(styles.band)}>
      <StatusItem
        detail={<ActivityTiming activity={ingestion.activity} />}
        label="Activity"
        value={
          <StatusBadge tone={activityTone(activityState)}>
            {activityLabel(activityState)}
          </StatusBadge>
        }
      />
      <StatusItem
        detail={credentialDetail(ingestion.credentials)}
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
        detail={nextRunDetail(ingestion)}
        label="Next run"
        value={
          nextRunAt ? (
            <time dateTime={nextRunAt}>{formatProductDateTimeLabel(nextRunAt)}</time>
          ) : (
            "Not scheduled"
          )
        }
      />
      {latestFailure ? (
        <StatusItem
          detail={latestFailure.errorSummary ?? "Failure recorded without a safe provider summary."}
          label="Latest failure"
          value={
            latestFailure.finishedAt ? (
              <time dateTime={latestFailure.finishedAt}>
                {formatProductDateTimeLabel(latestFailure.finishedAt)}
              </time>
            ) : (
              "Failure in progress"
            )
          }
          wide
        />
      ) : null}
    </section>
  );
}

function ActivityTiming({
  activity,
}: {
  activity: ConversionIngestionStatus_query$data["cjCommissionIngestion"]["activity"];
}) {
  if (!activity) return "No run is currently scheduled or running.";

  const timing = activity.attemptedAt ?? activity.scheduledAt;
  if (!activity.windowStart || !activity.windowEnd) {
    return timing ? (
      <>
        {activity.attemptedAt ? "Started " : "Scheduled "}
        <time dateTime={timing}>{formatProductDateTimeLabel(timing)}</time>
      </>
    ) : (
      "Timing is not available."
    );
  }

  return (
    <>
      {timing ? (
        <>
          {activity.attemptedAt ? "Started " : "Scheduled "}
          <time dateTime={timing}>{formatProductDateTimeLabel(timing)}</time> ·{" "}
        </>
      ) : null}
      Window{" "}
      <time dateTime={activity.windowStart}>
        {formatProductDateTimeLabel(activity.windowStart)}
      </time>
      {" – "}
      <time dateTime={activity.windowEnd}>{formatProductDateTimeLabel(activity.windowEnd)}</time>
    </>
  );
}

function StatusItem({
  detail,
  label,
  value,
  wide = false,
}: {
  detail?: ReactNode;
  label: string;
  value: ReactNode;
  wide?: boolean;
}) {
  return (
    <div {...props(styles.item, wide ? styles.wideItem : null)}>
      <p {...props(styles.label)}>{label}</p>
      <div {...props(styles.value)}>{value}</div>
      {detail ? <p {...props(styles.detail)}>{detail}</p> : null}
    </div>
  );
}

function activityLabel(state: CJCommissionIngestionActivityState | null) {
  if (state === null) return "Available";
  if (state === "EXECUTING") return "Running";
  if (state === "AVAILABLE" || state === "SCHEDULED") return "Queued";
  if (state === "RETRYABLE") return "Retrying";
  if (state === "SUSPENDED") return "Suspended";
  return "In progress";
}

function activityTone(state: CJCommissionIngestionActivityState | null): StatusTone {
  if (state === null) return "positive";
  if (state === "EXECUTING") return "accent";
  if (state === "AVAILABLE" || state === "SCHEDULED" || state === "RETRYABLE") {
    return "warning";
  }
  if (state === "SUSPENDED") return "neutral";
  return "neutral";
}

function credentialDetail(
  credentials: ConversionIngestionStatus_query$data["cjCommissionIngestion"]["credentials"],
) {
  if (credentials.publisherIdsConfigured && credentials.apiTokenConfigured) {
    return "Publisher IDs and API token are configured.";
  }

  if (!credentials.publisherIdsConfigured && !credentials.apiTokenConfigured) {
    return "Publisher IDs and API token are both missing.";
  }

  return credentials.publisherIdsConfigured
    ? "API token is missing."
    : "Publisher IDs are missing.";
}

function nextRunDetail(ingestion: ConversionIngestionStatus_query$data["cjCommissionIngestion"]) {
  if (ingestion.settings.nextRunAt) return undefined;
  if (!ingestion.credentials.ready) return "Enable the schedule after credentials are configured.";
  if (!ingestion.latestSuccess) {
    return "A successful CJ run is required before scheduled ingestion can be enabled.";
  }
  return "Enable scheduled ingestion to create the next run.";
}
