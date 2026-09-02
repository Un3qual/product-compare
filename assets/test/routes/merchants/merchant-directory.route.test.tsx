import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, useLoaderData } from "react-router";
import { useFragment, usePreloadedQuery } from "react-relay";
import { useRoutePreloadedQuery } from "../../../src/relay/route-preload";
import {
  MerchantDirectoryRoute,
  type MerchantDirectoryLoaderData,
} from "../../../src/routes/merchants/MerchantDirectoryRoute";
import {
  MerchantDirectoryControls,
  MerchantDirectoryView,
} from "../../../src/routes/merchants/MerchantDirectoryView";
import { openSelect } from "../../helpers/base-select";

const { useLoaderDataMock, useFragmentMock, usePreloadedQueryMock, useRoutePreloadedQueryMock } =
  vi.hoisted(() => ({
    useLoaderDataMock: vi.fn(),
    useFragmentMock: vi.fn(),
    usePreloadedQueryMock: vi.fn(),
    useRoutePreloadedQueryMock: vi.fn(),
  }));

vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof import("react-router")>("react-router");

  return {
    ...actual,
    useLoaderData: useLoaderDataMock,
  };
});

vi.mock("react-relay", async () => {
  const actual = await vi.importActual<typeof import("react-relay")>("react-relay");

  return {
    ...actual,
    useFragment: useFragmentMock,
    usePreloadedQuery: usePreloadedQueryMock,
  };
});

vi.mock("../../../src/relay/route-preload", async () => {
  const actual = await vi.importActual<typeof import("../../../src/relay/route-preload")>(
    "../../../src/relay/route-preload",
  );

  return {
    ...actual,
    useRoutePreloadedQuery: useRoutePreloadedQueryMock,
  };
});

const mockedUseLoaderData = vi.mocked(useLoaderData);
const mockedUseFragment = vi.mocked(useFragment);
const mockedUsePreloadedQuery = vi.mocked(usePreloadedQuery);
const mockedUseRoutePreloadedQuery = vi.mocked(useRoutePreloadedQuery);

const MERCHANT_DIRECTORY_QUERY_DESCRIPTOR = {
  __relayQuery: {
    cacheID: "MerchantDirectoryRouteQuery-cache-id",
    operationName: "MerchantDirectoryRouteQuery",
    variables: {
      first: 20,
      after: null,
    },
  },
};

const MERCHANT_DIRECTORY_QUERY_REF = {
  dispose: vi.fn(),
  variables: MERCHANT_DIRECTORY_QUERY_DESCRIPTOR.__relayQuery.variables,
};

beforeEach(() => {
  mockedUseFragment.mockReset();
  mockedUseFragment.mockImplementation((_fragment, fragmentRef) => fragmentRef as never);
  useLoaderDataMock.mockReset();
  usePreloadedQueryMock.mockReset();
  useRoutePreloadedQueryMock.mockReset();
  MERCHANT_DIRECTORY_QUERY_REF.dispose.mockReset();
  mockedUseLoaderData.mockReturnValue(buildReadyLoaderData());
  mockedUseRoutePreloadedQuery.mockReturnValue(MERCHANT_DIRECTORY_QUERY_REF as never);
  mockedUsePreloadedQuery.mockReturnValue(buildMerchantDirectoryData());
});

test("merchant directory renders merchant names and domains", () => {
  renderMerchantDirectoryRoute();

  expect(screen.getByRole("heading", { name: "Merchants" })).toBeInTheDocument();
  expect(screen.getByRole("region", { name: "Merchants" })).toBeInTheDocument();
  const merchantList = screen.getByRole("list", { name: "Merchants" });

  expect(within(merchantList).getByText("Acme Market")).toBeInTheDocument();
  expect(within(merchantList).getByText("acme.example")).toBeInTheDocument();
  expect(within(merchantList).getByText("Globex Supply")).toBeInTheDocument();
  expect(within(merchantList).getByText("globex.example")).toBeInTheDocument();
  expect(mockedUseRoutePreloadedQuery).toHaveBeenCalledWith(
    expect.anything(),
    MERCHANT_DIRECTORY_QUERY_DESCRIPTOR,
  );
  expect(mockedUsePreloadedQuery).toHaveBeenCalledWith(
    expect.anything(),
    MERCHANT_DIRECTORY_QUERY_REF,
  );
});

test("merchant directory controls render the selected page size", () => {
  render(<MerchantDirectoryControls formAction="/merchants" pageSize={35} />);

  const pageSizeSelect = screen.getByRole("combobox", { name: "Page size" });
  const pageSizeForm = pageSizeSelect.closest("form");

  expect(pageSizeForm).toHaveAttribute("action", "/merchants");
  expect(pageSizeForm).toHaveAttribute("method", "get");
  expect(pageSizeSelect).toHaveValue("35");
  openSelect(pageSizeSelect);
  expect(screen.getByRole("option", { name: "20" })).toBeInTheDocument();
  expect(screen.getByRole("option", { name: "35" })).toBeInTheDocument();
  expect(screen.getByRole("option", { name: "50" })).toBeInTheDocument();
});

test("merchant directory view renders only supplied safe actions", () => {
  renderMerchantDirectoryView();

  const safeMerchant = getMerchantListItem("Acme Market");
  const website = within(safeMerchant).getByRole("link", { name: "Visit merchant website" });
  expect(website).toHaveAttribute("href", "https://acme.example");
  expect(website).not.toHaveAttribute("data-slot", "button");
  expect(
    within(safeMerchant).queryByRole("link", { name: "View merchant details" }),
  ).not.toBeInTheDocument();
  expect(
    within(getMerchantListItem("Unsafe Seller")).queryByRole("link", {
      name: "Visit merchant website",
    }),
  ).not.toBeInTheDocument();
});

test("merchant directory view filters names case-insensitively and explains no matches", () => {
  renderMerchantDirectoryView();

  expect(screen.getByRole("heading", { name: "2 merchants on this page" })).toBeInTheDocument();

  fireEvent.change(screen.getByRole("searchbox", { name: "Filter merchants on this page" }), {
    target: { value: "  " },
  });
  expect(screen.getByRole("heading", { name: "2 merchants on this page" })).toBeInTheDocument();

  fireEvent.change(screen.getByRole("searchbox", { name: "Filter merchants on this page" }), {
    target: { value: "aCmE" },
  });

  expect(screen.getByRole("heading", { name: "1 of 2 merchants shown" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Acme Market" })).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "Unsafe Seller" })).not.toBeInTheDocument();

  fireEvent.change(screen.getByRole("searchbox", { name: "Filter merchants on this page" }), {
    target: { value: "missing" },
  });

  expect(screen.getByText("No merchants on this page match this filter.")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "0 of 2 merchants shown" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Next merchants" })).toBeInTheDocument();
});

test("merchant directory view explains when its result page is empty", () => {
  renderMerchantDirectoryView({ merchants: [] });

  expect(screen.getByText("No merchants available yet.")).toBeInTheDocument();
  expect(screen.queryByRole("searchbox", { name: "Filter merchants on this page" })).toBeNull();
});

test("merchant directory normalizes domain-only website links to HTTPS", () => {
  renderMerchantDirectoryRoute();

  expect(screen.getByRole("region", { name: "Merchant results" })).toBeInTheDocument();
  expect(screen.getByRole("complementary", { name: "Merchant controls" })).toBeInTheDocument();

  expect(getMerchantListItem("Acme Market")).toHaveTextContent("acme.example");
  const websiteLink = within(getMerchantListItem("Acme Market")).getByRole("link", {
    name: "Visit merchant website",
  });

  expect(websiteLink).toHaveAttribute("href", "https://acme.example");
  expect(websiteLink).toHaveAttribute("target", "_blank");
  expect(websiteLink).toHaveAttribute("rel", "noopener noreferrer");
});

test("merchant directory preserves already absolute HTTPS website links", () => {
  mockedUsePreloadedQuery.mockReturnValue(
    buildMerchantDirectoryData({
      merchants: [
        {
          id: "merchant-3",
          name: "Secure Seller",
          domain: "https://secure.example/deals?source=directory",
        },
      ],
    }),
  );

  renderMerchantDirectoryRoute();

  const websiteLink = within(getMerchantListItem("Secure Seller")).getByRole("link", {
    name: "Visit merchant website",
  });

  expect(websiteLink).toHaveAttribute("href", "https://secure.example/deals?source=directory");
  expect(websiteLink).toHaveAttribute("target", "_blank");
  expect(websiteLink).toHaveAttribute("rel", "noopener noreferrer");
});

test("merchant directory normalizes domain and port website links to HTTPS", () => {
  mockedUsePreloadedQuery.mockReturnValue(
    buildMerchantDirectoryData({
      merchants: [
        {
          id: "merchant-port",
          name: "Port Seller",
          domain: "portal.example:8443",
        },
      ],
    }),
  );

  renderMerchantDirectoryRoute();

  const websiteLink = within(getMerchantListItem("Port Seller")).getByRole("link", {
    name: "Visit merchant website",
  });

  expect(websiteLink).toHaveAttribute("href", "https://portal.example:8443");
});

test.each([
  ["Protocol Relative Seller", "merchant-protocol-relative", "//attacker.example"],
  ["Backslash Seller", "merchant-backslash", "\\attacker.example"],
  ["Invalid Domain Seller", "merchant-invalid-domain", "bad_domain.example"],
  ["Localhost Seller", "merchant-localhost", "http://localhost/deals"],
  ["Private Network Seller", "merchant-private-network", "http://192.168.1.1/deals"],
  ["Private IPv6 Seller", "merchant-private-ipv6", "http://[fc00::1]/deals"],
  [
    "IPv4-Mapped Loopback Seller",
    "merchant-ipv4-mapped-loopback",
    "http://[::ffff:127.0.0.1]/deals",
  ],
  [
    "IPv4-Compatible Loopback Seller",
    "merchant-ipv4-compatible-loopback",
    "http://[::127.0.0.1]/deals",
  ],
  ["Malformed Absolute Seller", "merchant-malformed-absolute", "https:////attacker.example"],
])("merchant directory leaves malformed bare domain %s as text only", (name, id, domain) => {
  mockedUsePreloadedQuery.mockReturnValue(
    buildMerchantDirectoryData({
      merchants: [
        {
          id,
          name,
          domain,
        },
      ],
    }),
  );

  renderMerchantDirectoryRoute();

  const merchantItem = getMerchantListItem(name);

  expect(merchantItem).toHaveTextContent(domain);
  expect(
    within(merchantItem).queryByRole("link", {
      name: "Visit merchant website",
    }),
  ).not.toBeInTheDocument();
});

test("merchant directory leaves non-HTTP merchant domains as text only", () => {
  mockedUsePreloadedQuery.mockReturnValue(
    buildMerchantDirectoryData({
      merchants: [
        {
          id: "merchant-4",
          name: "File Seller",
          domain: "ftp://files.example",
        },
      ],
    }),
  );

  renderMerchantDirectoryRoute();

  const merchantItem = getMerchantListItem("File Seller");

  expect(merchantItem).toHaveTextContent("ftp://files.example");
  expect(
    within(merchantItem).queryByRole("link", {
      name: "Visit merchant website",
    }),
  ).not.toBeInTheDocument();
});

test("merchant directory rejects website links with URL userinfo", () => {
  mockedUsePreloadedQuery.mockReturnValue(
    buildMerchantDirectoryData({
      merchants: [
        {
          id: "merchant-userinfo",
          name: "Misleading Seller",
          domain: "https://trusted.example@attacker.example/deals",
        },
      ],
    }),
  );

  renderMerchantDirectoryRoute();

  const merchantItem = getMerchantListItem("Misleading Seller");

  expect(merchantItem).toHaveTextContent("https://trusted.example@attacker.example/deals");
  expect(
    within(merchantItem).queryByRole("link", {
      name: "Visit merchant website",
    }),
  ).not.toBeInTheDocument();
});

test("merchant directory renders next-page navigation when available", () => {
  mockedUseLoaderData.mockReturnValue(
    buildReadyLoaderData({
      first: 35,
      after: "previous-cursor",
    }),
  );
  mockedUsePreloadedQuery.mockReturnValue(
    buildMerchantDirectoryData({
      endCursor: "next-cursor",
      hasNextPage: true,
    }),
  );

  renderMerchantDirectoryRoute();

  expect(screen.getByRole("link", { name: "Next merchants" })).toHaveAttribute(
    "href",
    "/merchants?first=35&after=next-cursor",
  );
});

test("merchant directory suppresses repeated and blank next cursors", () => {
  mockedUseLoaderData.mockReturnValue(buildReadyLoaderData({ first: 35, after: "same-cursor" }));
  mockedUsePreloadedQuery.mockReturnValue(
    buildMerchantDirectoryData({ endCursor: "same-cursor", hasNextPage: true }),
  );

  renderMerchantDirectoryRoute();
  expect(screen.queryByRole("link", { name: "Next merchants" })).not.toBeInTheDocument();

  mockedUsePreloadedQuery.mockReturnValue(
    buildMerchantDirectoryData({ endCursor: "  ", hasNextPage: true }),
  );
  renderMerchantDirectoryRoute();
  expect(screen.queryAllByRole("link", { name: "Next merchants" })).toHaveLength(0);
});

test("merchant filtering is stable when the browser locale has special casing rules", () => {
  mockedUsePreloadedQuery.mockReturnValue(
    buildMerchantDirectoryData({
      merchants: [
        {
          id: "merchant-istanbul",
          name: "Istanbul",
          domain: "istanbul.example",
        },
      ],
    }),
  );
  const localeLowerCase = vi
    .spyOn(String.prototype, "toLocaleLowerCase")
    .mockImplementation(function (this: string) {
      return String(this).replaceAll("I", "ı").toLowerCase();
    });

  try {
    renderMerchantDirectoryRoute();

    fireEvent.change(screen.getByRole("searchbox", { name: "Filter merchants on this page" }), {
      target: { value: "i" },
    });

    expect(screen.getByRole("heading", { name: "Istanbul" })).toBeInTheDocument();
  } finally {
    localeLowerCase.mockRestore();
  }
});

test("merchant directory renders first-page navigation when cursor-paged", () => {
  mockedUseLoaderData.mockReturnValue(
    buildReadyLoaderData({
      first: 35,
      after: "cursor-1",
    }),
  );
  mockedUsePreloadedQuery.mockReturnValue(
    buildMerchantDirectoryData({
      hasPreviousPage: true,
      startCursor: "cursor-2",
    }),
  );

  expect(screen.queryByRole("link", { name: "First merchants" })).not.toBeInTheDocument();

  renderMerchantDirectoryRoute();

  expect(screen.getByRole("link", { name: "First merchants" })).toHaveAttribute(
    "href",
    "/merchants?first=35",
  );
});

test("merchant directory refreshes the page-size selector when pagination changes", () => {
  const { rerender } = renderMerchantDirectoryRoute();

  expect(screen.getByRole("combobox", { name: "Page size" })).toHaveValue("20");

  mockedUseLoaderData.mockReturnValue(
    buildReadyLoaderData({
      first: 50,
      after: null,
    }),
  );

  rerender(
    <MemoryRouter>
      <MerchantDirectoryRoute />
    </MemoryRouter>,
  );

  expect(screen.getByRole("combobox", { name: "Page size" })).toHaveValue("50");
});

test("merchant directory keeps its shell while the Relay query loads", () => {
  mockedUsePreloadedQuery.mockImplementation(() => {
    throw new Promise<never>(() => undefined);
  });

  renderMerchantDirectoryRoute();

  expect(screen.getByRole("region", { name: "Merchant results" })).toBeInTheDocument();
  expect(screen.getByRole("complementary", { name: "Merchant controls" })).toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent("Loading merchants...");
});

test("merchant directory keeps its shell when the Relay query errors", () => {
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

  mockedUsePreloadedQuery.mockImplementation(() => {
    throw new Error("Merchant query failed");
  });

  try {
    renderMerchantDirectoryRoute();

    expect(screen.getByRole("region", { name: "Merchant results" })).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "Merchant controls" })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Merchant directory unavailable.");
  } finally {
    consoleErrorSpy.mockRestore();
  }
});

test("merchant directory keeps its shell when merchant data is unavailable", () => {
  mockedUsePreloadedQuery.mockReturnValue({ merchants: null } as never);

  renderMerchantDirectoryRoute();

  expect(screen.getByRole("region", { name: "Merchant results" })).toBeInTheDocument();
  expect(screen.getByRole("complementary", { name: "Merchant controls" })).toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent("Merchant directory unavailable.");
});

test("merchant directory renders the loader error state", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "error",
    pagination: {
      first: 20,
      after: null,
    },
  } satisfies MerchantDirectoryLoaderData);

  renderMerchantDirectoryRoute();

  expect(screen.getByRole("heading", { name: "Merchants" })).toBeInTheDocument();
  expect(screen.getByRole("region", { name: "Merchant results" })).toBeInTheDocument();
  expect(screen.getByRole("complementary", { name: "Merchant controls" })).toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: "Page size" })).toHaveValue("20");
  expect(screen.getByRole("alert")).toHaveTextContent("Merchant directory unavailable.");
  expect(mockedUseRoutePreloadedQuery).not.toHaveBeenCalled();
  expect(mockedUsePreloadedQuery).not.toHaveBeenCalled();
});

function renderMerchantDirectoryRoute() {
  return render(
    <MemoryRouter>
      <MerchantDirectoryRoute />
    </MemoryRouter>,
  );
}

function renderMerchantDirectoryView({
  merchants = [
    {
      id: "merchant-1",
      name: "Acme Market",
      domain: "acme.example",
      slug: "acme-market",
    },
    {
      id: "merchant-unsafe",
      name: "Unsafe Seller",
      domain: "http://localhost",
      slug: "unsafe-seller",
    },
  ],
}: {
  merchants?: Array<{
    id: string;
    name: string;
    domain: string;
    slug: string;
  }>;
} = {}) {
  return render(
    <MemoryRouter>
      <MerchantDirectoryView
        firstHref="/merchants?first=35"
        merchants={{ edges: merchants.map((node) => ({ node })) } as never}
        nextHref="/merchants?first=35&after=next-cursor"
      />
    </MemoryRouter>,
  );
}

function getMerchantListItem(name: string) {
  const listItem = screen.getByRole("heading", { name }).closest("li");

  if (!listItem) {
    throw new Error(`Expected ${name} to render inside a merchant list item.`);
  }

  return listItem;
}

function buildReadyLoaderData(
  pagination: Extract<MerchantDirectoryLoaderData, { status: "ready" }>["pagination"] = {
    first: 20,
    after: null,
  },
) {
  return {
    status: "ready",
    pagination,
    query: MERCHANT_DIRECTORY_QUERY_DESCRIPTOR,
  } satisfies MerchantDirectoryLoaderData;
}

function buildMerchantDirectoryData({
  endCursor = "cursor-2",
  hasNextPage = false,
  hasPreviousPage = false,
  merchants = [
    {
      id: "merchant-1",
      name: "Acme Market",
      domain: "acme.example",
    },
    {
      id: "merchant-2",
      name: "Globex Supply",
      domain: "globex.example",
    },
  ],
  startCursor = merchants.length === 0 ? null : "cursor-1",
}: {
  endCursor?: string | null;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  merchants?: Array<{ id: string; name: string; domain: string }>;
  startCursor?: string | null;
} = {}) {
  return {
    merchants: {
      edges: merchants.map((merchant, index) => ({
        cursor: `cursor-${index + 1}`,
        node: merchant,
      })),
      pageInfo: {
        hasNextPage,
        hasPreviousPage,
        startCursor,
        endCursor,
      },
    },
  };
}
