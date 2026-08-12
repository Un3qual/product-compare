import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { commitLocalUpdate } from "relay-runtime";
import { useMutation, useRelayEnvironment } from "react-relay";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { CredentialAuthForm } from "../../../src/routes/auth/CredentialAuthForm";
import { LoginRoute } from "../../../src/routes/auth/LoginRoute";
import { LogoutRoute } from "../../../src/routes/auth/LogoutRoute";
import { RegisterRoute } from "../../../src/routes/auth/RegisterRoute";

const navigateMock = vi.fn();
const {
  commitLocalUpdateMock,
  commitMutationMock,
  relayEnvironment,
  useMutationMock,
  useRelayEnvironmentMock,
} = vi.hoisted(() => ({
  commitLocalUpdateMock: vi.fn(),
  commitMutationMock: vi.fn(),
  relayEnvironment: {},
  useMutationMock: vi.fn(),
  useRelayEnvironmentMock: vi.fn(),
}));

vi.mock("relay-runtime", async () => {
  const actual = await vi.importActual<typeof import("relay-runtime")>("relay-runtime");

  return {
    ...actual,
    commitLocalUpdate: commitLocalUpdateMock,
  };
});

vi.mock("react-relay", async () => {
  const actual = await vi.importActual<typeof import("react-relay")>("react-relay");

  return {
    ...actual,
    useMutation: useMutationMock,
    useRelayEnvironment: useRelayEnvironmentMock,
  };
});

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");

  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

const mockedCommitLocalUpdate = vi.mocked(commitLocalUpdate);
const mockedUseMutation = vi.mocked(useMutation);
const mockedUseRelayEnvironment = vi.mocked(useRelayEnvironment);
const TEST_PASSWORD = ["valid", "credential", "123"].join("-");

function renderRoute(initialEntry: string) {
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/auth/login" element={<LoginRoute />} />
        <Route path="/auth/logout" element={<LogoutRoute />} />
        <Route path="/auth/register" element={<RegisterRoute />} />
      </Routes>
    </MemoryRouter>,
  );
}

function latestMutationOptions() {
  return commitMutationMock.mock.calls.at(-1)?.[0];
}

function completeMutation(response: unknown, graphQLErrors?: unknown[]) {
  act(() => {
    latestMutationOptions()?.onCompleted(response, graphQLErrors);
  });
}

function failMutation(error: Error) {
  act(() => {
    latestMutationOptions()?.onError(error);
  });
}

function expectLatestMutationHasNoUnconditionalUpdater() {
  expect(latestMutationOptions()).not.toHaveProperty("updater");
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
    delete: vi.fn(),
    get: vi.fn((dataId: string) => (dataId === viewer.id ? viewerRecord : null)),
    getRoot: vi.fn(() => rootRecord),
  };

  mockedCommitLocalUpdate.mockImplementationOnce((environment, updater) => {
    expect(environment).toBe(relayEnvironment);
    updater(store as never, undefined as never);
  });

  return () => {
    expect(mockedCommitLocalUpdate).toHaveBeenCalledTimes(1);
    expect(store.get).toHaveBeenCalledWith(viewer.id);
    expect(store.create).not.toHaveBeenCalled();
    expect(viewerRecord.setValue).toHaveBeenCalledWith(viewer.id, "id");
    expect(viewerRecord.setValue).toHaveBeenCalledWith(viewer.email, "email");
    expect(viewerRecord.setValue).toHaveBeenCalledWith(viewer.isOperator, "isOperator");
    expect(store.getRoot).toHaveBeenCalled();
    expect(rootRecord.setLinkedRecord).toHaveBeenCalledWith(viewerRecord, "viewer");
  };
}

function expectNextLocalUpdateClearsRootViewer() {
  const rootRecord = { setValue: vi.fn() };
  const store = {
    create: vi.fn(),
    delete: vi.fn(),
    get: vi.fn(),
    getRoot: vi.fn(() => rootRecord),
  };

  mockedCommitLocalUpdate.mockImplementationOnce((environment, updater) => {
    expect(environment).toBe(relayEnvironment);
    updater(store as never, undefined as never);
  });

  return () => {
    expect(mockedCommitLocalUpdate).toHaveBeenCalledTimes(1);
    expect(store.getRoot).toHaveBeenCalled();
    expect(rootRecord.setValue).toHaveBeenCalledWith(null, "viewer");
  };
}

function expectNoLocalRootViewerUpdate() {
  expectLatestMutationHasNoUnconditionalUpdater();
  expect(mockedCommitLocalUpdate).not.toHaveBeenCalled();
}

beforeEach(() => {
  mockedCommitLocalUpdate.mockReset();
  commitMutationMock.mockReset();
  mockedUseMutation.mockReset();
  mockedUseMutation.mockReturnValue([commitMutationMock, false]);
  mockedUseRelayEnvironment.mockReset();
  mockedUseRelayEnvironment.mockReturnValue(relayEnvironment as never);
  navigateMock.mockReset();
});

const credentialFormVariants = [
  {
    description: "Use your email and password to continue through the GraphQL auth flow.",
    footerLinks: [
      { label: "Create account", to: "/auth/register" },
      { label: "Forgot password?", to: "/auth/forgot-password" },
    ],
    credentialAutoComplete: "current-password" as const,
    submitLabel: "Sign in",
    title: "Sign in",
  },
  {
    description: "Create an email/password account and let Phoenix establish the browser session.",
    footerLinks: [
      { label: "Sign in instead", to: "/auth/login" },
      { label: "Forgot password?", to: "/auth/forgot-password" },
    ],
    credentialAutoComplete: "new-password" as const,
    submitLabel: "Create account",
    title: "Create your account",
  },
];

function renderCredentialAuthForm(
  variant: (typeof credentialFormVariants)[number],
  isSubmitting = false,
) {
  const onSubmit = vi.fn();

  render(
    <MemoryRouter>
      <CredentialAuthForm
        credentialAutoComplete={variant.credentialAutoComplete}
        description={variant.description}
        errors={[
          {
            code: "INVALID_ARGUMENT",
            field: "email",
            message: "Enter a valid email address",
          },
          {
            code: "INVALID_ARGUMENT",
            field: "password",
            message: "Password does not meet the requirements",
          },
        ]}
        footerLinks={variant.footerLinks}
        isSubmitting={isSubmitting}
        onSubmit={onSubmit}
        submitLabel={variant.submitLabel}
        title={variant.title}
      />
    </MemoryRouter>,
  );

  return onSubmit;
}

test.each(credentialFormVariants)(
  "credential auth form renders $title copy, credentials, errors, footer links, and submits",
  (variant) => {
    const onSubmit = renderCredentialAuthForm(variant);
    const email = screen.getByLabelText("Email");
    const password = screen.getByLabelText("Password");

    expect(screen.getByRole("heading", { name: variant.title })).toBeInTheDocument();
    expect(screen.getByText(variant.description)).toBeInTheDocument();
    expect(email).toHaveAttribute("autocomplete", "email");
    expect(password).toHaveAttribute("autocomplete", variant.credentialAutoComplete);
    expect(email).toHaveAttribute("aria-invalid", "true");
    expect(password).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Enter a valid email address")).toBeInTheDocument();
    expect(screen.getByText("Password does not meet the requirements")).toBeInTheDocument();

    for (const footerLink of variant.footerLinks) {
      expect(screen.getByRole("link", { name: footerLink.label })).toHaveAttribute(
        "href",
        footerLink.to,
      );
    }

    fireEvent.change(email, { target: { value: "person@example.com" } });
    fireEvent.change(password, { target: { value: TEST_PASSWORD } });
    const form = email.closest("form");

    if (!form) {
      throw new Error("credential field is not contained in a form");
    }

    fireEvent.submit(form);

    expect(onSubmit).toHaveBeenCalledTimes(1);
  },
);

test.each(credentialFormVariants)(
  "credential auth form disables $submitLabel while its mutation is pending",
  (variant) => {
    renderCredentialAuthForm(variant, true);

    expect(screen.getByRole("button", { name: variant.submitLabel })).toBeDisabled();
  },
);

test("login route preserves its credential presentation configuration", () => {
  renderRoute("/auth/login");

  expect(screen.getByRole("heading", { name: "Sign in" })).toBeInTheDocument();
  expect(
    screen.getByText("Use your email and password to continue through the GraphQL auth flow."),
  ).toBeInTheDocument();
  expect(screen.getByLabelText("Password")).toHaveAttribute("autocomplete", "current-password");
  expect(screen.getByRole("link", { name: "Create account" })).toHaveAttribute(
    "href",
    "/auth/register",
  );
  expect(screen.getByRole("link", { name: "Forgot password?" })).toHaveAttribute(
    "href",
    "/auth/forgot-password",
  );
});

test("register route preserves its credential presentation configuration", () => {
  renderRoute("/auth/register");

  expect(screen.getByRole("heading", { name: "Create your account" })).toBeInTheDocument();
  expect(
    screen.getByText(
      "Create an email/password account and let Phoenix establish the browser session.",
    ),
  ).toBeInTheDocument();
  expect(screen.getByLabelText("Password")).toHaveAttribute("autocomplete", "new-password");
  expect(screen.getByRole("link", { name: "Sign in instead" })).toHaveAttribute(
    "href",
    "/auth/login",
  );
  expect(screen.getByRole("link", { name: "Forgot password?" })).toHaveAttribute(
    "href",
    "/auth/forgot-password",
  );
});

test("login route commits credentials through Relay and redirects after a successful session response", async () => {
  renderRoute("/auth/login");

  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: "person@example.com" },
  });
  fireEvent.change(screen.getByLabelText(/password/i), {
    target: { value: TEST_PASSWORD },
  });
  fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

  await waitFor(() => {
    expect(commitMutationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          email: "person@example.com",
          password: TEST_PASSWORD,
        },
      }),
    );
  });

  expectLatestMutationHasNoUnconditionalUpdater();
  const expectRootViewerUpdated = expectNextLocalUpdateSetsRootViewer({
    id: "1",
    email: "person@example.com",
    isOperator: false,
  });

  completeMutation({
    login: {
      viewer: { id: "1", email: "person@example.com", isOperator: false },
      errors: [],
    },
  });

  expectRootViewerUpdated();

  await waitFor(() => {
    expect(navigateMock).toHaveBeenCalledWith("/");
  });
});

test("logout route commits the Relay logout mutation and redirects after Phoenix clears the session", async () => {
  renderRoute("/auth/logout");

  expect(screen.getByRole("heading", { name: /sign out/i })).toBeInTheDocument();
  expect(screen.getByText("Sign out of your account.")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /back to sign in/i })).toHaveAttribute(
    "href",
    "/auth/login",
  );

  fireEvent.click(screen.getByRole("button", { name: /sign out/i }));

  await waitFor(() => {
    expect(commitMutationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {},
      }),
    );
  });

  expectLatestMutationHasNoUnconditionalUpdater();
  const expectRootViewerCleared = expectNextLocalUpdateClearsRootViewer();

  completeMutation({
    logout: {
      ok: true,
      errors: [],
    },
  });

  expectRootViewerCleared();

  await waitFor(() => {
    expect(navigateMock).toHaveBeenCalledWith("/auth/login");
  });
});

test("logout route hides failed action payload details behind a generic alert", async () => {
  renderRoute("/auth/logout");

  fireEvent.click(screen.getByRole("button", { name: /sign out/i }));

  await waitFor(() => {
    expect(commitMutationMock).toHaveBeenCalled();
  });

  completeMutation({
    logout: {
      ok: false,
      errors: [],
    },
  });

  expectNoLocalRootViewerUpdate();
  expect(await screen.findByRole("alert")).toHaveTextContent("Request failed. Please try again.");
  expect(navigateMock).not.toHaveBeenCalled();
});

test("logout route leaves root viewer unchanged when ok is true with typed errors", async () => {
  renderRoute("/auth/logout");

  fireEvent.click(screen.getByRole("button", { name: /sign out/i }));

  await waitFor(() => {
    expect(commitMutationMock).toHaveBeenCalled();
  });

  completeMutation({
    logout: {
      ok: true,
      errors: [
        {
          code: "INVALID_ORIGIN",
          field: null,
          message: "cross-origin request rejected",
        },
      ],
    },
  });

  expectNoLocalRootViewerUpdate();
  expect(await screen.findByRole("alert")).toHaveTextContent("cross-origin request rejected");
  expect(navigateMock).not.toHaveBeenCalled();
});

test("logout route leaves root viewer unchanged on top-level GraphQL errors", async () => {
  renderRoute("/auth/logout");

  fireEvent.click(screen.getByRole("button", { name: /sign out/i }));

  await waitFor(() => {
    expect(commitMutationMock).toHaveBeenCalled();
  });

  completeMutation(
    {
      logout: {
        ok: true,
        errors: [],
      },
    },
    [{ message: "GraphQL request failed (500): database stacktrace" }],
  );

  expectNoLocalRootViewerUpdate();
  const alert = await screen.findByRole("alert");

  expect(alert).toHaveTextContent("Request failed. Please try again.");
  expect(alert).not.toHaveTextContent("database stacktrace");
  expect(navigateMock).not.toHaveBeenCalled();
});

test("register route renders typed GraphQL validation errors from a Relay payload", async () => {
  renderRoute("/auth/register");

  const emailInput = screen.getByLabelText(/email/i);

  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: "person@example.com" },
  });
  fireEvent.change(screen.getByLabelText(/^password$/i), {
    target: { value: TEST_PASSWORD },
  });
  fireEvent.click(screen.getByRole("button", { name: /create account/i }));

  await waitFor(() => {
    expect(commitMutationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          email: "person@example.com",
          password: TEST_PASSWORD,
        },
      }),
    );
  });

  completeMutation({
    register: {
      viewer: null,
      errors: [
        {
          code: "INVALID_ARGUMENT",
          field: "email",
          message: "has already been taken",
        },
      ],
    },
  });

  expectNoLocalRootViewerUpdate();
  expect(await screen.findByText("has already been taken")).toBeInTheDocument();
  expect(emailInput).toHaveAttribute("aria-invalid", "true");
  expect(emailInput).toHaveAttribute("aria-describedby", "email-error");
  expect(screen.getByRole("heading", { name: /create your account/i })).toBeInTheDocument();
});

test("register route updates root viewer after a successful session response", async () => {
  renderRoute("/auth/register");

  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: "person@example.com" },
  });
  fireEvent.change(screen.getByLabelText(/^password$/i), {
    target: { value: TEST_PASSWORD },
  });
  fireEvent.click(screen.getByRole("button", { name: /create account/i }));

  await waitFor(() => {
    expect(commitMutationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          email: "person@example.com",
          password: TEST_PASSWORD,
        },
      }),
    );
  });

  expectLatestMutationHasNoUnconditionalUpdater();
  const expectRootViewerUpdated = expectNextLocalUpdateSetsRootViewer({
    id: "1",
    email: "person@example.com",
    isOperator: false,
  });

  completeMutation({
    register: {
      viewer: { id: "1", email: "person@example.com", isOperator: false },
      errors: [],
    },
  });

  expectRootViewerUpdated();

  await waitFor(() => {
    expect(navigateMock).toHaveBeenCalledWith("/");
  });
});

test("logout route leaves root viewer unchanged when the action payload is missing ok", async () => {
  renderRoute("/auth/logout");

  fireEvent.click(screen.getByRole("button", { name: /sign out/i }));

  await waitFor(() => {
    expect(commitMutationMock).toHaveBeenCalled();
  });

  completeMutation({
    logout: {
      errors: [],
    },
  });

  expectNoLocalRootViewerUpdate();
  expect(await screen.findByRole("alert")).toHaveTextContent("Request failed. Please try again.");
  expect(navigateMock).not.toHaveBeenCalled();
});

test("login route hides transport details behind a generic alert", async () => {
  renderRoute("/auth/login");

  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: "person@example.com" },
  });
  fireEvent.change(screen.getByLabelText(/password/i), {
    target: { value: TEST_PASSWORD },
  });
  fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

  await waitFor(() => {
    expect(commitMutationMock).toHaveBeenCalled();
  });

  failMutation(new Error("GraphQL request failed (500): database stacktrace"));

  const alert = await screen.findByRole("alert");

  expect(alert).toHaveTextContent("Request failed. Please try again.");
  expect(alert).not.toHaveTextContent("database stacktrace");
});

test("login route hides synchronous Relay commit errors behind a generic alert", async () => {
  commitMutationMock.mockImplementation(() => {
    throw new Error("commit failed: database stacktrace");
  });

  renderRoute("/auth/login");

  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: "person@example.com" },
  });
  fireEvent.change(screen.getByLabelText(/password/i), {
    target: { value: TEST_PASSWORD },
  });
  fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

  const alert = await screen.findByRole("alert");

  expect(alert).toHaveTextContent("Request failed. Please try again.");
  expect(alert).not.toHaveTextContent("database stacktrace");
});

test("login route hides top-level GraphQL error details behind a generic alert", async () => {
  renderRoute("/auth/login");

  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: "person@example.com" },
  });
  fireEvent.change(screen.getByLabelText(/password/i), {
    target: { value: TEST_PASSWORD },
  });
  fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

  await waitFor(() => {
    expect(commitMutationMock).toHaveBeenCalled();
  });

  completeMutation(
    {
      login: {
        viewer: { id: "1", email: "person@example.com" },
        errors: [],
      },
    },
    [{ message: "GraphQL request failed (500): database stacktrace" }],
  );

  expectNoLocalRootViewerUpdate();
  const alert = await screen.findByRole("alert");

  expect(alert).toHaveTextContent("Request failed. Please try again.");
  expect(alert).not.toHaveTextContent("database stacktrace");
  expect(navigateMock).not.toHaveBeenCalled();
});

test("register route hides top-level GraphQL error details behind a generic alert", async () => {
  renderRoute("/auth/register");

  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: "person@example.com" },
  });
  fireEvent.change(screen.getByLabelText(/^password$/i), {
    target: { value: TEST_PASSWORD },
  });
  fireEvent.click(screen.getByRole("button", { name: /create account/i }));

  await waitFor(() => {
    expect(commitMutationMock).toHaveBeenCalled();
  });

  completeMutation(
    {
      register: {
        viewer: { id: "1", email: "person@example.com" },
        errors: [],
      },
    },
    [{ message: "GraphQL request failed (500): database stacktrace" }],
  );

  expectNoLocalRootViewerUpdate();
  const alert = await screen.findByRole("alert");

  expect(alert).toHaveTextContent("Request failed. Please try again.");
  expect(alert).not.toHaveTextContent("database stacktrace");
  expect(navigateMock).not.toHaveBeenCalled();
});

test("register route hides synchronous Relay commit errors behind a generic alert", async () => {
  commitMutationMock.mockImplementation(() => {
    throw new Error("commit failed: database stacktrace");
  });

  renderRoute("/auth/register");

  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: "person@example.com" },
  });
  fireEvent.change(screen.getByLabelText(/^password$/i), {
    target: { value: TEST_PASSWORD },
  });
  fireEvent.click(screen.getByRole("button", { name: /create account/i }));

  const alert = await screen.findByRole("alert");

  expect(alert).toHaveTextContent("Request failed. Please try again.");
  expect(alert).not.toHaveTextContent("database stacktrace");
});

test("login route shows a generic alert when the session payload fails without errors", async () => {
  renderRoute("/auth/login");

  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: "person@example.com" },
  });
  fireEvent.change(screen.getByLabelText(/password/i), {
    target: { value: TEST_PASSWORD },
  });
  fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

  await waitFor(() => {
    expect(commitMutationMock).toHaveBeenCalled();
  });

  completeMutation({
    login: {
      viewer: null,
      errors: [],
    },
  });

  expectNoLocalRootViewerUpdate();
  expect(await screen.findByRole("alert")).toHaveTextContent("Request failed. Please try again.");
});

test("login route ignores malformed payload error fields and falls back to a generic alert", async () => {
  renderRoute("/auth/login");

  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: "person@example.com" },
  });
  fireEvent.change(screen.getByLabelText(/password/i), {
    target: { value: TEST_PASSWORD },
  });
  fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

  await waitFor(() => {
    expect(commitMutationMock).toHaveBeenCalled();
  });

  completeMutation({
    login: {
      viewer: null,
      errors: [
        {
          code: "INVALID_ARGUMENT",
          field: 123,
          message: "bad field shape",
        },
      ],
    },
  });

  const alert = await screen.findByRole("alert");

  expect(alert).toHaveTextContent("Request failed. Please try again.");
  expect(alert).not.toHaveTextContent("bad field shape");
});
