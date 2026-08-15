import type { MerchantDirectoryView_item$data } from "$generated/MerchantDirectoryView_item.graphql";
import type { MerchantDirectoryView_merchants$data } from "$generated/MerchantDirectoryView_merchants.graphql";
import { externalWebsiteHref } from "$frontend/navigation/external-links";

export function buildMerchantDirectoryRows(merchants: readonly MerchantDirectoryView_item$data[]) {
  return merchants.map((merchant) => ({
    detailHref: `/merchants/${encodeURIComponent(merchant.slug)}`,
    domain: merchant.domain,
    id: merchant.id,
    name: merchant.name,
    websiteHref: externalWebsiteHref(merchant.domain),
  }));
}

export function getMerchantDirectoryViewData(
  merchants: readonly MerchantDirectoryView_merchants$data["edges"][number]["node"][],
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
