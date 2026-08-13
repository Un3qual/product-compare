import type { MerchantDirectoryView_item$data } from "$generated/MerchantDirectoryView_item.graphql";
import { externalWebsiteHref } from "$frontend/navigation/external-links";

export type MerchantDirectoryViewDataMerchant = {
  name: string;
};

export type MerchantDirectoryResultNode = Omit<MerchantDirectoryView_item$data, " $fragmentType">;

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
