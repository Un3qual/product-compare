import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRelayEnvironment } from "../../../src/relay/environment";
import {
  createRelayRouterContext,
  fetchRouteQuery,
  useRoutePreloadedQuery,
} from "../../../src/relay/route-preload";
import { MemoryRouter, useLoaderData } from "react-router-dom";
import { useLazyLoadQuery, useMutation, usePreloadedQuery } from "react-relay";
import {
  publishComparisonSnapshotMutation,
  revokeComparisonSnapshotMutation,
} from "../../../src/routes/compare/ComparisonSharingOperations";
import { ShareComparisonControl } from "../../../src/routes/compare/ShareComparisonControl";
import {
  SharedComparisonRoute,
  sharedComparisonLoader,
} from "../../../src/routes/compare/shared/SharedComparisonRoute";

const {
  fetchRouteQueryMock,
  publishMutationMock,
  revokeMutationMock,
  useLoaderDataMock,
  useLazyLoadQueryMock,
  useMutationMock,
  usePreloadedQueryMock,
  useRoutePreloadedQueryMock,
} = vi.hoisted(() => ({
  fetchRouteQueryMock: vi.fn(),
  publishMutationMock: vi.fn(),
  revokeMutationMock: vi.fn(),
  useLoaderDataMock: vi.fn(),
  useLazyLoadQueryMock: vi.fn(),
  useMutationMock: vi.fn(),
  usePreloadedQueryMock: vi.fn(),
  useRoutePreloadedQueryMock: vi.fn(),
}));

vi.mock("../../../src/relay/route-preload", async () => {
  const actual = await vi.importActual<typeof import("../../../src/relay/route-preload")>(
    "../../../src/relay/route-preload",
  );
  return {
    ...actual,
    fetchRouteQuery: fetchRouteQueryMock,
    useRoutePreloadedQuery: useRoutePreloadedQueryMock,
  };
});

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useLoaderData: useLoaderDataMock };
});

vi.mock("react-relay", async () => {
  const actual = await vi.importActual<typeof import("react-relay")>("react-relay");
  return {
    ...actual,
    useLazyLoadQuery: useLazyLoadQueryMock,
    useMutation: useMutationMock,
    usePreloadedQuery: usePreloadedQueryMock,
  };
});

const mockedFetchRouteQuery = vi.mocked(fetchRouteQuery);
const mockedUseLoaderData = vi.mocked(useLoaderData);
const mockedUseLazyLoadQuery = vi.mocked(useLazyLoadQuery);
const mockedUseMutation = vi.mocked(useMutation);
const mockedUsePreloadedQuery = vi.mocked(usePreloadedQuery);
const mockedUseRoutePreloadedQuery = vi.mocked(useRoutePreloadedQuery);

beforeEach(() => {
  fetchRouteQueryMock.mockReset();
  publishMutationMock.mockReset();
  revokeMutationMock.mockReset();
  useLoaderDataMock.mockReset();
  useLazyLoadQueryMock.mockReset();
  useMutationMock.mockReset();
  usePreloadedQueryMock.mockReset();
  useRoutePreloadedQueryMock.mockReset();
  mockedUseLazyLoadQuery.mockReturnValue({ viewer: null } as never);
  mockedUseMutation.mockImplementation((mutation) => {
    if (mutation === publishComparisonSnapshotMutation) {
      return [publishMutationMock, false] as never;
    }

    if (mutation === revokeComparisonSnapshotMutation) {
      return [revokeMutationMock, false] as never;
    }

    throw new Error("Unexpected comparison snapshot mutation");
  });
});

function confirmPublicLinkRevocation() {
  fireEvent.click(
    within(screen.getByRole("alertdialog", { name: "Revoke this public link?" })).getByRole(
      "button",
      { name: "Revoke public link" },
    ),
  );
}

test("ShareComparisonControl publishes the ordered products and selected profile", async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={["/compare?recommend=best_value"]}>
      <ShareComparisonControl
        products={[
          {
            id: "product-2",
            name: "Second",
            slug: "second",
            description: null,
            brandName: null,
            currentAttributes: [],
          },
          {
            id: "product-1",
            name: "First",
            slug: "first",
            description: null,
            brandName: null,
            currentAttributes: [],
          },
        ]}
      />
    </MemoryRouter>,
  );

  const disclosure = screen.getByRole("button", {
    name: "Share this comparison",
  });
  expect(disclosure).toHaveAttribute("data-slot", "collapsible-trigger");
  expect(disclosure).toHaveAttribute("aria-expanded", "false");
  expect(useLazyLoadQueryMock).not.toHaveBeenCalled();

  disclosure.focus();
  await user.keyboard("{Enter}");

  expect(disclosure).toHaveAttribute("aria-expanded", "true");
  expect(disclosure).toHaveFocus();
  expect(useLazyLoadQueryMock).toHaveBeenCalledTimes(1);
  fireEvent.change(screen.getByLabelText("Optional title"), { target: { value: "Travel kit" } });

  await user.keyboard(" ");

  expect(disclosure).toHaveAttribute("aria-expanded", "false");
  expect(screen.getByLabelText("Optional title")).not.toBeVisible();
  expect(screen.getByLabelText("Optional title")).toHaveValue("Travel kit");

  fireEvent.click(disclosure);

  expect(disclosure).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByLabelText("Optional title")).toBeVisible();
  expect(screen.getByLabelText("Optional title")).toHaveValue("Travel kit");
  fireEvent.click(screen.getByRole("checkbox", { name: /Allow search engines/ }));
  fireEvent.click(screen.getByRole("button", { name: "Publish comparison link" }));

  await waitFor(() => expect(publishMutationMock).toHaveBeenCalledTimes(1));
  expect(publishMutationMock).toHaveBeenCalledWith(
    expect.objectContaining({
      variables: {
        input: {
          productIds: ["product-2", "product-1"],
          recommendationProfile: "BEST_VALUE",
          searchIndexable: true,
          title: "Travel kit",
        },
      },
    }),
  );

  await act(() => {
    publishMutationMock.mock.calls[0]?.[0]?.onCompleted(
      {
        publishComparisonSnapshot: {
          snapshot: { id: "snapshot-1" },
          sharePath: "/compare/shared/public-token",
          errors: [],
        },
      },
      [],
    );
  });

  expect(await screen.findByRole("link", { name: "Travel kit" })).toHaveAttribute(
    "href",
    "/compare/shared/public-token",
  );
  expect(screen.getByRole("status")).toHaveTextContent("prices will remain unchanged");
});

test("ShareComparisonControl revokes the just-published public link", async () => {
  render(
    <MemoryRouter>
      <ShareComparisonControl
        products={[
          {
            id: "product-1",
            name: "First",
            slug: "first",
            description: null,
            brandName: null,
            currentAttributes: [],
          },
          {
            id: "product-2",
            name: "Second",
            slug: "second",
            description: null,
            brandName: null,
            currentAttributes: [],
          },
        ]}
      />
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByText("Share this comparison"));
  fireEvent.click(screen.getByRole("button", { name: "Publish comparison link" }));
  await waitFor(() => expect(publishMutationMock).toHaveBeenCalled());
  await act(() =>
    publishMutationMock.mock.calls[0]?.[0]?.onCompleted(
      {
        publishComparisonSnapshot: {
          snapshot: { id: "snapshot-1" },
          sharePath: "/compare/shared/token",
          errors: [],
        },
      },
      [],
    ),
  );
  const revokeTrigger = await screen.findByRole("button", {
    name: "Revoke public link: Open public comparison",
  });
  fireEvent.click(revokeTrigger);

  expect(revokeMutationMock).not.toHaveBeenCalled();
  const revokeDialog = screen.getByRole("alertdialog", { name: "Revoke this public link?" });
  expect(revokeDialog).toHaveTextContent(
    "Revoking the public link for Open public comparison will make the shared comparison unavailable.",
  );
  fireEvent.click(within(revokeDialog).getByRole("button", { name: "Cancel" }));
  expect(revokeMutationMock).not.toHaveBeenCalled();
  await waitFor(() => expect(revokeTrigger).toHaveFocus());

  fireEvent.click(revokeTrigger);
  confirmPublicLinkRevocation();
  await waitFor(() =>
    expect(revokeMutationMock).toHaveBeenCalledWith(
      expect.objectContaining({ variables: { snapshotId: "snapshot-1" } }),
    ),
  );
  await act(() =>
    revokeMutationMock.mock.calls[0]?.[0]?.onCompleted(
      { revokeComparisonSnapshot: { revokedSnapshotId: "snapshot-1", errors: [] } },
      [],
    ),
  );
  expect(await screen.findByRole("status")).toHaveTextContent("old link now returns not found");
  expect(screen.queryByRole("link", { name: "Open public comparison" })).not.toBeInTheDocument();
});

test("ShareComparisonControl manages snapshots discovered after a reload", async () => {
  mockedUseLazyLoadQuery.mockReturnValue({
    viewer: {
      comparisonSnapshots: {
        edges: [
          {
            node: {
              id: "snapshot-existing",
              sharePath: "/compare/shared/existing-token",
              title: "Existing shortlist",
            },
          },
        ],
        pageInfo: { endCursor: null, hasNextPage: false },
      },
    },
  } as never);
  render(
    <MemoryRouter>
      <ShareComparisonControl
        products={[
          {
            id: "product-1",
            name: "First",
            slug: "first",
            description: null,
            brandName: null,
            currentAttributes: [],
          },
          {
            id: "product-2",
            name: "Second",
            slug: "second",
            description: null,
            brandName: null,
            currentAttributes: [],
          },
        ]}
      />
    </MemoryRouter>,
  );

  fireEvent.click(screen.getByText("Share this comparison"));
  expect(await screen.findByRole("link", { name: "Existing shortlist" })).toHaveAttribute(
    "href",
    "/compare/shared/existing-token",
  );
  fireEvent.click(screen.getByRole("button", { name: "Revoke public link: Existing shortlist" }));
  confirmPublicLinkRevocation();

  await waitFor(() =>
    expect(revokeMutationMock).toHaveBeenCalledWith(
      expect.objectContaining({ variables: { snapshotId: "snapshot-existing" } }),
    ),
  );
  await act(() =>
    revokeMutationMock.mock.calls[0]?.[0]?.onCompleted(
      { revokeComparisonSnapshot: { revokedSnapshotId: "snapshot-existing", errors: [] } },
      [],
    ),
  );
  expect(screen.queryByRole("link", { name: "Existing shortlist" })).not.toBeInTheDocument();
});

test("ShareComparisonControl scopes revoke pending and failure state to one snapshot row", async () => {
  mockedUseLazyLoadQuery.mockReturnValue({
    viewer: {
      comparisonSnapshots: {
        edges: [
          {
            node: {
              id: "snapshot-first",
              sharePath: "/compare/shared/first-token",
              title: "First shortlist",
            },
          },
          {
            node: {
              id: "snapshot-second",
              sharePath: "/compare/shared/second-token",
              title: "Second shortlist",
            },
          },
        ],
        pageInfo: { endCursor: null, hasNextPage: false },
      },
    },
  } as never);

  render(
    <MemoryRouter>
      <ShareComparisonControl
        products={[
          {
            id: "product-1",
            name: "First",
            slug: "first",
            description: null,
            brandName: null,
            currentAttributes: [],
          },
          {
            id: "product-2",
            name: "Second",
            slug: "second",
            description: null,
            brandName: null,
            currentAttributes: [],
          },
        ]}
      />
    </MemoryRouter>,
  );

  fireEvent.click(screen.getByText("Share this comparison"));

  const firstLink = await screen.findByRole("link", { name: "First shortlist" });
  const secondLink = screen.getByRole("link", { name: "Second shortlist" });
  const firstRow = firstLink.closest("li");
  const secondRow = secondLink.closest("li");

  expect(firstRow).not.toBeNull();
  expect(secondRow).not.toBeNull();

  if (!firstRow || !secondRow) {
    throw new Error("Expected both saved snapshot rows to be rendered");
  }

  const firstButton = within(firstRow).getByRole("button", {
    name: "Revoke public link: First shortlist",
  });
  const secondButton = within(secondRow).getByRole("button", {
    name: "Revoke public link: Second shortlist",
  });

  fireEvent.click(firstButton);
  confirmPublicLinkRevocation();

  await waitFor(() => expect(revokeMutationMock).toHaveBeenCalledTimes(1));
  expect(firstButton).toBeDisabled();
  expect(firstButton).toHaveTextContent("Revoking…");
  expect(secondButton).not.toBeDisabled();
  expect(secondButton).toHaveTextContent("Revoke public link");

  fireEvent.click(firstButton);
  expect(revokeMutationMock).toHaveBeenCalledTimes(1);

  await act(() => {
    revokeMutationMock.mock.calls[0]?.[0]?.onCompleted(
      {
        revokeComparisonSnapshot: {
          revokedSnapshotId: null,
          errors: [
            {
              code: "INVALID_ARGUMENT",
              field: "snapshotId",
              message: "First snapshot cannot be revoked.",
            },
          ],
        },
      },
      [],
    );
  });

  expect(within(firstRow).getByRole("alert")).toHaveTextContent(
    "First snapshot cannot be revoked.",
  );
  expect(firstButton).not.toBeDisabled();
  expect(firstButton).toHaveTextContent("Revoke public link");
  expect(within(secondRow).queryByRole("alert")).not.toBeInTheDocument();
  expect(secondButton).not.toBeDisabled();

  fireEvent.click(firstButton);
  confirmPublicLinkRevocation();
  await waitFor(() => expect(revokeMutationMock).toHaveBeenCalledTimes(2));

  await act(() => {
    revokeMutationMock.mock.calls[1]?.[0]?.onCompleted(
      {
        revokeComparisonSnapshot: {
          revokedSnapshotId: "snapshot-first",
          errors: [],
        },
      },
      [],
    );
  });

  expect(screen.queryByRole("link", { name: "First shortlist" })).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Second shortlist" })).toBeInTheDocument();
  expect(secondButton).not.toBeDisabled();
});

test("ShareComparisonControl reaches snapshots beyond the first page", async () => {
  mockedUseLazyLoadQuery.mockImplementation((_query, variables) => {
    const after = (variables as { after?: string | null }).after;
    return (
      after
        ? {
            viewer: {
              comparisonSnapshots: {
                edges: [
                  {
                    node: {
                      id: "snapshot-21",
                      sharePath: "/compare/shared/21",
                      title: "Snapshot 21",
                    },
                  },
                ],
                pageInfo: { endCursor: null, hasNextPage: false },
              },
            },
          }
        : {
            viewer: {
              comparisonSnapshots: {
                edges: [
                  {
                    node: { id: "snapshot-1", sharePath: "/compare/shared/1", title: "Snapshot 1" },
                  },
                ],
                pageInfo: { endCursor: "cursor-20", hasNextPage: true },
              },
            },
          }
    ) as never;
  });

  render(
    <MemoryRouter>
      <ShareComparisonControl
        products={[
          {
            id: "product-1",
            name: "First",
            slug: "first",
            description: null,
            brandName: null,
            currentAttributes: [],
          },
          {
            id: "product-2",
            name: "Second",
            slug: "second",
            description: null,
            brandName: null,
            currentAttributes: [],
          },
        ]}
      />
    </MemoryRouter>,
  );

  fireEvent.click(screen.getByText("Share this comparison"));
  expect(await screen.findByRole("link", { name: "Snapshot 1" })).toBeVisible();

  fireEvent.click(screen.getByRole("button", { name: "Show more links" }));

  expect(await screen.findByRole("link", { name: "Snapshot 21" })).toBeVisible();
  expect(mockedUseLazyLoadQuery).toHaveBeenLastCalledWith(
    expect.anything(),
    { first: 20, after: "cursor-20" },
    { fetchPolicy: "store-or-network" },
  );
});

test("shared snapshot loader returns an HTTP 404 for invalid or revoked tokens", async () => {
  const environment = createRelayEnvironment();
  const invalid = await sharedComparisonLoader({
    context: createRelayRouterContext(environment),
    params: { token: "short" },
    request: new Request("https://example.test/compare/shared/short"),
  } as never);
  expect(invalid).toMatchObject({ data: { status: "not_found" } });
  expect((invalid as { init: { status: number } }).init.status).toBe(404);
  expect(mockedFetchRouteQuery).not.toHaveBeenCalled();

  const dispose = vi.fn();
  mockedFetchRouteQuery.mockResolvedValueOnce({
    data: { comparisonSnapshot: null },
    descriptor: {},
    dispose,
  } as never);
  const token = "a".repeat(43);
  const revoked = await sharedComparisonLoader({
    context: createRelayRouterContext(environment),
    params: { token },
    request: new Request(`https://example.test/compare/shared/${token}`),
  } as never);
  expect(revoked).toMatchObject({ data: { status: "not_found" } });
  expect((revoked as { init: { status: number } }).init.status).toBe(404);
  expect(dispose).toHaveBeenCalledTimes(1);
});

test("SharedComparisonRoute renders captured facts, warning, and a live comparison path", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    query: {
      __relayQuery: {
        operationName: "SharedComparisonRouteQuery",
        text: 'query SharedComparisonRouteQuery { comparisonSnapshot(token: "x") { id } }',
        variables: { token: "x" },
      },
    },
  } as never);
  mockedUseRoutePreloadedQuery.mockReturnValue({} as never);
  mockedUsePreloadedQuery.mockReturnValue({
    comparisonSnapshot: {
      id: "snapshot-1",
      title: "Camera shortlist",
      capturedAt: "2026-07-13T23:00:00Z",
      disclaimer: "This is a captured snapshot.",
      recommendation: {
        profile: "LOWEST_CURRENT_COST",
        algorithmVersion: "lowest-v1",
        evaluatedAt: "2026-07-13T23:00:00Z",
        status: "WINNER",
        winnerProductId: "product-2",
        currency: "USD",
        missingInputs: [],
        rankings: [
          {
            rank: 1,
            productId: "product-2",
            productName: "Second camera",
            landedPrice: "90",
            currency: "USD",
            pricePointId: "point-2",
            claimIds: [],
            reasons: ["Lowest current cost"],
          },
        ],
      },
      products: [
        {
          id: "product-2",
          name: "Second camera",
          slug: "second-camera",
          description: null,
          modelNumber: null,
          brandName: "Acme",
          attributes: [
            {
              claimId: "claim-1",
              displayName: "Sensor",
              sourceType: "official",
              valueText: "Full frame",
              evidence: [{ sourceName: "Acme specifications" }],
            },
          ],
          offers: [
            {
              pricePointId: "point-2",
              merchantProductId: "offer-2",
              merchantName: "Shop",
              merchantDomain: "shop.example",
              currency: "USD",
              itemPrice: "85",
              shipping: "5",
              landedPrice: "90",
              observedAt: "2026-07-13T22:00:00Z",
              freshness: "fresh",
            },
          ],
        },
        {
          id: "product-1",
          name: "First camera",
          slug: "first-camera",
          description: null,
          modelNumber: null,
          brandName: "Bravo",
          attributes: [],
          offers: [],
        },
      ],
    },
  } as never);

  render(
    <MemoryRouter>
      <SharedComparisonRoute />
    </MemoryRouter>,
  );
  expect(screen.getByRole("heading", { name: "Camera shortlist" })).toBeVisible();
  expect(screen.getByRole("note")).toHaveTextContent("captured snapshot");
  expect(screen.getByText("Second camera", { selector: "strong" })).toBeVisible();
  expect(screen.getByText(/Shop: 90 USD total/)).toBeVisible();
  expect(screen.getByText("Source: Acme specifications").closest("dd")).toHaveTextContent(
    "Full frame",
  );
  expect(screen.queryByText(/claim-1|lowest-v1|algorithm/i)).not.toBeInTheDocument();
  expect(screen.getByText("Jul 13, 2026, 11:00 PM", { selector: "time" })).toHaveAttribute(
    "datetime",
    "2026-07-13T23:00:00Z",
  );
  expect(screen.getByRole("link", { name: "Open a live comparison" })).toHaveAttribute(
    "href",
    "/compare?slug=second-camera&slug=first-camera",
  );
});
