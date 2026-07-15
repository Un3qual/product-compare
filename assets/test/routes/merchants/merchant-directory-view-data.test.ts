import { getMerchantDirectoryViewData } from "../../../src/routes/merchants/merchant-directory-view-data";

const MERCHANTS = [
  { id: "merchant-1", name: "Acme Market" },
  { id: "merchant-2", name: "Globex Supply" },
  { id: "merchant-3", name: "Acme Outlet" }
] as const;

test("returns every merchant and the page heading for blank or whitespace-only filters", () => {
  expect(getMerchantDirectoryViewData(MERCHANTS, "   ")).toEqual({
    heading: "3 merchants on this page",
    normalizedFilterText: "",
    visibleMerchants: MERCHANTS
  });
});

test("filters names case-insensitively after trimming while preserving source order", () => {
  const data = getMerchantDirectoryViewData(MERCHANTS, "  AcMe ");

  expect(data.normalizedFilterText).toBe("acme");
  expect(data.visibleMerchants).toEqual([MERCHANTS[0], MERCHANTS[2]]);
  expect(data.heading).toBe("2 of 3 merchants shown");
});

test("returns the existing filtered heading when no merchant names match", () => {
  expect(getMerchantDirectoryViewData(MERCHANTS, "missing")).toEqual({
    heading: "0 of 3 merchants shown",
    normalizedFilterText: "missing",
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
