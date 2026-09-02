import type { Route } from "./+types/NotFoundRoute";
import { routeMetaDescriptors } from "$frontend/seo";
import { RouteErrorBoundary } from "$routes/compare/RouteErrorBoundary";

export function meta() {
  return routeMetaDescriptors({
    title: "Page not found | Product Compare",
    description: "The requested Product Compare page could not be found.",
  });
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <RouteErrorBoundary error={error} resourceName="page" title="Page not found" />;
}

export function notFoundLoader(): never {
  throw new Response("Not found", {
    status: 404,
    statusText: "Not Found",
  });
}

export { notFoundLoader as loader };
