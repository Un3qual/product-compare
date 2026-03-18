import { render, screen } from "@testing-library/react";
import type { LoaderFunctionArgs } from "react-router-dom";
import { useLoaderData } from "react-router-dom";
import { compareLoader } from "../api";
import { CompareRoute } from "../index";

const { useLoaderDataMock } = vi.hoisted(() => ({
  useLoaderDataMock: vi.fn()
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");

  return {
    ...actual,
    useLoaderData: useLoaderDataMock
  };
});

const mockedUseLoaderData = vi.mocked(useLoaderData);

beforeEach(() => {
  useLoaderDataMock.mockReset();
});

test("compare loader returns an empty state when no slugs are selected", async () => {
  await expect(
    compareLoader({
      request: new Request("https://app.example.com/compare"),
      params: {},
      context: undefined
    } as LoaderFunctionArgs)
  ).resolves.toEqual({
    status: "empty",
    slugs: []
  });
});

test("compare loader rejects more than three selected slugs", async () => {
  await expect(
    compareLoader({
      request: new Request(
        "https://app.example.com/compare?slug=one&slug=two&slug=three&slug=four"
      ),
      params: {},
      context: undefined
    } as LoaderFunctionArgs)
  ).resolves.toEqual({
    status: "too_many",
    slugs: ["one", "two", "three", "four"]
  });
});

test("renders an empty-state message when no products are selected", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "empty",
    slugs: []
  });

  render(<CompareRoute />);

  expect(screen.getByRole("heading", { name: "Compare products" })).toBeInTheDocument();
  expect(screen.getByText("Choose up to 3 products to compare.")).toBeInTheDocument();
});

test("renders a limit message when more than three products are selected", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "too_many",
    slugs: ["one", "two", "three", "four"]
  });

  render(<CompareRoute />);

  expect(screen.getByRole("heading", { name: "Compare products" })).toBeInTheDocument();
  expect(screen.getByText("You can compare up to 3 products.")).toBeInTheDocument();
});
