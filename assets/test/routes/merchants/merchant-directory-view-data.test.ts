import {
  buildMerchantDirectoryRows,
  getMerchantDirectoryViewData
} from "../../../src/routes/merchants/merchant-directory-view-data";

const MERCHANTS = [
  { id: "merchant-1", name: "Acme Market" },
  { id: "merchant-2", name: "Globex Supply" },
  { id: "merchant-3", name: "Acme Outlet" }
] as const;

test("projects merchant rows in source order with encoded details and safe destinations", () => {
  const merchants = [
    {
      id: "merchant-1",
      name: "Acme Market",
      domain: "acme.example",
      slug: "acme / outlet?"
    },
    {
      id: "merchant-2",
      name: "Unsafe Seller",
      domain: "http://127.0.0.1/private",
      slug: "unsafe-seller"
    }
  ] as const;

  expect(buildMerchantDirectoryRows(merchants)).toEqual([
    {
      id: "merchant-1",
      name: "Acme Market",
      domain: "acme.example",
      detailHref: "/merchants/acme%20%2F%20outlet%3F",
      websiteHref: "https://acme.example"
    },
    {
      id: "merchant-2",
      name: "Unsafe Seller",
      domain: "http://127.0.0.1/private",
      detailHref: "/merchants/unsafe-seller",
      websiteHref: null
    }
  ]);
});

test("leaves merchant result nodes unchanged while projecting rows", () => {
  const merchants = [
    {
      id: "merchant-1",
      name: "Acme Market",
      domain: "acme.example",
      slug: "acme"
    }
  ];
  const original = structuredClone(merchants);

  buildMerchantDirectoryRows(merchants);

  expect(merchants).toEqual(original);
});

test("returns every merchant and the page heading for blank or whitespace-only filters", () => {
  expect(getMerchantDirectoryViewData(MERCHANTS, "   ")).toEqual({
    heading: "3 merchants on this page",
    visibleMerchants: MERCHANTS
  });
});

test("filters names case-insensitively after trimming while preserving source order", () => {
  const data = getMerchantDirectoryViewData(MERCHANTS, "  AcMe ");

  expect(data.visibleMerchants).toEqual([MERCHANTS[0], MERCHANTS[2]]);
  expect(data.heading).toBe("2 of 3 merchants shown");
});

test("returns the existing filtered heading when no merchant names match", () => {
  expect(getMerchantDirectoryViewData(MERCHANTS, "missing")).toEqual({
    heading: "0 of 3 merchants shown",
    visibleMerchants: []
  });
});

test("leaves merchant records and the input array unchanged", () => {
  const merchants = [
    { id: "merchant-1", name: "Acme Market" },
    { id: "merchant-2", name: "Globex Supply" }
  ];
  const originalMerchants = [...merchants];
  const originalRecords = merchants.map((merchant) => ({ ...merchant }));

  const data = getMerchantDirectoryViewData(merchants, "acme");

  expect(merchants).toEqual(originalRecords);
  expect(merchants).toEqual(originalMerchants);
  expect(data.visibleMerchants[0]).toBe(merchants[0]);
});
