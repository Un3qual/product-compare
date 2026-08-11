import { create, props } from "@stylexjs/stylex";
import { Link } from "react-router-dom";
import {
  activeVisibleMerchant,
  visibleMerchants,
  type RenderableOffer,
  type VisibleMerchant,
} from "./offer-discovery-data";
import type { OfferDiscoveryFilters } from "./offer-discovery-filter-data";
import { offerDiscoveryPath } from "./paths";

const styles = create({
  filterSection: {
    display: "grid",
    gap: "0.75rem",
  },
});

export function VisibleMerchantFilters({
  filters,
  offers,
}: {
  filters: OfferDiscoveryFilters;
  offers: ReadonlyArray<RenderableOffer>;
}) {
  const merchants = visibleMerchants(offers);
  const activeMerchant = activeVisibleMerchant(filters.merchantId, merchants);
  const filterableMerchants = merchants.filter((merchant) => merchant.id !== filters.merchantId);

  if (!activeMerchant && filterableMerchants.length === 0) {
    return null;
  }

  return (
    <section aria-label="Merchant filters on this page" {...props(styles.filterSection)}>
      <ActiveMerchantFilterSummary merchant={activeMerchant} />
      <VisibleMerchantFilterLinks filters={filters} merchants={filterableMerchants} />
    </section>
  );
}

function ActiveMerchantFilterSummary({ merchant }: { merchant: VisibleMerchant | null }) {
  return merchant ? <p>{`Filtered to ${merchant.name}`}</p> : null;
}

function VisibleMerchantFilterLinks({
  filters,
  merchants,
}: {
  filters: OfferDiscoveryFilters;
  merchants: ReadonlyArray<VisibleMerchant>;
}) {
  if (merchants.length === 0) {
    return null;
  }

  return (
    <ul>
      {merchants.map((merchant) => (
        <li key={merchant.id}>
          <Link to={offerDiscoveryPath({ ...filters, merchantId: merchant.id }, null)}>
            {`Filter to ${merchant.name}`}
          </Link>
        </li>
      ))}
    </ul>
  );
}
