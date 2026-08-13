import type { RouteObject } from "react-router-dom";
import { routeMetadata } from "../../frontend/head";
import { RouteErrorBoundary } from "../compare/RouteErrorBoundary";
import { withLazyRouteImportRecovery } from "./lazy-route";

export const shopperRoutes: RouteObject[] = [
  {
    index: true,
    handle: routeMetadata(
      "Product Compare",
      "Choose products with clearer specifications and current offers.",
    ),
    lazy: withLazyRouteImportRecovery(async () => {
      const { HomeRoute, homeLoader } = await import("../home/HomeRoute");
      return { Component: HomeRoute, loader: homeLoader };
    }),
  },
  {
    path: "products",
    handle: routeMetadata(
      "Browse products | Product Compare",
      "Browse the product catalog and narrow the results by the attributes that matter.",
    ),
    lazy: withLazyRouteImportRecovery(async () => {
      const { BrowseRoute, browseLoader } = await import("../catalog/BrowseRoute");
      return { Component: BrowseRoute, loader: browseLoader };
    }),
  },
  {
    path: "products/:slug",
    handle: routeMetadata(
      "Product details | Product Compare",
      "Review product specifications, current offers, and price history.",
    ),
    errorElement: <RouteErrorBoundary resourceName="product" title="Product details" />,
    lazy: withLazyRouteImportRecovery(async () => {
      const { ProductDetailRoute, productDetailLoader } =
        await import("../products/ProductDetailRoute");
      return { Component: ProductDetailRoute, loader: productDetailLoader };
    }),
  },
  {
    path: "merchants",
    handle: routeMetadata(
      "Merchants | Product Compare",
      "Browse merchants represented in current Product Compare offers.",
    ),
    errorElement: <RouteErrorBoundary resourceName="merchant directory" title="Merchants" />,
    lazy: withLazyRouteImportRecovery(async () => {
      const { MerchantDirectoryRoute, merchantDirectoryLoader } =
        await import("../merchants/MerchantDirectoryRoute");
      return { Component: MerchantDirectoryRoute, loader: merchantDirectoryLoader };
    }),
  },
  {
    path: "merchants/:slug",
    handle: routeMetadata(
      "Merchant details | Product Compare",
      "Review a merchant's current product and offer details.",
    ),
    errorElement: <RouteErrorBoundary resourceName="merchant" title="Merchant details" />,
    lazy: withLazyRouteImportRecovery(async () => {
      const { MerchantDetailRoute, merchantDetailLoader } =
        await import("../merchants/detail/MerchantDetailRoute");
      return { Component: MerchantDetailRoute, loader: merchantDetailLoader };
    }),
  },
  {
    path: "categories/:slug",
    handle: routeMetadata(
      "Product category | Product Compare",
      "Compare trusted product specifications and current offer details by category.",
    ),
    errorElement: <RouteErrorBoundary resourceName="category" title="Product category" />,
    lazy: withLazyRouteImportRecovery(async () => {
      const { CategoryRoute, categoryLoader } = await import("../categories/CategoryRoute");
      return { Component: CategoryRoute, loader: categoryLoader };
    }),
  },
  {
    path: "offers",
    handle: routeMetadata(
      "Offers | Product Compare",
      "Discover current product offers, coupons, and merchant availability.",
    ),
    errorElement: <RouteErrorBoundary resourceName="offer discovery" title="Offers" />,
    lazy: withLazyRouteImportRecovery(async () => {
      const { OfferDiscoveryRoute, offerDiscoveryLoader } =
        await import("../offers/OfferDiscoveryRoute");
      return { Component: OfferDiscoveryRoute, loader: offerDiscoveryLoader };
    }),
  },
  {
    path: "compare",
    handle: routeMetadata(
      "Compare products | Product Compare",
      "Compare loaded products by specifications and current offers.",
    ),
    errorElement: <RouteErrorBoundary />,
    lazy: withLazyRouteImportRecovery(async () => {
      const { CompareRoute, compareLoader, shouldRevalidateCompareLoader } =
        await import("../compare/CompareRoute");
      return {
        Component: CompareRoute,
        loader: compareLoader,
        shouldRevalidate: shouldRevalidateCompareLoader,
      };
    }),
  },
  {
    path: "compare/shared/:token",
    handle: routeMetadata(
      "Shared comparison | Product Compare",
      "Review a fixed, source-backed product comparison snapshot.",
    ),
    errorElement: <RouteErrorBoundary resourceName="shared comparison" title="Shared comparison" />,
    lazy: withLazyRouteImportRecovery(async () => {
      const { SharedComparisonRoute, sharedComparisonLoader } =
        await import("../compare/shared/SharedComparisonRoute");
      return { Component: SharedComparisonRoute, loader: sharedComparisonLoader };
    }),
  },
];
