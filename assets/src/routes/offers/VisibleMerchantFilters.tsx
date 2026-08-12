import { create, props } from "@stylexjs/stylex";
import { Link } from "react-router-dom";
import { tokens } from "$ui/theme/tokens.stylex";
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
    alignContent: "start",
    display: "grid",
    gap: "0.6rem",
    paddingBlockEnd: "1rem",
  },
  heading: {
    fontSize: "0.82rem",
    letterSpacing: "0.04em",
    margin: 0,
    textTransform: "uppercase",
  },
  activeSummary: {
    color: tokens.textSecondary,
    margin: 0,
  },
  filterList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.5rem",
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  filterLink: {
    alignItems: "center",
    color: tokens.actionAccent,
    display: "inline-flex",
    fontWeight: 700,
    minHeight: tokens.controlHeight,
    textDecoration: "none",
    textDecorationLine: { ":hover": "underline", default: "none" },
    textUnderlineOffset: "0.2em",
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
    <section
      aria-label="Merchant filters on this page"
      data-slot="offer-merchant-filters"
      {...props(styles.filterSection)}
    >
      <h2 {...props(styles.heading)}>Merchants on this page</h2>
      <ActiveMerchantFilterSummary merchant={activeMerchant} />
      <VisibleMerchantFilterLinks filters={filters} merchants={filterableMerchants} />
    </section>
  );
}

function ActiveMerchantFilterSummary({ merchant }: { merchant: VisibleMerchant | null }) {
  return merchant ? <p {...props(styles.activeSummary)}>{`Filtered to ${merchant.name}`}</p> : null;
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
    <ul {...props(styles.filterList)}>
      {merchants.map((merchant) => (
        <li key={merchant.id}>
          <Link
            aria-label={`Filter to ${merchant.name}`}
            to={offerDiscoveryPath({ ...filters, merchantId: merchant.id }, null)}
            {...props(styles.filterLink)}
          >
            {merchant.name}&nbsp;<span aria-hidden="true">→</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
