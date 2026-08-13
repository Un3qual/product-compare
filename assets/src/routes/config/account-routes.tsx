import type { RouteObject } from "react-router-dom";
import { routeMetadata } from "../../frontend/head";
import { RouteErrorBoundary } from "../compare/RouteErrorBoundary";
import { withLazyRouteImportRecovery } from "./lazy-route";

export const accountRoutes: RouteObject[] = [
  {
    path: "compare/saved",
    handle: routeMetadata(
      "Saved comparisons | Product Compare",
      "Return to product comparisons saved to your account.",
    ),
    errorElement: <RouteErrorBoundary title="Saved comparisons" />,
    lazy: withLazyRouteImportRecovery(async () => {
      const { SavedComparisonsRoute, savedComparisonsLoader } =
        await import("../compare/saved/SavedComparisonsRoute");
      return { Component: SavedComparisonsRoute, loader: savedComparisonsLoader };
    }),
  },
  {
    path: "account/alerts",
    handle: routeMetadata(
      "Price alerts | Product Compare",
      "Manage product price watches and review qualifying price or availability changes.",
    ),
    errorElement: <RouteErrorBoundary resourceName="price alerts" title="Price alerts" />,
    lazy: withLazyRouteImportRecovery(async () => {
      const { AlertsRoute, alertsLoader } = await import("../account/alerts/AlertsRoute");
      return { Component: AlertsRoute, loader: alertsLoader };
    }),
  },
  {
    path: "account/api-tokens",
    handle: routeMetadata(
      "API tokens | Product Compare",
      "Create and manage API tokens for connected Product Compare tools.",
    ),
    errorElement: <RouteErrorBoundary resourceName="API tokens page" title="API tokens" />,
    lazy: withLazyRouteImportRecovery(async () => {
      const { ApiTokensRoute, apiTokensLoader } =
        await import("../account/api-tokens/ApiTokensRoute");
      return { Component: ApiTokensRoute, loader: apiTokensLoader };
    }),
  },
  {
    path: "auth/login",
    handle: routeMetadata(
      "Sign in | Product Compare",
      "Sign in to manage saved comparisons and account tools.",
    ),
    lazy: withLazyRouteImportRecovery(async () => {
      const { LoginRoute } = await import("../auth/LoginRoute");
      return { Component: LoginRoute };
    }),
  },
  {
    path: "auth/logout",
    handle: routeMetadata(
      "Sign out | Product Compare",
      "Sign out of your Product Compare account.",
    ),
    lazy: withLazyRouteImportRecovery(async () => {
      const { LogoutRoute } = await import("../auth/LogoutRoute");
      return { Component: LogoutRoute };
    }),
  },
  {
    path: "auth/register",
    handle: routeMetadata(
      "Create account | Product Compare",
      "Create an account to save comparisons and manage connected tools.",
    ),
    lazy: withLazyRouteImportRecovery(async () => {
      const { RegisterRoute } = await import("../auth/RegisterRoute");
      return { Component: RegisterRoute };
    }),
  },
  {
    path: "auth/forgot-password",
    handle: routeMetadata(
      "Forgot password | Product Compare",
      "Request a secure Product Compare password reset link.",
    ),
    lazy: withLazyRouteImportRecovery(async () => {
      const { ForgotPasswordRoute } = await import("../auth/ForgotPasswordRoute");
      return { Component: ForgotPasswordRoute };
    }),
  },
  {
    path: "auth/reset-password",
    handle: routeMetadata(
      "Reset password | Product Compare",
      "Choose a new password for your Product Compare account.",
    ),
    lazy: withLazyRouteImportRecovery(async () => {
      const { ResetPasswordRoute } = await import("../auth/ResetPasswordRoute");
      return { Component: ResetPasswordRoute };
    }),
  },
  {
    path: "auth/verify-email",
    handle: routeMetadata(
      "Verify email | Product Compare",
      "Verify the email address connected to your Product Compare account.",
    ),
    lazy: withLazyRouteImportRecovery(async () => {
      const { VerifyEmailRoute } = await import("../auth/VerifyEmailRoute");
      return { Component: VerifyEmailRoute };
    }),
  },
];
