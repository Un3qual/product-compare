import * as stylex from "@stylexjs/stylex";

export const tokens = stylex.defineVars({
  surface: "var(--pc-surface-canvas)",
  surfaceRaised: "var(--pc-surface-raised)",
  surfaceMuted: "var(--pc-surface-muted)",
  surfaceInteractive: "var(--pc-surface-interactive)",
  text: "var(--pc-text-primary)",
  textSecondary: "var(--pc-text-secondary)",
  textSubtle: "var(--pc-text-subtle)",
  textInverted: "var(--pc-text-inverted)",
  border: "var(--pc-border-standard)",
  borderQuiet: "var(--pc-border-quiet)",
  borderEmphasized: "var(--pc-border-emphasized)",
  actionAccent: "var(--pc-action-accent)",
  actionAccentHover: "var(--pc-action-accent-hover)",
  pricePositive: "var(--pc-price-positive)",
  coupon: "var(--pc-coupon)",
  warning: "var(--pc-warning)",
  unavailable: "var(--pc-unavailable)",
  pageMax: "var(--pc-page-max)",
  readingMax: "var(--pc-reading-max)",
  navHeight: "var(--pc-nav-height)",
  routeSpace: "var(--pc-route-space)",
  controlHeight: "var(--pc-control-height)"
});
