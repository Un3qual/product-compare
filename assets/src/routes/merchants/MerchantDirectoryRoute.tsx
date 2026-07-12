import { Suspense, useId, useState } from "react";
import { create, props } from "@stylexjs/stylex";
import { useLoaderData } from "react-router-dom";
import { usePreloadedQuery } from "react-relay";
import merchantDirectoryRouteQuery, {
  type MerchantDirectoryRouteQuery
} from "../../__generated__/MerchantDirectoryRouteQuery.graphql";
import { useRoutePreloadedQuery } from "../../relay/route-preload";
import { ResettableErrorBoundary } from "../../relay/ResettableErrorBoundary";
import { DataList, DataListItem } from "../../ui/components/data/DataList";
import { FeedbackState } from "../../ui/components/feedback/FeedbackState";
import { ContextRail } from "../../ui/components/layout/ContextRail";
import { PageShell } from "../../ui/components/layout/PageShell";
import { SectionHeading } from "../../ui/components/layout/SectionHeading";
import { WorkspaceLayout } from "../../ui/components/layout/WorkspaceLayout";
import { Pagination } from "../../ui/components/navigation/Pagination";
import { Button } from "../../ui/primitives/Button";
import { Label } from "../../ui/primitives/Label";
import { TextField } from "../../ui/primitives/TextField";
import { tokens } from "../../ui/theme/tokens.stylex";
import { externalWebsiteHref } from "../external-links";
import {
  merchantDirectoryLoader,
  type MerchantDirectoryLoaderData,
  type MerchantDirectoryPagination
} from "./loader";
import { merchantDirectoryPagePath } from "./pagination";

type MerchantDirectoryConnection = NonNullable<
  MerchantDirectoryRouteQuery["response"]["merchants"]
>;

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

export function MerchantDirectoryRoute() {
  const loaderData = useLoaderData<typeof merchantDirectoryLoader>() as MerchantDirectoryLoaderData;

  return (
    <PageShell
      description="Browse the merchants represented in current product and offer data."
      eyebrow="Seller directory"
      title="Merchants"
    >
      {loaderData.status === "error" ? (
        <MerchantDirectoryUnavailableFallback />
      ) : (
        <MerchantDirectoryContent loaderData={loaderData} />
      )}
    </PageShell>
  );
}

function MerchantDirectoryContent({
  loaderData
}: {
  loaderData: Extract<MerchantDirectoryLoaderData, { status: "ready" }>;
}) {
  return (
    <WorkspaceLayout
      context={
        <ContextRail
          description="Adjust how many merchants appear in the current result page."
          label="Merchant controls"
        >
          <MerchantDirectoryControls pagination={loaderData.pagination} />
        </ContextRail>
      }
      label="Merchant results"
    >
      <ResettableErrorBoundary
        fallback={<MerchantDirectoryUnavailableFallback />}
        resetToken={loaderData.query}
      >
        <Suspense fallback={<p role="status">Loading merchants...</p>}>
          <MerchantDirectoryPanel
            pagination={loaderData.pagination}
            query={loaderData.query}
          />
        </Suspense>
      </ResettableErrorBoundary>
    </WorkspaceLayout>
  );
}

function MerchantDirectoryControls({
  pagination
}: {
  pagination: MerchantDirectoryPagination;
}) {
  return (
    <form action="/merchants" method="get" {...props(styles.controls)}>
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

function MerchantDirectoryPanel({
  pagination,
  query
}: {
  pagination: MerchantDirectoryPagination;
  query: Extract<MerchantDirectoryLoaderData, { status: "ready" }>["query"];
}) {
  const queryRef = useRoutePreloadedQuery<MerchantDirectoryRouteQuery>(
    merchantDirectoryRouteQuery,
    query
  );
  const data = usePreloadedQuery<MerchantDirectoryRouteQuery>(
    merchantDirectoryRouteQuery,
    queryRef
  );

  if (!data.merchants) {
    return <MerchantDirectoryUnavailableFallback />;
  }

  return <MerchantDirectoryList connection={data.merchants} pagination={pagination} />;
}

function MerchantDirectoryList({
  connection,
  pagination
}: {
  connection: MerchantDirectoryConnection;
  pagination: MerchantDirectoryPagination;
}) {
  const [filterText, setFilterText] = useState("");
  const filterInputId = useId();
  const merchants = connection.edges.map(({ node }) => node);

  if (merchants.length === 0) {
    return <FeedbackState kind="empty" title="No merchants available yet." />;
  }

  const normalizedFilterText = filterText.trim().toLowerCase();
  const visibleMerchants = normalizedFilterText
    ? merchants.filter((merchant) =>
        merchant.name.toLowerCase().includes(normalizedFilterText)
      )
    : merchants;

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
      <Label htmlFor={filterInputId} {...props(styles.filter)}>
        Filter merchants on this page
        <TextField
          autoComplete="off"
          id={filterInputId}
          onChange={(event) => setFilterText(event.currentTarget.value)}
          type="search"
          value={filterText}
        />
      </Label>
      {visibleMerchants.length === 0 ? (
        <p>No merchants on this page match this filter.</p>
      ) : (
        <DataList label="Merchants">
          {visibleMerchants.map((merchant) => (
            <MerchantListItem key={merchant.id} merchant={merchant} />
          ))}
        </DataList>
      )}
      <Pagination
        firstHref={
          connection.pageInfo.hasPreviousPage && pagination.after
            ? merchantDirectoryPagePath(pagination)
            : null
        }
        firstLabel="First merchants"
        label="Merchant pages"
        nextHref={
          connection.pageInfo.hasNextPage && connection.pageInfo.endCursor
            ? merchantDirectoryPagePath(pagination, connection.pageInfo.endCursor)
            : null
        }
        nextLabel="Next merchants"
      />
    </>
  );
}

function MerchantListItem({
  merchant
}: {
  merchant: MerchantDirectoryConnection["edges"][number]["node"];
}) {
  const websiteHref = externalWebsiteHref(merchant.domain);

  return (
    <DataListItem
      actions={
        websiteHref ? (
          <Button asChild variant="soft">
            <a href={websiteHref} target="_blank" rel="noopener noreferrer">
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

function MerchantDirectoryUnavailableFallback() {
  return (
    <FeedbackState kind="error" title="Merchant directory unavailable." />
  );
}
