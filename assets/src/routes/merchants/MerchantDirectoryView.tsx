import { useId, useState } from "react";
import { create, props } from "@stylexjs/stylex";
import { Link } from "react-router-dom";
import { graphql, useFragment } from "react-relay";
import type { MerchantDirectoryView_item$key } from "$generated/MerchantDirectoryView_item.graphql";
import type { MerchantDirectoryView_merchants$key } from "$generated/MerchantDirectoryView_merchants.graphql";
import { DataList, DataListItem } from "$ui/components/data/DataList";
import { FeedbackState } from "$ui/components/feedback/FeedbackState";
import { SectionHeading } from "$ui/components/layout/SectionHeading";
import { Pagination } from "$ui/components/navigation/Pagination";
import { Button } from "$ui/primitives/Button";
import { Select } from "$ui/primitives/Select";
import { TextField } from "$ui/primitives/TextField";
import { tokens } from "$ui/theme/tokens.stylex";
import {
  buildMerchantDirectoryRows,
  getMerchantDirectoryViewData,
} from "./merchant-directory-view-data";

const merchantDirectoryViewFragment = graphql`
  fragment MerchantDirectoryView_merchants on MerchantConnection {
    edges {
      node {
        id
        name
        ...MerchantDirectoryView_item
      }
    }
  }
`;

const merchantDirectoryViewItemFragment = graphql`
  fragment MerchantDirectoryView_item on Merchant {
    id
    name
    domain
    slug
  }
`;

const styles = create({
  controls: {
    alignItems: "stretch",
    display: "grid",
    gap: "0.75rem",
    gridTemplateColumns: "minmax(0, 1fr)",
  },
  filter: { display: "grid", gap: "0.35rem", maxWidth: "24rem" },
  merchant: { display: "grid", gap: "0.45rem" },
  name: { fontSize: "1.25rem", letterSpacing: "-0.02em", margin: 0 },
  domain: { color: tokens.textSecondary, margin: 0 },
});

type MerchantDirectoryViewProps = {
  firstHref: string | null;
  merchants: MerchantDirectoryView_merchants$key;
  nextHref: string | null;
};

type MerchantDirectoryControlsProps = {
  formAction: string;
  pageSize: number;
};

export function MerchantDirectoryView({
  firstHref,
  merchants,
  nextHref,
}: MerchantDirectoryViewProps) {
  const data = useFragment(merchantDirectoryViewFragment, merchants);
  const [filterText, setFilterText] = useState("");
  const filterInputId = useId();
  const filterLabelId = `${filterInputId}-label`;
  const merchantRefs = data.edges.map(({ node }) => node);
  const { heading, visibleMerchants } = getMerchantDirectoryViewData(merchantRefs, filterText);

  if (merchantRefs.length === 0) {
    return <FeedbackState kind="empty" title="No merchants available yet." />;
  }

  return (
    <>
      <SectionHeading
        description="Merchant names and destination domains for this result page."
        title={heading}
      />
      <div {...props(styles.filter)}>
        <span id={filterLabelId}>Filter merchants on this page</span>
        <TextField
          aria-labelledby={filterLabelId}
          autoComplete="off"
          id={filterInputId}
          onChange={(event) => setFilterText(event.currentTarget.value)}
          type="search"
          value={filterText}
        />
      </div>
      {visibleMerchants.length === 0 ? (
        <p>No merchants on this page match this filter.</p>
      ) : (
        <DataList label="Merchants">
          {visibleMerchants.map((merchant) => (
            <MerchantDirectoryViewItem key={merchant.id} merchant={merchant} />
          ))}
        </DataList>
      )}
      <Pagination
        firstHref={firstHref}
        firstLabel="First merchants"
        label="Merchant pages"
        nextHref={nextHref}
        nextLabel="Next merchants"
      />
    </>
  );
}

export function MerchantDirectoryControls({
  formAction,
  pageSize,
}: MerchantDirectoryControlsProps) {
  return (
    <form action={formAction} method="get" {...props(styles.controls)}>
      <label>
        Page size
        <Select
          key={pageSize}
          name="first"
          defaultValue={String(pageSize)}
          options={[20, 35, 50].map((size) => ({ label: String(size), value: String(size) }))}
        />
      </label>
      <Button type="submit">Apply</Button>
    </form>
  );
}

function MerchantDirectoryViewItem({ merchant }: { merchant: MerchantDirectoryView_item$key }) {
  const data = useFragment(merchantDirectoryViewItemFragment, merchant);
  const [row] = buildMerchantDirectoryRows([data]);
  if (!row) return null;

  return (
    <DataListItem
      actions={
        <>
          <Button asChild variant="soft">
            <Link to={row.detailHref}>View merchant details</Link>
          </Button>
          {row.websiteHref ? (
            <Button asChild variant="soft">
              <a href={row.websiteHref} target="_blank" rel="noopener noreferrer">
                Visit merchant website
              </a>
            </Button>
          ) : null}
        </>
      }
    >
      <div {...props(styles.merchant)}>
        <h2 {...props(styles.name)}>
          <Link to={row.detailHref}>{row.name}</Link>
        </h2>
        <p {...props(styles.domain)}>{row.domain}</p>
      </div>
    </DataListItem>
  );
}
