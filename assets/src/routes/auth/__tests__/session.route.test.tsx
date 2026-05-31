import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useMutation } from "react-relay";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { LoginRoute } from "../login";
import { RegisterRoute } from "../register";

const navigateMock = vi.fn();
const { commitMutationMock, useMutationMock } = vi.hoisted(() => ({
  commitMutationMock: vi.fn(),
  useMutationMock: vi.fn()
}));

vi.mock("react-relay", async () => {
  const actual = await vi.importActual<typeof import("react-relay")>("react-relay");

  return {
    ...actual,
    useMutation: useMutationMock
  };
});

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");

  return {
    ...actual,
    useNavigate: () => navigateMock
  };
});

const mockedUseMutation = vi.mocked(useMutation);

function renderRoute(initialEntry: string) {
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/auth/login" element={<LoginRoute />} />
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

beforeEach(() => {
  commitMutationMock.mockReset();
  mockedUseMutation.mockReset();
  mockedUseMutation.mockReturnValue([commitMutationMock, false]);
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

  completeMutation({
    login: {
      viewer: { id: "1", email: "person@example.com" },
      errors: []
    }
  });

  await waitFor(() => {
    expect(navigateMock).toHaveBeenCalledWith("/");
  });
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

  expect(await screen.findByText("has already been taken")).toBeInTheDocument();
  expect(emailInput).toHaveAttribute("aria-invalid", "true");
  expect(emailInput).toHaveAttribute("aria-describedby", "email-error");
  expect(screen.getByRole("heading", { name: /create your account/i })).toBeInTheDocument();
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
