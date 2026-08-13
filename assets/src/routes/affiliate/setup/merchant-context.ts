import type { AffiliateSetupRouteQuery } from "$generated/AffiliateSetupRouteQuery.graphql";

type MerchantConnection = NonNullable<AffiliateSetupRouteQuery["response"]["merchants"]>;
type MerchantNode = MerchantConnection["edges"][number]["node"];
export type MerchantChoice = Pick<MerchantNode, "domain" | "id" | "name">;
type MerchantChoiceConnection = {
  readonly edges: readonly { readonly node: MerchantChoice }[];
};

export function buildMerchantChoices(merchants: MerchantChoiceConnection | null) {
  if (!merchants) {
    return [];
  }

  return merchants.edges.map(({ node }) => ({
    id: node.id,
    name: node.name,
    domain: node.domain,
  }));
}

export function getMerchantChoiceById(
  merchantChoices: readonly MerchantChoice[],
  merchantId: string,
) {
  return merchantChoices.find((merchant) => merchant.id === merchantId);
}

export function getMerchantSummary(merchantChoice?: MerchantChoice) {
  return merchantChoice ? `${merchantChoice.name} (${merchantChoice.domain})` : null;
}

export function getAffiliateMerchantContext(
  merchantChoices: readonly MerchantChoice[],
  selectedMerchantId: string,
) {
  const selectedMerchant =
    getMerchantChoiceById(merchantChoices, selectedMerchantId) ?? merchantChoices[0];
  const summary = getMerchantSummary(selectedMerchant);

  return {
    currentMerchantCopy: summary ? `Current merchant: ${summary}` : null,
    selectedMerchantCopy: summary ? `Selected merchant: ${summary}` : null,
    selectedMerchantValue: selectedMerchant?.id ?? "",
  };
}
