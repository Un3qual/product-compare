import type { Page } from "@playwright/test";

export async function gotoHydratedRoute(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
}

export async function gotoClientRoute(page: Page, path: string) {
  await gotoHydratedRoute(page, "/auth/login");
  await page.evaluate((target) => {
    const currentState = window.history.state as { idx?: number } | null;
    const nextState = {
      ...currentState,
      idx: (currentState?.idx ?? 0) + 1,
      key: "playwright",
      usr: null,
    };

    window.history.pushState(nextState, "", target);
    window.dispatchEvent(new PopStateEvent("popstate", { state: nextState }));
  }, path);
}
