import { render, screen } from "@testing-library/react";
import { commitMutation } from "react-relay";
import { commitLocalUpdate } from "relay-runtime";
import { createMemoryRouter, RouterProvider } from "react-router";
import { createRelayRouterContext } from "../../../src/relay/route-preload";
import { CredentialAuthForm } from "../../../src/routes/auth/CredentialAuthForm";
import { clientAction as loginAction } from "../../../src/routes/auth/LoginRoute";
import { clientAction as logoutAction } from "../../../src/routes/auth/LogoutRoute";
import { clientAction as registerAction } from "../../../src/routes/auth/RegisterRoute";

const { commitLocalUpdateMock, commitMutationMock, relayEnvironment } = vi.hoisted(() => ({
  commitLocalUpdateMock: vi.fn(),
  commitMutationMock: vi.fn(),
  relayEnvironment: {},
}));

vi.mock("relay-runtime", async () => {
  const actual = await vi.importActual<typeof import("relay-runtime")>("relay-runtime");

  return { ...actual, commitLocalUpdate: commitLocalUpdateMock };
});

vi.mock("react-relay", async () => {
  const actual = await vi.importActual<typeof import("react-relay")>("react-relay");

  return { ...actual, commitMutation: commitMutationMock };
});

const mockedCommitLocalUpdate = vi.mocked(commitLocalUpdate);
const mockedCommitMutation = vi.mocked(commitMutation);
const TEST_PASSWORD = ["valid", "credential", "123"].join("-");

beforeEach(() => {
  mockedCommitLocalUpdate.mockReset();
  mockedCommitMutation.mockReset();
});

test.each([
  {
    credentialAutoComplete: "current-password" as const,
    submitLabel: "Sign in",
    title: "Sign in",
  },
  {
    credentialAutoComplete: "new-password" as const,
    submitLabel: "Create account",
    title: "Create your account",
  },
])("credential auth form renders a Framework POST form for $title", (variant) => {
  const router = createMemoryRouter(
    [
      {
        path: "/",
        action: () => null,
        element: (
          <CredentialAuthForm
            credentialAutoComplete={variant.credentialAutoComplete}
            description="Credential flow"
            errors={[
              {
                code: "INVALID_ARGUMENT",
                field: "email",
                message: "Enter a valid email address",
              },
            ]}
            footerLinks={[{ label: "Help", to: "/help" }]}
            isSubmitting={false}
            submitLabel={variant.submitLabel}
            title={variant.title}
          />
        ),
      },
    ],
    { initialEntries: ["/"] },
  );

  render(<RouterProvider router={router} />);

  expect(screen.getByRole("heading", { name: variant.title })).toBeInTheDocument();
  expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
  expect(screen.getByLabelText("Password")).toHaveAttribute(
    "autocomplete",
    variant.credentialAutoComplete,
  );
  expect(screen.getByRole("button", { name: variant.submitLabel }).closest("form")).toHaveAttribute(
    "method",
    "post",
  );
});

test("login action submits GraphQL credentials, updates Relay, and honors a safe return path", async () => {
  resolveNextMutation({
    login: {
      viewer: { id: "1", email: "person@example.com", isOperator: false },
      errors: [],
    },
  });
  const expectViewerUpdated = expectNextLocalUpdateSetsRootViewer({
    id: "1",
    email: "person@example.com",
    isOperator: false,
  });

  const response = await loginAction(
    buildActionArgs(
      "/auth/login?returnTo=%2Fcompare%3Fslug%3Dlamp%23matrix",
      { email: "person@example.com", password: TEST_PASSWORD },
    ),
  );

  expect(mockedCommitMutation).toHaveBeenCalledWith(
    relayEnvironment,
    expect.objectContaining({
      variables: { email: "person@example.com", password: TEST_PASSWORD },
    }),
  );
  expectViewerUpdated();
  expect(response).toBeInstanceOf(Response);
  expect((response as Response).headers.get("location")).toBe("/compare?slug=lamp#matrix");
});

test("login action rejects an external return path", async () => {
  resolveNextMutation({
    login: {
      viewer: { id: "1", email: "person@example.com", isOperator: false },
      errors: [],
    },
  });
  mockedCommitLocalUpdate.mockImplementationOnce(() => undefined);

  const response = await loginAction(
    buildActionArgs("/auth/login?returnTo=https%3A%2F%2Fevil.example%2Fsteal", {
      email: "person@example.com",
      password: TEST_PASSWORD,
    }),
  );

  expect((response as Response).headers.get("location")).toBe("/");
});

test("login action returns typed field errors without changing the Relay viewer", async () => {
  resolveNextMutation({
    login: {
      viewer: null,
      errors: [{ code: "INVALID_CREDENTIALS", field: "email", message: "Invalid credentials" }],
    },
  });

  await expect(
    loginAction(
      buildActionArgs("/auth/login", {
        email: "person@example.com",
        password: TEST_PASSWORD,
      }),
    ),
  ).resolves.toEqual({
    errors: [{ code: "INVALID_CREDENTIALS", field: "email", message: "Invalid credentials" }],
  });
  expect(mockedCommitLocalUpdate).not.toHaveBeenCalled();
});

test("register action updates Relay and redirects after Phoenix establishes the session", async () => {
  resolveNextMutation({
    register: {
      viewer: { id: "2", email: "new@example.com", isOperator: false },
      errors: [],
    },
  });
  const expectViewerUpdated = expectNextLocalUpdateSetsRootViewer({
    id: "2",
    email: "new@example.com",
    isOperator: false,
  });

  const response = await registerAction(
    buildActionArgs("/auth/register", {
      email: "new@example.com",
      password: TEST_PASSWORD,
    }),
  );

  expectViewerUpdated();
  expect((response as Response).headers.get("location")).toBe("/");
});

test("logout action clears the Relay viewer only after a successful GraphQL result", async () => {
  resolveNextMutation({ logout: { ok: true, errors: [] } });
  const expectViewerCleared = expectNextLocalUpdateClearsRootViewer();

  const response = await logoutAction(
    buildActionArgs("/auth/logout"),
  );

  expectViewerCleared();
  expect((response as Response).headers.get("location")).toBe("/auth/login");
});

test("logout action preserves the Relay viewer when GraphQL reports a failure", async () => {
  resolveNextMutation({ logout: { ok: false, errors: [] } });

  await expect(
    logoutAction(buildActionArgs("/auth/logout")),
  ).resolves.toEqual({
    errors: [
      {
        code: "UNKNOWN_ERROR",
        field: null,
        message: "Request failed. Please try again.",
      },
    ],
  });
  expect(mockedCommitLocalUpdate).not.toHaveBeenCalled();
});

test("client actions normalize synchronous Relay failures without leaking transport details", async () => {
  mockedCommitMutation.mockImplementationOnce(() => {
    throw new Error("database stacktrace");
  });

  await expect(
    loginAction(
      buildActionArgs("/auth/login", {
        email: "person@example.com",
        password: TEST_PASSWORD,
      }),
    ),
  ).resolves.toEqual({
    errors: [
      { code: "NETWORK_ERROR", field: null, message: "Request failed. Please try again." },
    ],
  });
});

function buildActionArgs(path: string, fields: Record<string, string> = {}) {
  const url = new URL(path, "https://app.example.com");

  return {
    context: createRelayRouterContext(relayEnvironment as never),
    params: {},
    pattern: path.split("?", 1)[0],
    request: new Request(url, { method: "POST", body: new URLSearchParams(fields) }),
    serverAction: vi.fn(),
    url,
  };
}

function resolveNextMutation(response: unknown, graphQLErrors?: readonly unknown[]) {
  mockedCommitMutation.mockImplementationOnce((_environment, config) => {
    config.onCompleted?.(response as never, graphQLErrors as never);
    return { dispose: vi.fn() };
  });
}

function expectNextLocalUpdateSetsRootViewer(viewer: {
  email: string;
  id: string;
  isOperator: boolean;
}) {
  const viewerRecord = { setValue: vi.fn() };
  const rootRecord = { setLinkedRecord: vi.fn() };
  const store = {
    create: vi.fn(() => viewerRecord),
    get: vi.fn(() => viewerRecord),
    getRoot: vi.fn(() => rootRecord),
  };

  mockedCommitLocalUpdate.mockImplementationOnce((_environment, updater) => {
    updater(store as never, undefined as never);
  });

  return () => {
    expect(viewerRecord.setValue).toHaveBeenCalledWith(viewer.id, "id");
    expect(viewerRecord.setValue).toHaveBeenCalledWith(viewer.email, "email");
    expect(viewerRecord.setValue).toHaveBeenCalledWith(viewer.isOperator, "isOperator");
    expect(rootRecord.setLinkedRecord).toHaveBeenCalledWith(viewerRecord, "viewer");
  };
}

function expectNextLocalUpdateClearsRootViewer() {
  const rootRecord = { setValue: vi.fn() };
  const store = { getRoot: vi.fn(() => rootRecord) };

  mockedCommitLocalUpdate.mockImplementationOnce((_environment, updater) => {
    updater(store as never, undefined as never);
  });

  return () => {
    expect(rootRecord.setValue).toHaveBeenCalledWith(null, "viewer");
  };
}
