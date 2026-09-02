import { useId, useState } from "react";
import { create, props } from "@stylexjs/stylex";
import { Link } from "react-router";
import { graphql, useFragment } from "react-relay";
import type { MerchantDirectoryView_item$key } from "$generated/MerchantDirectoryView_item.graphql";
import type { MerchantDirectoryView_merchants$key } from "$generated/MerchantDirectoryView_merchants.graphql";
import { DataList, DataListItem } from "$ui/components/data/DataList";
import { FeedbackState } from "$ui/components/feedback/FeedbackState";
import { SectionHeading } from "$ui/components/layout/SectionHeading";
import { Pagination } from "$ui/components/navigation/Pagination";
import { Button } from "$ui/primitives/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "$ui/primitives/Select";
import { Input } from "$ui/primitives/Input";
import { Label } from "$ui/primitives/Label";
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
  link: {
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
        <Input
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
  const options = [20, 35, 50].map((size) => ({
    label: String(size),
    value: String(size),
  }));

  return (
    <form action={formAction} method="get" {...props(styles.controls)}>
      <Label>
        Page size
        <Select items={options} key={pageSize} name="first" defaultValue={String(pageSize)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Label>
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
        row.websiteHref ? (
          <a
            href={row.websiteHref}
            target="_blank"
            rel="noopener noreferrer"
            {...props(styles.link)}
          >
            Visit merchant website&nbsp;<span aria-hidden="true">↗</span>
          </a>
        ) : null
      }
    >
      <div {...props(styles.merchant)}>
        <h2 {...props(styles.name)}>
          <Link to={row.detailHref} {...props(styles.link)}>
            {row.name}
          </Link>
        </h2>
        <p {...props(styles.domain)}>{row.domain}</p>
      </div>
    </DataListItem>
  );
}
