import { useId, useState } from "react";
import { create, props } from "@stylexjs/stylex";
import { DataList, DataListItem } from "../../ui/components/data/DataList";
import { FeedbackState } from "../../ui/components/feedback/FeedbackState";
import { SectionHeading } from "../../ui/components/layout/SectionHeading";
import { Pagination } from "../../ui/components/navigation/Pagination";
import { Button } from "../../ui/primitives/Button";
import { TextField } from "../../ui/primitives/TextField";
import { tokens } from "../../ui/theme/tokens.stylex";
import type { MerchantDirectoryPagination } from "./loader";

const styles = create({
  controls: {
    alignItems: "stretch",
    display: "grid",
    gap: "0.75rem",
    gridTemplateColumns: "minmax(0, 1fr)"
  },
  filter: {
    display: "grid",
    gap: "0.35rem",
    maxWidth: "24rem"
  },
  merchant: {
    display: "grid",
    gap: "0.45rem"
  },
  name: {
    fontSize: "1.25rem",
    letterSpacing: "-0.02em",
    margin: 0
  },
  domain: {
    color: tokens.textSecondary,
    margin: 0
  }
});

export type MerchantDirectoryViewMerchant = {
  domain: string;
  id: string;
  name: string;
  websiteHref: string | null;
};

export type MerchantDirectoryViewProps = {
  firstHref: string | null;
  merchants: MerchantDirectoryViewMerchant[];
  nextHref: string | null;
};

export type MerchantDirectoryControlsProps = {
  formAction: string;
  pagination: MerchantDirectoryPagination;
};

export function MerchantDirectoryView({
  firstHref,
  merchants,
  nextHref
}: MerchantDirectoryViewProps) {
  const [filterText, setFilterText] = useState("");
  const filterInputId = useId();
  const filterLabelId = `${filterInputId}-label`;
  const normalizedFilterText = filterText.trim().toLowerCase();
  const visibleMerchants = normalizedFilterText
    ? merchants.filter((merchant) =>
        merchant.name.toLowerCase().includes(normalizedFilterText)
      )
    : merchants;

  if (merchants.length === 0) {
    return <FeedbackState kind="empty" title="No merchants available yet." />;
  }

  return (
    <>
      <SectionHeading
        description="Merchant names and destination domains for this result page."
        title={
          normalizedFilterText
            ? `${visibleMerchants.length} of ${merchants.length} merchants shown`
            : `${merchants.length} merchants on this page`
        }
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
  pagination
}: MerchantDirectoryControlsProps) {
  return (
    <form action={formAction} method="get" {...props(styles.controls)}>
      <label>
        Page size
        <select key={pagination.first} name="first" defaultValue={String(pagination.first)}>
          <option value="20">20</option>
          <option value="35">35</option>
          <option value="50">50</option>
        </select>
      </label>
      <Button type="submit">Apply</Button>
    </form>
  );
}

function MerchantDirectoryViewItem({ merchant }: { merchant: MerchantDirectoryViewMerchant }) {
  return (
    <DataListItem
      actions={
        merchant.websiteHref ? (
          <Button asChild variant="soft">
            <a href={merchant.websiteHref} target="_blank" rel="noopener noreferrer">
              Visit merchant website
            </a>
          </Button>
        ) : null
      }
    >
      <div {...props(styles.merchant)}>
        <h2 {...props(styles.name)}>{merchant.name}</h2>
        <p {...props(styles.domain)}>{merchant.domain}</p>
      </div>
    </DataListItem>
  );
}
