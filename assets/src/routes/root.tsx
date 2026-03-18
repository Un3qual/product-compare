import * as stylex from "@stylexjs/stylex";
import { Link, Outlet } from "react-router-dom";
import { AppShell } from "../ui/components/layout/app-shell";
import { AppProviders } from "../ui/providers/app-providers";

const styles = stylex.create({
  home: {
    display: "grid",
    gap: "1rem",
    marginInline: "auto",
    maxWidth: "40rem",
    paddingBlock: "3rem",
    paddingInline: "1.5rem"
  },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.75rem"
  },
  link: {
    color: "inherit",
    fontWeight: 600,
    textDecoration: "underline"
  },
  navigation: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "0.75rem 1rem",
    justifyContent: "space-between"
  },
  navigationLinks: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.75rem"
  },
  title: {
    color: "inherit",
    fontWeight: 700,
    textDecoration: "none"
  }
});

export function RootLayout() {
  return (
    <AppProviders>
      <AppShell
        navigation={
          <div {...stylex.props(styles.navigation)}>
            <Link to="/" {...stylex.props(styles.title)}>
              Product Compare
            </Link>
            <div {...stylex.props(styles.navigationLinks)}>
              <Link to="/products" {...stylex.props(styles.link)}>
                Browse products
              </Link>
              <Link to="/compare" {...stylex.props(styles.link)}>
                Compare products
              </Link>
              <Link to="/auth/login" {...stylex.props(styles.link)}>
                Sign in
              </Link>
              <Link to="/auth/register" {...stylex.props(styles.link)}>
                Create account
              </Link>
            </div>
          </div>
        }
      >
        <Outlet />
      </AppShell>
    </AppProviders>
  );
}

export function RootRoute() {
  return (
    <section {...stylex.props(styles.home)}>
      <div>
        <h1>Product Compare</h1>
        <p>GraphQL-backed browser auth flows now live alongside the frontend routes.</p>
      </div>
      <div {...stylex.props(styles.actions)}>
        <Link to="/products" {...stylex.props(styles.link)}>
          Browse products
        </Link>
        <Link to="/compare" {...stylex.props(styles.link)}>
          Compare products
        </Link>
        <Link to="/auth/login" {...stylex.props(styles.link)}>
          Sign in
        </Link>
        <Link to="/auth/register" {...stylex.props(styles.link)}>
          Create account
        </Link>
      </div>
    </section>
  );
}
