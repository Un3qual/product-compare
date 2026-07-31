import { externalWebsiteHref } from "../external-links";

export type MerchantDirectoryViewDataMerchant = {
  name: string;
};

export type MerchantDirectoryResultNode = {
  readonly domain: string;
  readonly id: string;
  readonly name: string;
  readonly slug: string;
};

export function buildMerchantDirectoryRows(merchants: readonly MerchantDirectoryResultNode[]) {
  return merchants.map((merchant) => ({
    detailHref: `/merchants/${encodeURIComponent(merchant.slug)}`,
    domain: merchant.domain,
    id: merchant.id,
    name: merchant.name,
    websiteHref: externalWebsiteHref(merchant.domain),
  }));
}

export function getMerchantDirectoryViewData<T extends MerchantDirectoryViewDataMerchant>(
  merchants: readonly T[],
  filterText: string,
) {
  const normalizedFilterText = filterText.trim().toLowerCase();
  const visibleMerchants = normalizedFilterText
    ? merchants.filter((merchant) => merchant.name.toLowerCase().includes(normalizedFilterText))
    : merchants;

  return {
    heading: normalizedFilterText
      ? `${visibleMerchants.length} of ${merchants.length} merchants shown`
      : `${merchants.length} merchants on this page`,
    visibleMerchants,
  };
}
