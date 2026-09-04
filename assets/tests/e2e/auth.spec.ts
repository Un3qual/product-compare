import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import { gotoClientRoute, gotoHydratedRoute } from "./client-navigation";

type GraphQLMockResponse = {
  data: Record<string, unknown>;
};
type GraphQLMockResponses = Record<string, GraphQLMockResponse | GraphQLMockResponse[]>;

const unhandledOperationsByPage = new WeakMap<Page, string[]>();

test.afterEach(({ page }) => {
  expect(unhandledOperationsByPage.get(page) ?? []).toEqual([]);
});

async function mockGraphQL(page: Page, responses: GraphQLMockResponses) {
  const unhandledOperations: string[] = [];
  const requests: Array<{
    operationName: string;
    variables: Record<string, unknown>;
  }> = [];

  await page.route("**/api/graphql", async (route) => {
    const request = route.request();

    if (request.method() !== "POST") {
      await route.fulfill({ status: 404, body: "Unhandled request" });
      return;
    }

    const payload = request.postDataJSON() as {
      query?: string;
      variables?: Record<string, unknown>;
    };

    const operationName = extractOperationName(payload.query ?? "");
    const variables = payload.variables ?? {};

    requests.push({ operationName, variables });

    const response = nextGraphQLMockResponse(responses, operationName);

    if (!response) {
      unhandledOperations.push(operationName);
      await route.fulfill({
        status: 500,
        body: `Unhandled GraphQL operation: ${operationName}`,
      });
      return;
    }

    await route.fulfill({
      contentType: "application/json",
      status: 200,
      body: JSON.stringify(response),
    });
  });

  unhandledOperationsByPage.set(page, unhandledOperations);
  return requests;
}

function nextGraphQLMockResponse(responses: GraphQLMockResponses, operationName: string) {
  const response = responses[operationName];

  if (!Array.isArray(response)) {
    return response;
  }

  return response.shift();
}

function extractOperationName(query: string) {
  const match = query.match(/\b(?:mutation|query)\s+([A-Za-z0-9_]+)/);
  return match?.[1] ?? "UnknownOperation";
}

function rootViewerResponse(viewer: { id: string; email: string } | null = null) {
  return {
    data: {
      viewer: viewer ? { ...viewer, isOperator: false } : null,
    },
  };
}

function emptyConnection() {
  return { edges: [], pageInfo: { endCursor: null, hasNextPage: false } };
}

function homeRouteResponse() {
  return {
    data: {
      homeWorkspace: {
        categories: emptyConnection(),
        products: emptyConnection(),
        selectedProducts: [],
      },
    },
  };
}

function homeDealsResponse() {
  return {
    data: {
      homeDeals: {
        forYou: emptyConnection(),
        new: emptyConnection(),
        trending: emptyConnection(),
      },
    },
  };
}

test("login redirects to the home route after a successful session mutation", async ({ page }) => {
  const password = randomUUID();
  const requests = await mockGraphQL(page, {
    HomeDealsQuery: homeDealsResponse(),
    HomeRouteQuery: homeRouteResponse(),
    RootRouteQuery: rootViewerResponse({ id: "1", email: "person@example.com" }),
    LoginRouteMutation: {
      data: {
        login: {
          viewer: { id: "1", email: "person@example.com", isOperator: false },
          errors: [],
        },
      },
    },
  });

  await gotoHydratedRoute(page, "/auth/login");
  await page.getByLabel("Email").fill("person@example.com");
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { name: "Find the right product" })).toBeVisible();
  await page.getByRole("button", { name: "Account menu" }).click();
  await expect(page.getByRole("link", { name: "Sign out" })).toBeVisible();
  expect(requests).toContainEqual({
    operationName: "LoginRouteMutation",
    variables: {
      email: "person@example.com",
      password,
    },
  });
});

test("login renders typed credential errors from the GraphQL payload", async ({ page }) => {
  const password = randomUUID();
  await mockGraphQL(page, {
    RootRouteQuery: rootViewerResponse(),
    LoginRouteMutation: {
      data: {
        login: {
          viewer: null,
          errors: [
            {
              code: "INVALID_CREDENTIALS",
              field: null,
              message: "invalid email or password",
            },
          ],
        },
      },
    },
  });

  await gotoHydratedRoute(page, "/auth/login");
  await page.getByLabel("Email").fill("person@example.com");
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.getByRole("alert")).toContainText("invalid email or password");
  await expect(page).toHaveURL("/auth/login");
});

test("guest price-watch intent returns through login for review without automatic submission", async ({
  page,
}) => {
  const password = randomUUID();
  const productResponse = priceWatchProductResponse();
  const requests = await mockGraphQL(page, {
    RootRouteQuery: [
      rootViewerResponse(),
      rootViewerResponse(),
      rootViewerResponse({ id: "member-1", email: "member@example.com" }),
      rootViewerResponse({ id: "member-1", email: "member@example.com" }),
    ],
    ProductDetailRouteQuery: [productResponse, productResponse],
    LoginRouteMutation: {
      data: {
        login: {
          viewer: { id: "member-1", email: "member@example.com", isOperator: false },
          errors: [],
        },
      },
    },
    AlertOperationsCreatePriceWatchMutation: {
      data: {
        createPriceWatch: {
          watch: {
            id: "watch-1",
            productName: "Field Camera",
            ruleType: "TARGET_PRICE",
            currency: "USD",
            targetAmount: "125.00",
            percentageDrop: null,
            enabled: true,
          },
          errors: [],
        },
      },
    },
  });

  await gotoClientRoute(page, "/products/field-camera");
  await page.getByRole("button", { name: "Watch price or availability" }).click();
  const amount = page.getByLabel("Target landed price");
  await amount.fill("125.00");
  const createWatch = page.getByRole("button", { name: "Create watch" });
  await createWatch.click();

  const dialog = page.getByRole("dialog", { name: "Sign in to watch this product" });
  await expect(dialog).toBeVisible();
  expect(requests.some(({ operationName }) => operationName.includes("CreatePriceWatch"))).toBe(
    false,
  );

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(createWatch).toBeFocused();
  await expect(amount).toHaveValue("125.00");

  await createWatch.click();
  await dialog.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(
    /\/auth\/login\?returnTo=%2Fproducts%2Ffield-camera&intent=price_watch$/,
  );
  await expect
    .poll(() =>
      page.evaluate(() => window.sessionStorage.getItem("product-compare.pending-intent")),
    )
    .not.toBeNull();
  await page.getByLabel("Email").fill("member@example.com");
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL("/products/field-camera");
  await page.getByRole("button", { name: "Watch price or availability" }).click();
  await expect(page.getByRole("status")).toContainText("Your watch draft was restored");
  await expect(page.getByLabel("Target landed price")).toHaveValue("125.00");
  expect(requests.some(({ operationName }) => operationName.includes("CreatePriceWatch"))).toBe(
    false,
  );

  await page.getByRole("button", { name: "Create watch" }).click();
  await expect(page.getByRole("status")).toContainText("Watch created");
  expect(requests).toContainEqual({
    operationName: "AlertOperationsCreatePriceWatchMutation",
    variables: {
      input: {
        currency: "USD",
        productId: "product-field-camera",
        ruleType: "TARGET_PRICE",
        targetAmount: "125.00",
      },
    },
  });
});

test("register redirects to the home route after a successful session mutation", async ({
  page,
}) => {
  const password = randomUUID();
  const requests = await mockGraphQL(page, {
    HomeDealsQuery: homeDealsResponse(),
    HomeRouteQuery: homeRouteResponse(),
    RootRouteQuery: rootViewerResponse({ id: "2", email: "new@example.com" }),
    RegisterRouteMutation: {
      data: {
        register: {
          viewer: { id: "2", email: "new@example.com", isOperator: false },
          errors: [],
        },
      },
    },
  });

  await gotoHydratedRoute(page, "/auth/register");
  await page.getByLabel("Email").fill("new@example.com");
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL("/");
  await page.getByRole("button", { name: "Account menu" }).click();
  await expect(page.getByRole("link", { name: "Sign out" })).toBeVisible();
  expect(requests).toContainEqual({
    operationName: "RegisterRouteMutation",
    variables: {
      email: "new@example.com",
      password,
    },
  });
});

test("forgot password shows the privacy-safe success state", async ({ page }) => {
  const requests = await mockGraphQL(page, {
    RootRouteQuery: rootViewerResponse(),
    ForgotPasswordRouteMutation: {
      data: {
        forgotPassword: {
          ok: true,
          errors: [],
        },
      },
    },
  });

  await gotoHydratedRoute(page, "/auth/forgot-password");
  await page.getByLabel("Email").fill("person@example.com");
  await page.getByRole("button", { name: "Send reset link" }).click();

  await expect(page.getByRole("status")).toContainText(
    "If an account exists for that email, reset instructions are on the way.",
  );
  expect(requests).toContainEqual({
    operationName: "ForgotPasswordRouteMutation",
    variables: { email: "person@example.com" },
  });
});

test("reset password consumes the token from the URL and shows the success state", async ({
  page,
}) => {
  const password = randomUUID();
  const token = randomUUID();
  const requests = await mockGraphQL(page, {
    RootRouteQuery: rootViewerResponse(),
    ResetPasswordRouteMutation: {
      data: {
        resetPassword: {
          ok: true,
          errors: [],
        },
      },
    },
  });

  await gotoHydratedRoute(page, `/auth/reset-password?token=${token}`);
  await page.getByRole("textbox", { name: "New password" }).fill(password);
  await page.getByRole("button", { name: "Update password" }).click();

  await expect(page.getByRole("status")).toContainText("Your password has been updated.");
  expect(requests).toContainEqual({
    operationName: "ResetPasswordRouteMutation",
    variables: {
      token,
      password,
    },
  });
});

test("reset password shows an invalid-token alert when the URL token is missing", async ({
  page,
}) => {
  const requests = await mockGraphQL(page, {
    RootRouteQuery: rootViewerResponse(),
  });

  await gotoHydratedRoute(page, "/auth/reset-password");

  await expect(page.getByRole("alert")).toContainText("This reset link is missing or invalid.");
  await expect(page.getByRole("button", { name: "Update password" })).toBeDisabled();
  expect(requests).toEqual([]);
});

test("verify email consumes the token from the URL and reports success", async ({ page }) => {
  const token = randomUUID();
  const requests = await mockGraphQL(page, {
    RootRouteQuery: rootViewerResponse(),
    VerifyEmailRouteMutation: {
      data: {
        verifyEmail: {
          ok: true,
          errors: [],
        },
      },
    },
  });

  await gotoHydratedRoute(page, `/auth/verify-email?token=${token}`);

  await expect(page.getByRole("status")).toContainText("Your email address is verified.");
  expect(requests).toContainEqual({
    operationName: "VerifyEmailRouteMutation",
    variables: { token },
  });
});

test("verify email shows an invalid-token alert when the URL token is missing", async ({
  page,
}) => {
  const requests = await mockGraphQL(page, {
    RootRouteQuery: rootViewerResponse(),
  });

  await gotoHydratedRoute(page, "/auth/verify-email");

  await expect(page.getByRole("alert")).toContainText(
    "This verification link is missing or invalid.",
  );
  expect(requests).toEqual([]);
});

test("logout clears the browser session through GraphQL and returns to sign in", async ({
  page,
}) => {
  const requests = await mockGraphQL(page, {
    RootRouteQuery: rootViewerResponse(),
    LogoutRouteMutation: {
      data: {
        logout: {
          ok: true,
          errors: [],
        },
      },
    },
  });

  await gotoHydratedRoute(page, "/auth/logout");
  await page.getByRole("button", { name: "Sign out" }).click();

  await expect(page).toHaveURL("/auth/login");
  const primaryNavigation = page.getByRole("navigation", { name: "Primary" });

  await primaryNavigation.getByRole("button", { name: "Guest menu" }).click();
  const guestNavigation = page.getByLabel("Guest navigation");
  await expect(guestNavigation.getByRole("link", { name: "Sign in" })).toBeVisible();
  await expect(guestNavigation.getByRole("link", { name: "Create account" })).toBeVisible();
  await expect(primaryNavigation.getByRole("button", { name: "Account menu" })).toHaveCount(0);
  expect(requests).toContainEqual({
    operationName: "LogoutRouteMutation",
    variables: {},
  });
});

function priceWatchProductResponse(): GraphQLMockResponse {
  return {
    data: {
      product: {
        id: "product-field-camera",
        name: "Field Camera",
        slug: "field-camera",
        description: "A detailed field camera.",
        modelNumber: "FC-36",
        seo: {
          title: "Field Camera specifications and prices | Product Compare",
          description: "Compare Field Camera specifications and prices.",
          canonicalPath: "/products/field-camera",
          indexable: true,
          imageUrl: null,
          structuredData: null,
        },
        brand: { id: "brand-acme", name: "Acme" },
        currentAttributes: [],
        offerTruth: {
          asOf: "2026-08-12T17:00:00Z",
          offerCount: 0,
          observedOfferCount: 0,
          eligibleOfferCount: 0,
          currencySummaries: [],
        },
        priceHistory90d: [],
        merchantProducts: {
          edges: [],
          pageInfo: { endCursor: null, hasNextPage: false },
        },
      },
    },
  };
}
