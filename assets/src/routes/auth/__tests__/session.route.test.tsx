import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { RelayEnvironmentProvider } from "react-relay";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { createRelayEnvironment } from "../../../relay/environment";
import { fetchGraphQL } from "../../../relay/fetch-graphql";
import { LoginRoute } from "../login";
import { RegisterRoute } from "../register";

const navigateMock = vi.fn();

vi.mock("../../../relay/fetch-graphql", () => ({
  fetchGraphQL: vi.fn()
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");

  return {
    ...actual,
    useNavigate: () => navigateMock
  };
});

const fetchGraphQLMock = vi.mocked(fetchGraphQL);

function renderRoute(initialEntry: string) {
  render(
    <RelayEnvironmentProvider environment={createRelayEnvironment()}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/auth/login" element={<LoginRoute />} />
          <Route path="/auth/register" element={<RegisterRoute />} />
        </Routes>
      </MemoryRouter>
    </RelayEnvironmentProvider>
  );
}

beforeEach(() => {
  fetchGraphQLMock.mockReset();
  navigateMock.mockReset();
});

test("login route submits credentials and redirects after a successful session response", async () => {
  fetchGraphQLMock.mockResolvedValue({
    data: {
      login: {
        viewer: { id: "1", email: "person@example.com" },
        errors: []
      }
    }
  });

  renderRoute("/auth/login");

  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: "person@example.com" }
  });
  fireEvent.change(screen.getByLabelText(/password/i), {
    target: { value: "supersecretpass123" }
  });
  fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

  await waitFor(() => {
    expect(fetchGraphQLMock).toHaveBeenCalledWith(
      expect.stringContaining("mutation Login"),
      {
        email: "person@example.com",
        password: "supersecretpass123"
      }
    );
  });

  await waitFor(() => {
    expect(navigateMock).toHaveBeenCalledWith("/");
  });
});

test("register route renders typed GraphQL validation errors", async () => {
  fetchGraphQLMock.mockResolvedValue({
    data: {
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
    }
  });

  renderRoute("/auth/register");

  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: "person@example.com" }
  });
  fireEvent.change(screen.getByLabelText(/^password$/i), {
    target: { value: "supersecretpass123" }
  });
  fireEvent.click(screen.getByRole("button", { name: /create account/i }));

  expect(await screen.findByText("has already been taken")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: /create your account/i })).toBeInTheDocument();
});
