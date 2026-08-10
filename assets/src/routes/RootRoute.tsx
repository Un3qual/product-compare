import { usePreloadedQuery } from "react-relay";
import { Outlet, useLoaderData } from "react-router-dom";
import rootViewerRouteQuery, {
  type RootViewerRouteQuery,
} from "../__generated__/RootViewerRouteQuery.graphql";
import { useRoutePreloadedQuery } from "../relay/route-preload";
import { AppShell } from "../ui/components/layout/AppShell";
import { AppProviders } from "../ui/providers/AppProviders";
import { RootPrimaryNavigation } from "./RootDestinations";
import { RouteMetadata } from "./RouteMetadata";
import type { RootLoaderData } from "./root/loader";
import { projectRootViewer, type RootViewer } from "./root/viewer-data";

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
  loaderData,
}: {
  loaderData: Extract<RootLoaderData, { status: "ready" }>;
}) {
  const queryRef = useRoutePreloadedQuery<RootViewerRouteQuery>(
    rootViewerRouteQuery,
    loaderData.viewerQuery,
  );
  const data = usePreloadedQuery<RootViewerRouteQuery>(rootViewerRouteQuery, queryRef);

  return <RootLayoutShell viewer={projectRootViewer(data.viewer)} />;
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
