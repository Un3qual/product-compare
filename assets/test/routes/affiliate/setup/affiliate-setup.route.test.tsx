import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, useLoaderData } from "react-router-dom";
import { useMutation, usePreloadedQuery } from "react-relay";
import { useRoutePreloadedQuery } from "../../../../src/relay/route-preload";
import {
  AffiliateCouponForm,
  AffiliateLinkForm,
  AffiliateNetworkForm,
  AffiliateProgramForm
} from "../../../../src/routes/affiliate/setup/AffiliateSetupForms";
import { AffiliateSetupRoute } from "../../../../src/routes/affiliate/setup/AffiliateSetupRoute";
import type { AffiliateSetupLoaderData } from "../../../../src/routes/affiliate/setup/loader";
import {
  chooseSelectOption,
  openSelect
} from "../../../helpers/radix-select";

const {
  commitCouponMutationMock,
  commitLinkMutationMock,
  commitNetworkMutationMock,
  commitProgramMutationMock,
  useLoaderDataMock,
  useMutationMock,
  usePreloadedQueryMock,
  useRoutePreloadedQueryMock
} = vi.hoisted(() => ({
  commitCouponMutationMock: vi.fn(),
  commitLinkMutationMock: vi.fn(),
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

vi.mock("../../../../src/relay/route-preload", async () => {
  const actual = await vi.importActual<typeof import("../../../../src/relay/route-preload")>(
    "../../../../src/relay/route-preload"
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
const MERCHANT_PRODUCT_ID = "TWVyY2hhbnRQcm9kdWN0OjE=";
const NETWORK_ID = "QWZmaWxpYXRlTmV0d29yazox";
const PROGRAM_ID = "QWZmaWxpYXRlUHJvZ3JhbTox";
const LINK_ID = "QWZmaWxpYXRlTGluazox";
const COUPON_ID = "Q291cG9uOjE=";

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
  commitCouponMutationMock.mockReset();
  commitLinkMutationMock.mockReset();
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

    if (name === "AffiliateSetupRouteUpsertAffiliateProgramMutation") {
      return [commitProgramMutationMock, false];
    }

    if (name === "AffiliateSetupRouteUpsertAffiliateLinkMutation") {
      return [commitLinkMutationMock, false];
    }

    if (name === "AffiliateSetupRouteCreateCouponMutation") {
      return [commitCouponMutationMock, false];
    }

    return [commitNetworkMutationMock, false];
  });
  mockedUseRoutePreloadedQuery.mockReturnValue(AFFILIATE_SETUP_QUERY_REF as never);
  mockedUsePreloadedQuery.mockReturnValue(buildAffiliateSetupData() as never);
});

test("affiliate setup route renders merchant choices and setup forms", () => {
  renderAffiliateSetupRoute();

  expect(screen.getByRole("heading", { name: "Affiliate setup" })).toBeInTheDocument();
  expect(screen.getByRole("region", { name: "Affiliate setup" })).toBeInTheDocument();
  expect(screen.getByRole("region", { name: "Affiliate configuration workflow" })).toBeInTheDocument();
  expect(screen.getByRole("complementary", { name: "Setup sequence" })).toBeInTheDocument();
  expect(screen.getByRole("form", { name: "Save affiliate network" })).toBeInTheDocument();
  expect(screen.getByRole("form", { name: "Save affiliate program" })).toBeInTheDocument();

  const merchantSelect = screen.getByLabelText("Merchant");
  openSelect(merchantSelect);
  expect(screen.getByRole("option", { name: "Acme Market" })).toBeInTheDocument();
  expect(screen.getByRole("option", { name: "Globex Supply" })).toBeInTheDocument();
  expect(mockedUseRoutePreloadedQuery).toHaveBeenCalledWith(
    expect.anything(),
    AFFILIATE_SETUP_QUERY_DESCRIPTOR
  );
  expect(mockedUsePreloadedQuery).toHaveBeenCalledWith(
    expect.anything(),
    AFFILIATE_SETUP_QUERY_REF
  );
});

test("affiliate setup route renders merchant-choice pagination from loaded cursors", () => {
  mockedUseLoaderData.mockReturnValue(
    buildReadyLoaderData(AFFILIATE_SETUP_QUERY_DESCRIPTOR, {
      first: 35,
      after: "previous merchant cursor"
    })
  );
  mockedUsePreloadedQuery.mockReturnValue(
    buildAffiliateSetupData({
      hasNextPage: true,
      hasPreviousPage: true,
      endCursor: "next merchant cursor/+"
    }) as never
  );

  renderAffiliateSetupRoute();

  expect(screen.getByRole("link", { name: "First merchants" })).toHaveAttribute(
    "href",
    "/affiliate/setup?first=35"
  );
  expect(screen.getByRole("link", { name: "Next merchants" })).toHaveAttribute(
    "href",
    "/affiliate/setup?first=35&after=next+merchant+cursor%2F%2B"
  );
});

test("affiliate setup route hides merchant-choice pagination without valid destinations", () => {
  mockedUsePreloadedQuery.mockReturnValue(
    buildAffiliateSetupData({
      hasNextPage: true,
      hasPreviousPage: true,
      endCursor: null
    }) as never
  );

  renderAffiliateSetupRoute();

  expect(screen.queryByRole("navigation", { name: "Merchant choice pages" })).not.toBeInTheDocument();
});

test("affiliate setup route suppresses repeated and blank merchant cursors", () => {
  mockedUseLoaderData.mockReturnValue(
    buildReadyLoaderData(AFFILIATE_SETUP_QUERY_DESCRIPTOR, {
      first: 35,
      after: "same-cursor"
    })
  );
  mockedUsePreloadedQuery.mockReturnValue(
    buildAffiliateSetupData({
      hasNextPage: true,
      hasPreviousPage: true,
      endCursor: "same-cursor"
    }) as never
  );

  renderAffiliateSetupRoute();
  expect(screen.getByRole("link", { name: "First merchants" })).toBeVisible();
  expect(screen.queryByRole("link", { name: "Next merchants" })).not.toBeInTheDocument();
});

test("affiliate setup forms preserve submission callbacks and controlled merchant selections", () => {
  const onNetworkSubmit = vi.fn();
  const onProgramSubmit = vi.fn();
  const onLinkSubmit = vi.fn();
  const onCouponSubmit = vi.fn();
  const onAffiliateNetworkIdChange = vi.fn();
  const onSelectedMerchantIdChange = vi.fn();
  const merchantChoices = [
    { id: MERCHANT_ID, name: "Acme Market", domain: "acme.example" },
    { id: SECOND_MERCHANT_ID, name: "Globex Supply", domain: "globex.example" }
  ];

  render(
    <>
      <AffiliateNetworkForm
        error={null}
        onSubmit={onNetworkSubmit}
        pending={false}
        result={null}
      />
      <AffiliateProgramForm
        affiliateNetworkId={NETWORK_ID}
        error={null}
        merchantChoices={merchantChoices}
        onAffiliateNetworkIdChange={onAffiliateNetworkIdChange}
        onSelectedMerchantIdChange={onSelectedMerchantIdChange}
        onSubmit={onProgramSubmit}
        pending={false}
        result={null}
        selectedMerchantCopy="Selected merchant: Acme Market (acme.example)"
        selectedMerchantValue={MERCHANT_ID}
      />
      <AffiliateLinkForm
        error={null}
        onSubmit={onLinkSubmit}
        pending={false}
        result={null}
        selectedMerchantCopy="Selected merchant: Acme Market (acme.example)"
      />
      <AffiliateCouponForm
        error={null}
        merchantChoices={merchantChoices}
        onSelectedMerchantIdChange={onSelectedMerchantIdChange}
        onSubmit={onCouponSubmit}
        pending={false}
        result={null}
        selectedMerchantCopy="Selected merchant: Acme Market (acme.example)"
        selectedMerchantValue={MERCHANT_ID}
      />
    </>
  );

  fireEvent.change(screen.getByLabelText("Affiliate network ID"), {
    target: { value: "new-network-id" }
  });
  chooseSelectOption(screen.getByLabelText("Merchant"), "Globex Supply");
  chooseSelectOption(screen.getByLabelText("Coupon merchant"), "Globex Supply");
  fireEvent.submit(screen.getByRole("form", { name: "Save affiliate network" }));
  fireEvent.submit(screen.getByRole("form", { name: "Save affiliate program" }));
  fireEvent.submit(screen.getByRole("form", { name: "Save affiliate link" }));
  fireEvent.submit(screen.getByRole("form", { name: "Create affiliate coupon" }));

  expect(onAffiliateNetworkIdChange).toHaveBeenCalledWith("new-network-id");
  expect(onSelectedMerchantIdChange).toHaveBeenNthCalledWith(1, SECOND_MERCHANT_ID);
  expect(onSelectedMerchantIdChange).toHaveBeenNthCalledWith(2, SECOND_MERCHANT_ID);
  expect(onNetworkSubmit).toHaveBeenCalledOnce();
  expect(onProgramSubmit).toHaveBeenCalledOnce();
  expect(onLinkSubmit).toHaveBeenCalledOnce();
  expect(onCouponSubmit).toHaveBeenCalledOnce();
});

test("affiliate setup datetime controls use the shared text-field presentation", () => {
  renderAffiliateSetupRoute();

  expect(screen.getByLabelText("Last verified at")).toHaveAttribute(
    "data-slot",
    "text-field"
  );
  expect(screen.getByLabelText("Valid from")).toHaveAttribute("data-slot", "text-field");
  expect(screen.getByLabelText("Valid to")).toHaveAttribute("data-slot", "text-field");
});

test("affiliate setup route renders selected merchant summaries for program, link, and coupon forms", () => {
  renderAffiliateSetupRoute();

  const programForm = screen.getByRole("form", { name: "Save affiliate program" });
  const linkForm = screen.getByRole("form", { name: "Save affiliate link" });
  const couponForm = screen.getByRole("form", { name: "Create affiliate coupon" });

  expect(within(programForm).getByText("Selected merchant: Acme Market (acme.example)")).toBeInTheDocument();
  expect(within(linkForm).getByText("Selected merchant: Acme Market (acme.example)")).toBeInTheDocument();
  expect(within(couponForm).getByText("Selected merchant: Acme Market (acme.example)")).toBeInTheDocument();
});

test("affiliate setup route updates selected merchant context when the program merchant changes", () => {
  renderAffiliateSetupRoute();

  const programForm = screen.getByRole("form", { name: "Save affiliate program" });
  const linkForm = screen.getByRole("form", { name: "Save affiliate link" });
  const couponForm = screen.getByRole("form", { name: "Create affiliate coupon" });

  chooseSelectOption(screen.getByLabelText("Merchant"), "Globex Supply");

  expect(within(programForm).getByText("Selected merchant: Globex Supply (globex.example)")).toBeInTheDocument();
  expect(within(linkForm).getByText("Selected merchant: Globex Supply (globex.example)")).toBeInTheDocument();
  expect(within(couponForm).getByText("Selected merchant: Globex Supply (globex.example)")).toBeInTheDocument();
});

test("affiliate setup route updates selected merchant context when the coupon merchant changes", () => {
  renderAffiliateSetupRoute();

  const programForm = screen.getByRole("form", { name: "Save affiliate program" });
  const linkForm = screen.getByRole("form", { name: "Save affiliate link" });
  const couponForm = screen.getByRole("form", { name: "Create affiliate coupon" });

  chooseSelectOption(screen.getByLabelText("Coupon merchant"), "Globex Supply");

  expect(within(programForm).getByText("Selected merchant: Globex Supply (globex.example)")).toBeInTheDocument();
  expect(within(linkForm).getByText("Selected merchant: Globex Supply (globex.example)")).toBeInTheDocument();
  expect(within(couponForm).getByText("Selected merchant: Globex Supply (globex.example)")).toBeInTheDocument();
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

test("affiliate setup route renders unavailable fallback when merchants payload is missing", () => {
  mockedUsePreloadedQuery.mockReturnValue({ merchants: null } as never);

  renderAffiliateSetupRoute();

  expect(screen.getByRole("alert")).toHaveTextContent("Affiliate setup unavailable.");
  expect(screen.queryByRole("form", { name: "Save affiliate network" })).not.toBeInTheDocument();
});

test("affiliate setup route preserves hook order when merchants payload recovers", () => {
  mockedUsePreloadedQuery
    .mockReturnValueOnce({ merchants: null } as never)
    .mockReturnValue(buildAffiliateSetupData() as never);

  const { rerender } = renderAffiliateSetupRoute();

  expect(screen.getByRole("alert")).toHaveTextContent("Affiliate setup unavailable.");

  rerender(
    <MemoryRouter>
      <AffiliateSetupRoute />
    </MemoryRouter>
  );

  expect(screen.getByRole("form", { name: "Save affiliate network" })).toBeInTheDocument();
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
  chooseSelectOption(screen.getByLabelText("Merchant"), "Globex Supply");
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

test("affiliate setup route commits link upsert and displays the saved link", async () => {
  renderAffiliateSetupRoute();

  fireEvent.change(screen.getByLabelText("Merchant product ID"), {
    target: { value: MERCHANT_PRODUCT_ID }
  });
  fireEvent.change(screen.getByLabelText("Link affiliate network ID"), {
    target: { value: NETWORK_ID }
  });
  fireEvent.change(screen.getByLabelText("Original URL"), {
    target: { value: "https://merchant.example/products/1" }
  });
  fireEvent.change(screen.getByLabelText("Affiliate URL"), {
    target: { value: "https://network.example/track/1" }
  });
  fireEvent.change(screen.getByLabelText("Last verified at"), {
    target: { value: "2026-06-01T12:30" }
  });
  fireEvent.click(screen.getByRole("button", { name: "Save link" }));

  await waitFor(() => {
    expect(commitLinkMutationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          input: {
            merchantProductId: MERCHANT_PRODUCT_ID,
            affiliateNetworkId: NETWORK_ID,
            originalUrl: "https://merchant.example/products/1",
            affiliateUrl: "https://network.example/track/1",
            lastVerifiedAt: new Date("2026-06-01T12:30").toISOString()
          }
        }
      })
    );
  });

  completeLatestLinkMutation({
    upsertAffiliateLink: {
      link: {
        id: LINK_ID,
        merchantProductId: MERCHANT_PRODUCT_ID,
        affiliateNetworkId: NETWORK_ID,
        originalUrl: "https://merchant.example/products/1",
        affiliateUrl: "https://network.example/track/1",
        lastVerifiedAt: new Date("2026-06-01T12:30").toISOString()
      },
      errors: []
    }
  });

  const resultRegion = await screen.findByRole("region", {
    name: "Affiliate link result"
  });

  expect(resultRegion).toHaveTextContent(LINK_ID);
  expect(resultRegion).toHaveTextContent("https://network.example/track/1");
});

test("affiliate setup route renders link payload errors", async () => {
  renderAffiliateSetupRoute();

  fireEvent.change(screen.getByLabelText("Merchant product ID"), {
    target: { value: "not-a-global-id" }
  });
  fireEvent.click(screen.getByRole("button", { name: "Save link" }));

  await waitFor(() => {
    expect(commitLinkMutationMock).toHaveBeenCalledTimes(1);
  });
  completeLatestLinkMutation({
    upsertAffiliateLink: {
      link: null,
      errors: [
        {
          code: "INVALID_ID",
          field: "merchantProductId",
          message: "invalid merchant product id"
        }
      ]
    }
  });

  expect(await screen.findByRole("alert")).toHaveTextContent("invalid merchant product id");
});

test("affiliate setup route commits coupon creation and displays the created coupon", async () => {
  renderAffiliateSetupRoute();

  chooseSelectOption(screen.getByLabelText("Coupon merchant"), "Globex Supply");
  fireEvent.change(screen.getByLabelText("Coupon affiliate network ID"), {
    target: { value: NETWORK_ID }
  });
  fireEvent.change(screen.getByLabelText("Coupon code"), {
    target: { value: "SAVE-20" }
  });
  chooseSelectOption(screen.getByLabelText("Discount type"), "AMOUNT");
  fireEvent.change(screen.getByLabelText("Discount value"), {
    target: { value: "20.00" }
  });
  fireEvent.change(screen.getByLabelText("Currency"), {
    target: { value: "usd" }
  });
  fireEvent.change(screen.getByLabelText("Valid from"), {
    target: { value: "2026-06-01T00:00" }
  });
  fireEvent.change(screen.getByLabelText("Valid to"), {
    target: { value: "2026-06-30T23:59" }
  });
  fireEvent.click(screen.getByRole("button", { name: "Create coupon" }));

  await waitFor(() => {
    expect(commitCouponMutationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          input: expect.objectContaining({
            merchantId: SECOND_MERCHANT_ID,
            affiliateNetworkId: NETWORK_ID,
            code: "SAVE-20",
            discountType: "AMOUNT",
            discountValue: "20.00",
            currency: "USD",
            validFrom: new Date("2026-06-01T00:00").toISOString(),
            validTo: new Date("2026-06-30T23:59").toISOString()
          })
        }
      })
    );
  });

  completeLatestCouponMutation({
    createCoupon: {
      coupon: {
        id: COUPON_ID,
        merchantId: SECOND_MERCHANT_ID,
        affiliateNetworkId: NETWORK_ID,
        code: "SAVE-20",
        discountType: "AMOUNT",
        discountValue: "20.00",
        currency: "USD",
        validFrom: new Date("2026-06-01T00:00").toISOString(),
        validTo: new Date("2026-06-30T23:59").toISOString()
      },
      errors: []
    }
  });

  const resultRegion = await screen.findByRole("region", {
    name: "Coupon result"
  });

  expect(resultRegion).toHaveTextContent(COUPON_ID);
  expect(resultRegion).toHaveTextContent("SAVE-20");
  expect(resultRegion).toHaveTextContent("20.00 USD");
});

test("affiliate setup route displays percent coupon discount details without currency", async () => {
  renderAffiliateSetupRoute();

  fireEvent.change(screen.getByLabelText("Coupon code"), {
    target: { value: "SAVE-20PCT" }
  });
  chooseSelectOption(screen.getByLabelText("Discount type"), "PERCENT");
  fireEvent.change(screen.getByLabelText("Discount value"), {
    target: { value: "20.00" }
  });
  fireEvent.click(screen.getByRole("button", { name: "Create coupon" }));

  await waitFor(() => {
    expect(commitCouponMutationMock).toHaveBeenCalledTimes(1);
  });
  completeLatestCouponMutation({
    createCoupon: {
      coupon: {
        id: COUPON_ID,
        merchantId: MERCHANT_ID,
        affiliateNetworkId: null,
        code: "SAVE-20PCT",
        discountType: "PERCENT",
        discountValue: "20.00",
        currency: null,
        validFrom: null,
        validTo: null
      },
      errors: []
    }
  });

  const resultRegion = await screen.findByRole("region", {
    name: "Coupon result"
  });

  expect(resultRegion).toHaveTextContent("SAVE-20PCT");
  expect(resultRegion).toHaveTextContent("20.00% off");
});

test("affiliate setup route displays other coupon discount details without an amount", async () => {
  renderAffiliateSetupRoute();

  fireEvent.change(screen.getByLabelText("Coupon code"), {
    target: { value: "MEMBER-PERK" }
  });
  fireEvent.click(screen.getByRole("button", { name: "Create coupon" }));

  await waitFor(() => {
    expect(commitCouponMutationMock).toHaveBeenCalledTimes(1);
  });
  completeLatestCouponMutation({
    createCoupon: {
      coupon: {
        id: COUPON_ID,
        merchantId: MERCHANT_ID,
        affiliateNetworkId: null,
        code: "MEMBER-PERK",
        discountType: "OTHER",
        discountValue: null,
        currency: null,
        validFrom: null,
        validTo: null
      },
      errors: []
    }
  });

  const resultRegion = await screen.findByRole("region", {
    name: "Coupon result"
  });

  expect(resultRegion).toHaveTextContent("MEMBER-PERK");
  expect(resultRegion).toHaveTextContent("Other discount");
});

test("affiliate setup route normalizes optional link and coupon inputs", async () => {
  renderAffiliateSetupRoute();

  fireEvent.change(screen.getByLabelText("Merchant product ID"), {
    target: { value: MERCHANT_PRODUCT_ID }
  });
  fireEvent.change(screen.getByLabelText("Original URL"), {
    target: { value: "https://merchant.example/products/optional" }
  });
  fireEvent.change(screen.getByLabelText("Affiliate URL"), {
    target: { value: "https://network.example/optional" }
  });
  fireEvent.click(screen.getByRole("button", { name: "Save link" }));

  await waitFor(() => {
    expect(commitLinkMutationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          input: expect.objectContaining({
            affiliateNetworkId: null,
            lastVerifiedAt: null
          })
        }
      })
    );
  });

  fireEvent.change(screen.getByLabelText("Coupon code"), {
    target: { value: "INFO-ONLY" }
  });
  fireEvent.click(screen.getByRole("button", { name: "Create coupon" }));

  await waitFor(() => {
    expect(commitCouponMutationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          input: expect.objectContaining({
            affiliateNetworkId: null,
            currency: null,
            discountValue: null,
            validFrom: null,
            validTo: null
          })
        }
      })
    );
  });
});

test("affiliate setup route renders coupon payload errors", async () => {
  renderAffiliateSetupRoute();

  fireEvent.change(screen.getByLabelText("Coupon code"), {
    target: { value: "INVALID-SHAPE" }
  });
  fireEvent.change(screen.getByLabelText("Discount value"), {
    target: { value: "10.00" }
  });
  fireEvent.click(screen.getByRole("button", { name: "Create coupon" }));

  await waitFor(() => {
    expect(commitCouponMutationMock).toHaveBeenCalledTimes(1);
  });
  completeLatestCouponMutation({
    createCoupon: {
      coupon: null,
      errors: [
        {
          code: "INVALID_ARGUMENT",
          field: "discountValue",
          message: "must be empty for other discounts"
        }
      ]
    }
  });

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "must be empty for other discounts"
  );
});

function completeLatestNetworkMutation(response: unknown) {
  act(() => {
    commitNetworkMutationMock.mock.calls.at(-1)?.[0]?.onCompleted?.(response, null);
  });
}

function completeLatestProgramMutation(response: unknown) {
  act(() => {
    commitProgramMutationMock.mock.calls.at(-1)?.[0]?.onCompleted?.(response, null);
  });
}

function completeLatestLinkMutation(response: unknown) {
  act(() => {
    commitLinkMutationMock.mock.calls.at(-1)?.[0]?.onCompleted?.(response, null);
  });
}

function completeLatestCouponMutation(response: unknown) {
  act(() => {
    commitCouponMutationMock.mock.calls.at(-1)?.[0]?.onCompleted?.(response, null);
  });
}

function renderAffiliateSetupRoute() {
  return render(
    <MemoryRouter>
      <AffiliateSetupRoute />
    </MemoryRouter>
  );
}

function buildReadyLoaderData(
  merchantQuery = AFFILIATE_SETUP_QUERY_DESCRIPTOR,
  merchantPagination: Extract<
    AffiliateSetupLoaderData,
    { status: "ready" }
  >["merchantPagination"] = { first: 20, after: null }
): AffiliateSetupLoaderData {
  return {
    status: "ready",
    merchantPagination,
    merchantQuery
  };
}

function buildAffiliateSetupData({
  merchants = [
    { id: MERCHANT_ID, name: "Acme Market", domain: "acme.example" },
    { id: SECOND_MERCHANT_ID, name: "Globex Supply", domain: "globex.example" }
  ],
  hasNextPage = false,
  hasPreviousPage = false,
  endCursor = merchants.length > 0 ? `merchant-cursor-${merchants.length - 1}` : null
}: {
  endCursor?: string | null;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  merchants?: Array<{ id: string; name: string; domain: string }>;
} = {}) {
  return {
    merchants: {
      edges: merchants.map((merchant, index) => ({
        cursor: `merchant-cursor-${index}`,
        node: merchant
      })),
      pageInfo: {
        hasNextPage,
        hasPreviousPage,
        startCursor: merchants.length > 0 ? "merchant-cursor-0" : null,
        endCursor
      }
    }
  };
}
