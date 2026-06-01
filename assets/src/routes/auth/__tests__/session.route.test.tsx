import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { commitLocalUpdate } from "relay-runtime";
import { useMutation, useRelayEnvironment } from "react-relay";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { LoginRoute } from "../login";
import { LogoutRoute } from "../logout";
import { RegisterRoute } from "../register";

const navigateMock = vi.fn();
const {
  commitLocalUpdateMock,
  commitMutationMock,
  relayEnvironment,
  useMutationMock,
  useRelayEnvironmentMock
} = vi.hoisted(() => ({
  commitLocalUpdateMock: vi.fn(),
  commitMutationMock: vi.fn(),
  relayEnvironment: {},
  useMutationMock: vi.fn(),
  useRelayEnvironmentMock: vi.fn()
}));

vi.mock("relay-runtime", async () => {
  const actual = await vi.importActual<typeof import("relay-runtime")>("relay-runtime");

  return {
    ...actual,
    commitLocalUpdate: commitLocalUpdateMock
  };
});

vi.mock("react-relay", async () => {
  const actual = await vi.importActual<typeof import("react-relay")>("react-relay");

  return {
    ...actual,
    useMutation: useMutationMock,
    useRelayEnvironment: useRelayEnvironmentMock
  };
});

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");

  return {
    ...actual,
    useNavigate: () => navigateMock
  };
});

const mockedCommitLocalUpdate = vi.mocked(commitLocalUpdate);
const mockedUseMutation = vi.mocked(useMutation);
const mockedUseRelayEnvironment = vi.mocked(useRelayEnvironment);

function renderRoute(initialEntry: string) {
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/auth/login" element={<LoginRoute />} />
        <Route path="/auth/logout" element={<LogoutRoute />} />
        <Route path="/auth/register" element={<RegisterRoute />} />
      </Routes>
    </MemoryRouter>
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

function expectNextLocalUpdateSetsRootViewer(viewer: { email: string; id: string }) {
  const viewerRecord = { setValue: vi.fn() };
  const rootRecord = { setLinkedRecord: vi.fn() };
  const store = {
    create: vi.fn(() => viewerRecord),
    delete: vi.fn(),
    get: vi.fn((dataId: string) => (dataId === viewer.id ? viewerRecord : null)),
    getRoot: vi.fn(() => rootRecord)
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
    getRoot: vi.fn(() => rootRecord)
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

test("login route commits credentials through Relay and redirects after a successful session response", async () => {
  renderRoute("/auth/login");

  expect(screen.getByText("Email").closest("label")).toHaveAttribute("data-slot", "label");
  expect(screen.getByRole("button", { name: /sign in/i })).toHaveAttribute(
    "data-slot",
    "button"
  );
  expect(screen.getByRole("link", { name: /create account/i })).toHaveAttribute(
    "data-slot",
    "button"
  );

  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: "person@example.com" }
  });
  fireEvent.change(screen.getByLabelText(/password/i), {
    target: { value: "supersecretpass123" }
  });
  fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

  await waitFor(() => {
    expect(commitMutationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          email: "person@example.com",
          password: "supersecretpass123"
        }
      })
    );
  });

  expectLatestMutationHasNoUnconditionalUpdater();
  const expectRootViewerUpdated = expectNextLocalUpdateSetsRootViewer({
    id: "1",
    email: "person@example.com"
  });

  completeMutation({
    login: {
      viewer: { id: "1", email: "person@example.com" },
      errors: []
    }
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
  expect(screen.getByRole("button", { name: /sign out/i })).toHaveAttribute(
    "data-slot",
    "button"
  );
  expect(screen.getByRole("link", { name: /back to sign in/i })).toHaveAttribute(
    "href",
    "/auth/login"
  );

  fireEvent.click(screen.getByRole("button", { name: /sign out/i }));

  await waitFor(() => {
    expect(commitMutationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {}
      })
    );
  });

  expectLatestMutationHasNoUnconditionalUpdater();
  const expectRootViewerCleared = expectNextLocalUpdateClearsRootViewer();

  completeMutation({
    logout: {
      ok: true,
      errors: []
    }
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
      errors: []
    }
  });

  expectNoLocalRootViewerUpdate();
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Request failed. Please try again."
  );
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
          message: "cross-origin request rejected"
        }
      ]
    }
  });

  expectNoLocalRootViewerUpdate();
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "cross-origin request rejected"
  );
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
        errors: []
      }
    },
    [{ message: "GraphQL request failed (500): database stacktrace" }]
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

  expect(screen.getByText("Email").closest("label")).toHaveAttribute("data-slot", "label");
  expect(screen.getByRole("button", { name: /create account/i })).toHaveAttribute(
    "data-slot",
    "button"
  );
  expect(screen.getByRole("link", { name: /sign in instead/i })).toHaveAttribute(
    "data-slot",
    "button"
  );

  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: "person@example.com" }
  });
  fireEvent.change(screen.getByLabelText(/^password$/i), {
    target: { value: "supersecretpass123" }
  });
  fireEvent.click(screen.getByRole("button", { name: /create account/i }));

  await waitFor(() => {
    expect(commitMutationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          email: "person@example.com",
          password: "supersecretpass123"
        }
      })
    );
  });

  completeMutation({
    register: {
      viewer: null,
      errors: [
        {
          code: "INVALID_ARGUMENT",
          field: "email",
          message: "has already been taken"
        }
      ]
    }
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
    target: { value: "person@example.com" }
  });
  fireEvent.change(screen.getByLabelText(/^password$/i), {
    target: { value: "supersecretpass123" }
  });
  fireEvent.click(screen.getByRole("button", { name: /create account/i }));

  await waitFor(() => {
    expect(commitMutationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          email: "person@example.com",
          password: "supersecretpass123"
        }
      })
    );
  });

  expectLatestMutationHasNoUnconditionalUpdater();
  const expectRootViewerUpdated = expectNextLocalUpdateSetsRootViewer({
    id: "1",
    email: "person@example.com"
  });

  completeMutation({
    register: {
      viewer: { id: "1", email: "person@example.com" },
      errors: []
    }
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
      errors: []
    }
  });

  expectNoLocalRootViewerUpdate();
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Request failed. Please try again."
  );
  expect(navigateMock).not.toHaveBeenCalled();
});

test("login route hides transport details behind a generic alert", async () => {
  renderRoute("/auth/login");

  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: "person@example.com" }
  });
  fireEvent.change(screen.getByLabelText(/password/i), {
    target: { value: "supersecretpass123" }
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
    target: { value: "person@example.com" }
  });
  fireEvent.change(screen.getByLabelText(/password/i), {
    target: { value: "supersecretpass123" }
  });
  fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

  const alert = await screen.findByRole("alert");

  expect(alert).toHaveTextContent("Request failed. Please try again.");
  expect(alert).not.toHaveTextContent("database stacktrace");
});

test("login route hides top-level GraphQL error details behind a generic alert", async () => {
  renderRoute("/auth/login");

  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: "person@example.com" }
  });
  fireEvent.change(screen.getByLabelText(/password/i), {
    target: { value: "supersecretpass123" }
  });
  fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

  await waitFor(() => {
    expect(commitMutationMock).toHaveBeenCalled();
  });

  completeMutation(
    {
      login: {
        viewer: { id: "1", email: "person@example.com" },
        errors: []
      }
    },
    [{ message: "GraphQL request failed (500): database stacktrace" }]
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
    target: { value: "person@example.com" }
  });
  fireEvent.change(screen.getByLabelText(/^password$/i), {
    target: { value: "supersecretpass123" }
  });
  fireEvent.click(screen.getByRole("button", { name: /create account/i }));

  await waitFor(() => {
    expect(commitMutationMock).toHaveBeenCalled();
  });

  completeMutation(
    {
      register: {
        viewer: { id: "1", email: "person@example.com" },
        errors: []
      }
    },
    [{ message: "GraphQL request failed (500): database stacktrace" }]
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
    target: { value: "person@example.com" }
  });
  fireEvent.change(screen.getByLabelText(/^password$/i), {
    target: { value: "supersecretpass123" }
  });
  fireEvent.click(screen.getByRole("button", { name: /create account/i }));

  const alert = await screen.findByRole("alert");

  expect(alert).toHaveTextContent("Request failed. Please try again.");
  expect(alert).not.toHaveTextContent("database stacktrace");
});

test("login route shows a generic alert when the session payload fails without errors", async () => {
  renderRoute("/auth/login");

  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: "person@example.com" }
  });
  fireEvent.change(screen.getByLabelText(/password/i), {
    target: { value: "supersecretpass123" }
  });
  fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

  await waitFor(() => {
    expect(commitMutationMock).toHaveBeenCalled();
  });

  completeMutation({
    login: {
      viewer: null,
      errors: []
    }
  });

  expectNoLocalRootViewerUpdate();
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Request failed. Please try again."
  );
});

test("login route ignores malformed payload error fields and falls back to a generic alert", async () => {
  renderRoute("/auth/login");

  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: "person@example.com" }
  });
  fireEvent.change(screen.getByLabelText(/password/i), {
    target: { value: "supersecretpass123" }
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
          message: "bad field shape"
        }
      ]
    }
  });

  const alert = await screen.findByRole("alert");

  expect(alert).toHaveTextContent("Request failed. Please try again.");
  expect(alert).not.toHaveTextContent("bad field shape");
});
