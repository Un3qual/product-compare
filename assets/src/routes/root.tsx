import * as stylex from "@stylexjs/stylex";
import { Link, Outlet } from "react-router-dom";
import { AppShell } from "../ui/components/layout/app-shell";
import { Button } from "../ui/primitives";
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
            <Button asChild {...stylex.props(styles.title)}>
              <Link to="/">Product Compare</Link>
            </Button>
            <div {...stylex.props(styles.navigationLinks)}>
              <Button asChild {...stylex.props(styles.link)}>
                <Link to="/products">Browse products</Link>
              </Button>
              <Button asChild {...stylex.props(styles.link)}>
                <Link to="/compare">Compare products</Link>
              </Button>
              <Button asChild {...stylex.props(styles.link)}>
                <Link to="/auth/login">Sign in</Link>
              </Button>
              <Button asChild {...stylex.props(styles.link)}>
                <Link to="/auth/register">Create account</Link>
              </Button>
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
        <Button asChild {...stylex.props(styles.link)}>
          <Link to="/products">Browse products</Link>
        </Button>
        <Button asChild {...stylex.props(styles.link)}>
          <Link to="/compare">Compare products</Link>
        </Button>
        <Button asChild {...stylex.props(styles.link)}>
          <Link to="/auth/login">Sign in</Link>
        </Button>
        <Button asChild {...stylex.props(styles.link)}>
          <Link to="/auth/register">Create account</Link>
        </Button>
      </div>
    </section>
  );
}
