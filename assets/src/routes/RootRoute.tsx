import { usePreloadedQuery } from "react-relay";
import { Outlet, useLoaderData, useOutletContext } from "react-router-dom";
import rootViewerRouteQuery, {
  type RootViewerRouteQuery
} from "../__generated__/RootViewerRouteQuery.graphql";
import { useRoutePreloadedQuery } from "../relay/route-preload";
import { AppShell } from "../ui/components/layout/AppShell";
import { PageShell } from "../ui/components/layout/PageShell";
import { AppProviders } from "../ui/providers/AppProviders";
import { RootHomeDestinations, RootPrimaryNavigation } from "./RootDestinations";
import { RouteMetadata } from "./RouteMetadata";
import type { RootLoaderData, RootViewer } from "./root/loader";

type RootOutletContext = {
  viewer: RootViewer | null;
};

export function RootLayout() {
  const loaderData = useLoaderData() as RootLoaderData;

  if (loaderData.status === "degraded") {
    return <RootLayoutShell viewer={loaderData.viewer} />;
  }

  return <ReadyRootLayout loaderData={loaderData} />;
}

function ReadyRootLayout({
  loaderData
}: {
  loaderData: Extract<RootLoaderData, { status: "ready" }>;
}) {
  const queryRef = useRoutePreloadedQuery<RootViewerRouteQuery>(
    rootViewerRouteQuery,
    loaderData.viewerQuery
  );
  const data = usePreloadedQuery<RootViewerRouteQuery>(rootViewerRouteQuery, queryRef);

  return <RootLayoutShell viewer={rootViewerFromQuery(data.viewer)} />;
}

function RootLayoutShell({ viewer }: RootOutletContext) {
  return (
    <>
      <RouteMetadata />
      <AppProviders>
        <AppShell navigation={<RootPrimaryNavigation viewer={viewer} />}>
          <Outlet context={{ viewer }} />
        </AppShell>
      </AppProviders>
    </>
  );
}

export function RootRoute() {
  const { viewer } = useOutletContext<RootOutletContext>();

  return (
    <PageShell
      description="Find products, compare specifications, and review current offers before you choose what to buy."
      eyebrow="A clearer path to the right product"
      title="Product Compare"
      width="reading"
    >
      <RootHomeDestinations viewer={viewer} />
    </PageShell>
  );
}

function rootViewerFromQuery(
  viewer: RootViewerRouteQuery["response"]["viewer"]
): RootViewer | null {
  if (!viewer) {
    return null;
  }

  return {
    id: viewer.id,
    email: viewer.email
  };
}
