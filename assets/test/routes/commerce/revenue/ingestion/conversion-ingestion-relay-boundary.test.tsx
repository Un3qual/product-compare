import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { RelayEnvironmentProvider } from "react-relay";
import { createOperationDescriptor, getRequest, type PayloadData } from "relay-runtime";
import { beforeEach, expect, test, vi } from "vitest";
import conversionIngestionRouteQueryArtifact, {
  type ConversionIngestionRouteQuery,
} from "../../../../../src/__generated__/ConversionIngestionRouteQuery.graphql";
import conversionIngestionStatusRefetchQueryArtifact, {
  type ConversionIngestionStatusRefetchQuery,
} from "../../../../../src/__generated__/ConversionIngestionStatusRefetchQuery.graphql";
import conversionSyncRunsQueryArtifact, {
  type ConversionSyncRunsQuery,
} from "../../../../../src/__generated__/ConversionSyncRunsQuery.graphql";
import { cacheRouteQueryData } from "../../../../../src/relay/route-preload";
import { createRelayEnvironment } from "../../../../../src/relay/environment";
import {
  ConversionIngestionRoute,
  type ConversionIngestionLoaderData,
} from "../../../../../src/routes/commerce/revenue/ingestion/ConversionIngestionRoute";

const { revalidateMock, useLoaderDataMock } = vi.hoisted(() => ({
  revalidateMock: vi.fn(),
  useLoaderDataMock: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");

  return {
    ...actual,
    useLoaderData: useLoaderDataMock,
    useRevalidator: () => ({ revalidate: revalidateMock }),
  };
});

beforeEach(() => {
  revalidateMock.mockReset();
  useLoaderDataMock.mockReset();
});

test("the network-only overview refetch normalizes persisted settings into the operator form", async () => {
  const environment = createRelayEnvironment();
  const overviewQuery = cacheRouteQueryData<ConversionIngestionRouteQuery>(
    environment,
    conversionIngestionRouteQueryArtifact,
    {},
    overviewResponse({
      enabled: true,
      intervalMinutes: 1440,
      lookbackDays: 7,
      maxPages: 25,
      updatedAt: "2026-08-26T10:20:00Z",
    }) as ConversionIngestionRouteQuery["response"],
  );
  const runsVariables: ConversionSyncRunsQuery["variables"] = { after: null, first: 25 };
  const runsQuery = cacheRouteQueryData<ConversionSyncRunsQuery>(
    environment,
    conversionSyncRunsQueryArtifact,
    runsVariables,
    {
      cjCommissionSyncRuns: { edges: [], pageInfo: { endCursor: null, hasNextPage: false } },
    } as unknown as ConversionSyncRunsQuery["response"],
  );
  useLoaderDataMock.mockReturnValue({
    overviewQuery,
    runsQuery: Promise.resolve(runsQuery),
    runsVariables,
    status: "ready",
  } satisfies ConversionIngestionLoaderData);

  render(
    <RelayEnvironmentProvider environment={environment}>
      <MemoryRouter>
        <ConversionIngestionRoute />
      </MemoryRouter>
    </RelayEnvironmentProvider>,
  );

  await screen.findByRole("form", { name: "Ingestion settings" });
  fireEvent.change(screen.getByLabelText("Interval minutes"), {
    target: { value: "999" },
  });
  expect(screen.getByLabelText("Interval minutes")).toHaveValue(999);

  act(() => {
    environment.commitPayload(
      createOperationDescriptor(
        getRequest(conversionIngestionStatusRefetchQueryArtifact),
        {} as ConversionIngestionStatusRefetchQuery["variables"],
      ),
      overviewResponse({
        enabled: false,
        intervalMinutes: 720,
        lookbackDays: 14,
        maxPages: 12,
        updatedAt: "2026-08-27T12:00:00Z",
      }),
    );
  });

  await waitFor(() => {
    expect(screen.getByRole("checkbox", { name: "Enable scheduled ingestion" })).not.toBeChecked();
    expect(screen.getByLabelText("Interval minutes")).toHaveValue(720);
    expect(screen.getByLabelText("Lookback days")).toHaveValue(14);
    expect(screen.getByLabelText("Maximum pages")).toHaveValue(12);
  });
  expect(revalidateMock).not.toHaveBeenCalled();
});

function overviewResponse(settings: {
  enabled: boolean;
  intervalMinutes: number;
  lookbackDays: number;
  maxPages: number;
  updatedAt: string;
}): PayloadData {
  return {
    cjCommissionIngestion: {
      activity: null,
      credentials: { publisherIdsConfigured: true, apiTokenConfigured: true, ready: true },
      latestFailure: null,
      latestSuccess: { finishedAt: "2026-08-26T10:15:00Z", id: "sync-run-success" },
      settings: { ...settings, nextRunAt: "2026-08-28T10:15:00Z" },
    },
  };
}
