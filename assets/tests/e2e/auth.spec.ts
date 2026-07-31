import { expect, test, type Page } from "@playwright/test";

type GraphQLMockResponse = {
  data: Record<string, unknown>;
};
type GraphQLMockResponses = Record<string, GraphQLMockResponse | GraphQLMockResponse[]>;

async function mockGraphQL(page: Page, responses: GraphQLMockResponses) {
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
      viewer,
    },
  };
}

test("login redirects to the home route after a successful session mutation", async ({ page }) => {
  const requests = await mockGraphQL(page, {
    RootViewerRouteQuery: [
      rootViewerResponse(),
      rootViewerResponse({ id: "1", email: "person@example.com" }),
    ],
    LoginMutation: {
      data: {
        login: {
          viewer: { id: "1", email: "person@example.com" },
          errors: [],
        },
      },
    },
  });

  await page.goto("/auth/login");
  await page.getByLabel("Email").fill("person@example.com");
  await page.getByLabel("Password").fill("supersecretpass123");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { name: "Product Compare" })).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Primary" }).getByRole("link", {
      name: "Sign out",
    }),
  ).toBeVisible();
  expect(requests).toContainEqual({
    operationName: "LoginMutation",
    variables: {
      email: "person@example.com",
      password: "supersecretpass123",
    },
  });
});

test("login renders typed credential errors from the GraphQL payload", async ({ page }) => {
  await mockGraphQL(page, {
    RootViewerRouteQuery: rootViewerResponse(),
    LoginMutation: {
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

  await page.goto("/auth/login");
  await page.getByLabel("Email").fill("person@example.com");
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.getByRole("alert")).toContainText("invalid email or password");
  await expect(page).toHaveURL("/auth/login");
});

test("register redirects to the home route after a successful session mutation", async ({
  page,
}) => {
  const requests = await mockGraphQL(page, {
    RootViewerRouteQuery: [
      rootViewerResponse(),
      rootViewerResponse({ id: "2", email: "new@example.com" }),
    ],
    RegisterMutation: {
      data: {
        register: {
          viewer: { id: "2", email: "new@example.com" },
          errors: [],
        },
      },
    },
  });

  await page.goto("/auth/register");
  await page.getByLabel("Email").fill("new@example.com");
  await page.getByLabel("Password").fill("supersecretpass123");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL("/");
  await expect(
    page.getByRole("navigation", { name: "Primary" }).getByRole("link", {
      name: "Sign out",
    }),
  ).toBeVisible();
  expect(requests).toContainEqual({
    operationName: "RegisterMutation",
    variables: {
      email: "new@example.com",
      password: "supersecretpass123",
    },
  });
});

test("forgot password shows the privacy-safe success state", async ({ page }) => {
  const requests = await mockGraphQL(page, {
    RootViewerRouteQuery: rootViewerResponse(),
    ForgotPasswordMutation: {
      data: {
        forgotPassword: {
          ok: true,
          errors: [],
        },
      },
    },
  });

  await page.goto("/auth/forgot-password");
  await page.getByLabel("Email").fill("person@example.com");
  await page.getByRole("button", { name: "Send reset link" }).click();

  await expect(page.getByRole("status")).toContainText(
    "If an account exists for that email, reset instructions are on the way.",
  );
  expect(requests).toContainEqual({
    operationName: "ForgotPasswordMutation",
    variables: { email: "person@example.com" },
  });
});

test("reset password consumes the token from the URL and shows the success state", async ({
  page,
}) => {
  const requests = await mockGraphQL(page, {
    RootViewerRouteQuery: rootViewerResponse(),
    ResetPasswordMutation: {
      data: {
        resetPassword: {
          ok: true,
          errors: [],
        },
      },
    },
  });

  await page.goto("/auth/reset-password?token=reset-token");
  await page.getByLabel("New password").fill("supersecretpass456");
  await page.getByRole("button", { name: "Update password" }).click();

  await expect(page.getByRole("status")).toContainText("Your password has been updated.");
  expect(requests).toContainEqual({
    operationName: "ResetPasswordMutation",
    variables: {
      token: "reset-token",
      password: "supersecretpass456",
    },
  });
});

test("reset password shows an invalid-token alert when the URL token is missing", async ({
  page,
}) => {
  const requests = await mockGraphQL(page, {
    RootViewerRouteQuery: rootViewerResponse(),
  });

  await page.goto("/auth/reset-password");

  await expect(page.getByRole("alert")).toContainText("This reset link is missing or invalid.");
  await expect(page.getByRole("button", { name: "Update password" })).toBeDisabled();
  expect(requests).toEqual([{ operationName: "RootViewerRouteQuery", variables: {} }]);
});

test("verify email consumes the token from the URL and reports success", async ({ page }) => {
  const requests = await mockGraphQL(page, {
    RootViewerRouteQuery: rootViewerResponse(),
    VerifyEmailMutation: {
      data: {
        verifyEmail: {
          ok: true,
          errors: [],
        },
      },
    },
  });

  await page.goto("/auth/verify-email?token=confirm-token");

  await expect(page.getByRole("status")).toContainText("Your email address is verified.");
  expect(requests).toContainEqual({
    operationName: "VerifyEmailMutation",
    variables: { token: "confirm-token" },
  });
});

test("verify email shows an invalid-token alert when the URL token is missing", async ({
  page,
}) => {
  const requests = await mockGraphQL(page, {
    RootViewerRouteQuery: rootViewerResponse(),
  });

  await page.goto("/auth/verify-email");

  await expect(page.getByRole("alert")).toContainText(
    "This verification link is missing or invalid.",
  );
  expect(requests).toEqual([{ operationName: "RootViewerRouteQuery", variables: {} }]);
});

test("logout clears the browser session through GraphQL and returns to sign in", async ({
  page,
}) => {
  const requests = await mockGraphQL(page, {
    RootViewerRouteQuery: [
      rootViewerResponse({ id: "viewer-1", email: "person@example.com" }),
      rootViewerResponse(),
    ],
    LogoutMutation: {
      data: {
        logout: {
          ok: true,
          errors: [],
        },
      },
    },
  });

  await page.goto("/auth/logout");
  await page.getByRole("button", { name: "Sign out" }).click();

  await expect(page).toHaveURL("/auth/login");
  const primaryNavigation = page.getByRole("navigation", { name: "Primary" });

  await expect(primaryNavigation.getByRole("link", { name: "Sign in" })).toBeVisible();
  await expect(primaryNavigation.getByRole("link", { name: "Create account" })).toBeVisible();
  await expect(primaryNavigation.getByRole("link", { name: "Sign out" })).toHaveCount(0);
  expect(requests).toContainEqual({
    operationName: "LogoutMutation",
    variables: {},
  });
});
