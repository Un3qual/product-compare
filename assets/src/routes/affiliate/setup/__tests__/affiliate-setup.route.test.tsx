import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, useLoaderData } from "react-router-dom";
import { useMutation, usePreloadedQuery } from "react-relay";
import { useRoutePreloadedQuery } from "../../../../relay/route-preload";
import { AffiliateSetupRoute } from "../index";
import type { AffiliateSetupLoaderData } from "../loader";

const {
  commitNetworkMutationMock,
  commitProgramMutationMock,
  useLoaderDataMock,
  useMutationMock,
  usePreloadedQueryMock,
  useRoutePreloadedQueryMock
} = vi.hoisted(() => ({
  commitNetworkMutationMock: vi.fn(),
  commitProgramMutationMock: vi.fn(),
  useLoaderDataMock: vi.fn(),
  useMutationMock: vi.fn(),
  usePreloadedQueryMock: vi.fn(),
  useRoutePreloadedQueryMock: vi.fn()
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");

  return {
    ...actual,
    useLoaderData: useLoaderDataMock
  };
});

vi.mock("react-relay", async () => {
  const actual = await vi.importActual<typeof import("react-relay")>("react-relay");

  return {
    ...actual,
    useMutation: useMutationMock,
    usePreloadedQuery: usePreloadedQueryMock
  };
});

vi.mock("../../../../relay/route-preload", async () => {
  const actual = await vi.importActual<typeof import("../../../../relay/route-preload")>(
    "../../../../relay/route-preload"
  );

  return {
    ...actual,
    useRoutePreloadedQuery: useRoutePreloadedQueryMock
  };
});

const mockedUseLoaderData = vi.mocked(useLoaderData);
const mockedUseMutation = vi.mocked(useMutation);
const mockedUsePreloadedQuery = vi.mocked(usePreloadedQuery);
const mockedUseRoutePreloadedQuery = vi.mocked(useRoutePreloadedQuery);

const MERCHANT_ID = "TWVyY2hhbnQ6MQ==";
const SECOND_MERCHANT_ID = "TWVyY2hhbnQ6Mg==";
const NETWORK_ID = "QWZmaWxpYXRlTmV0d29yazox";
const PROGRAM_ID = "QWZmaWxpYXRlUHJvZ3JhbTox";

const AFFILIATE_SETUP_QUERY_DESCRIPTOR = {
  __relayQuery: {
    operationName: "AffiliateSetupRouteQuery",
    text: "query AffiliateSetupRouteQuery($first: Int, $after: String) { merchants(first: $first, after: $after) { edges { node { id } } } }",
    variables: {
      first: 20,
      after: null
    }
  }
};

const AFFILIATE_SETUP_QUERY_REF = {
  dispose: vi.fn(),
  variables: AFFILIATE_SETUP_QUERY_DESCRIPTOR.__relayQuery.variables
};

beforeEach(() => {
  commitNetworkMutationMock.mockReset();
  commitProgramMutationMock.mockReset();
  useLoaderDataMock.mockReset();
  useMutationMock.mockReset();
  usePreloadedQueryMock.mockReset();
  useRoutePreloadedQueryMock.mockReset();
  AFFILIATE_SETUP_QUERY_REF.dispose.mockReset();
  mockedUseLoaderData.mockReturnValue(buildReadyLoaderData());
  mockedUseMutation.mockImplementation((mutation) => {
    const name = (mutation as { params?: { name?: string } }).params?.name;

    if (name === "UpsertAffiliateProgramMutation") {
      return [commitProgramMutationMock, false];
    }

    return [commitNetworkMutationMock, false];
  });
  mockedUseRoutePreloadedQuery.mockReturnValue(AFFILIATE_SETUP_QUERY_REF as never);
  mockedUsePreloadedQuery.mockReturnValue(buildAffiliateSetupData() as never);
});

test("affiliate setup route renders merchant choices and setup forms", () => {
  renderAffiliateSetupRoute();

  expect(screen.getByRole("heading", { name: "Affiliate setup" })).toBeInTheDocument();
  expect(screen.getByRole("form", { name: "Save affiliate network" })).toBeInTheDocument();
  expect(screen.getByRole("form", { name: "Save affiliate program" })).toBeInTheDocument();

  const merchantSelect = screen.getByLabelText("Merchant");
  expect(within(merchantSelect).getByRole("option", { name: "Acme Market" })).toHaveValue(
    MERCHANT_ID
  );
  expect(within(merchantSelect).getByRole("option", { name: "Globex Supply" })).toHaveValue(
    SECOND_MERCHANT_ID
  );
  expect(mockedUseRoutePreloadedQuery).toHaveBeenCalledWith(
    expect.anything(),
    AFFILIATE_SETUP_QUERY_DESCRIPTOR
  );
  expect(mockedUsePreloadedQuery).toHaveBeenCalledWith(
    expect.anything(),
    AFFILIATE_SETUP_QUERY_REF
  );
});

test("affiliate setup route renders loader error fallback", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "error",
    merchantPagination: {
      first: 20,
      after: null
    }
  } satisfies AffiliateSetupLoaderData);

  renderAffiliateSetupRoute();

  expect(screen.getByRole("heading", { name: "Affiliate setup" })).toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent("Affiliate setup unavailable.");
});

test("affiliate setup route commits network upsert and displays the saved network", async () => {
  renderAffiliateSetupRoute();

  fireEvent.change(screen.getByLabelText("Network name"), {
    target: { value: "Impact" }
  });
  fireEvent.click(screen.getByRole("button", { name: "Save network" }));

  await waitFor(() => {
    expect(commitNetworkMutationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          input: {
            name: "Impact"
          }
        }
      })
    );
  });

  completeLatestNetworkMutation({
    upsertAffiliateNetwork: {
      network: {
        id: NETWORK_ID,
        name: "Impact"
      },
      errors: []
    }
  });

  const resultRegion = await screen.findByRole("region", {
    name: "Affiliate network result"
  });

  expect(resultRegion).toHaveTextContent("Impact");
  expect(resultRegion).toHaveTextContent(NETWORK_ID);
  expect(screen.getByLabelText("Affiliate network ID")).toHaveValue(NETWORK_ID);
});

test("affiliate setup route renders network payload errors", async () => {
  renderAffiliateSetupRoute();

  fireEvent.change(screen.getByLabelText("Network name"), {
    target: { value: "" }
  });
  fireEvent.click(screen.getByRole("button", { name: "Save network" }));

  await waitFor(() => {
    expect(commitNetworkMutationMock).toHaveBeenCalledTimes(1);
  });
  completeLatestNetworkMutation({
    upsertAffiliateNetwork: {
      network: null,
      errors: [
        {
          code: "INVALID_ARGUMENT",
          field: "name",
          message: "Name can't be blank."
        }
      ]
    }
  });

  expect(await screen.findByRole("alert")).toHaveTextContent("Name can't be blank.");
});

test("affiliate setup route commits program upsert and displays the saved program", async () => {
  renderAffiliateSetupRoute();

  fireEvent.change(screen.getByLabelText("Affiliate network ID"), {
    target: { value: NETWORK_ID }
  });
  fireEvent.change(screen.getByLabelText("Merchant"), {
    target: { value: SECOND_MERCHANT_ID }
  });
  fireEvent.change(screen.getByLabelText("Program code"), {
    target: { value: "CJ-123" }
  });
  fireEvent.change(screen.getByLabelText("Program status"), {
    target: { value: "active" }
  });
  fireEvent.click(screen.getByRole("button", { name: "Save program" }));

  await waitFor(() => {
    expect(commitProgramMutationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          input: {
            affiliateNetworkId: NETWORK_ID,
            merchantId: SECOND_MERCHANT_ID,
            programCode: "CJ-123",
            status: "active"
          }
        }
      })
    );
  });

  completeLatestProgramMutation({
    upsertAffiliateProgram: {
      program: {
        id: PROGRAM_ID,
        affiliateNetworkId: NETWORK_ID,
        merchantId: SECOND_MERCHANT_ID,
        programCode: "CJ-123",
        status: "active"
      },
      errors: []
    }
  });

  const resultRegion = await screen.findByRole("region", {
    name: "Affiliate program result"
  });

  expect(resultRegion).toHaveTextContent(PROGRAM_ID);
  expect(resultRegion).toHaveTextContent("CJ-123");
  expect(resultRegion).toHaveTextContent("active");
});

test("affiliate setup route renders program payload errors", async () => {
  renderAffiliateSetupRoute();

  fireEvent.change(screen.getByLabelText("Affiliate network ID"), {
    target: { value: "not-a-global-id" }
  });
  fireEvent.click(screen.getByRole("button", { name: "Save program" }));

  await waitFor(() => {
    expect(commitProgramMutationMock).toHaveBeenCalledTimes(1);
  });
  completeLatestProgramMutation({
    upsertAffiliateProgram: {
      program: null,
      errors: [
        {
          code: "INVALID_ID",
          field: "affiliateNetworkId",
          message: "invalid affiliate network id"
        }
      ]
    }
  });

  expect(await screen.findByRole("alert")).toHaveTextContent("invalid affiliate network id");
});

function completeLatestNetworkMutation(response: unknown) {
  commitNetworkMutationMock.mock.calls.at(-1)?.[0]?.onCompleted?.(response, null);
}

function completeLatestProgramMutation(response: unknown) {
  commitProgramMutationMock.mock.calls.at(-1)?.[0]?.onCompleted?.(response, null);
}

function renderAffiliateSetupRoute() {
  return render(
    <MemoryRouter>
      <AffiliateSetupRoute />
    </MemoryRouter>
  );
}

function buildReadyLoaderData(
  merchantQuery = AFFILIATE_SETUP_QUERY_DESCRIPTOR
): AffiliateSetupLoaderData {
  return {
    status: "ready",
    merchantPagination: {
      first: 20,
      after: null
    },
    merchantQuery
  };
}

function buildAffiliateSetupData({
  merchants = [
    { id: MERCHANT_ID, name: "Acme Market", domain: "acme.example" },
    { id: SECOND_MERCHANT_ID, name: "Globex Supply", domain: "globex.example" }
  ]
}: {
  merchants?: Array<{ id: string; name: string; domain: string }>;
} = {}) {
  return {
    merchants: {
      edges: merchants.map((merchant, index) => ({
        cursor: `merchant-cursor-${index}`,
        node: merchant
      })),
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: merchants.length > 0 ? "merchant-cursor-0" : null,
        endCursor: merchants.length > 0 ? `merchant-cursor-${merchants.length - 1}` : null
      }
    }
  };
}
