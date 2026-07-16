export type MerchantDirectoryViewDataMerchant = {
  name: string;
};

export function getMerchantDirectoryViewData<T extends MerchantDirectoryViewDataMerchant>(
  merchants: readonly T[],
  filterText: string
) {
  const normalizedFilterText = filterText.trim().toLowerCase();
  const visibleMerchants = normalizedFilterText
    ? merchants.filter((merchant) => merchant.name.toLowerCase().includes(normalizedFilterText))
    : merchants;

  return {
    heading: normalizedFilterText
      ? `${visibleMerchants.length} of ${merchants.length} merchants shown`
      : `${merchants.length} merchants on this page`,
    visibleMerchants
  };
}
