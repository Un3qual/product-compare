import { render, screen } from "@testing-library/react";
import { ResettableErrorBoundary } from "../resettable-error-boundary";

let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  consoleErrorSpy.mockRestore();
});

function ThrowingChild({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error("Route query failed");
  }

  return <p>Route content restored.</p>;
}

test("renders fallback after child errors until the reset token changes", () => {
  const view = render(
    <ResettableErrorBoundary fallback={<p>Route fallback.</p>} resetToken="initial">
      <ThrowingChild shouldThrow />
    </ResettableErrorBoundary>
  );

  expect(screen.getByText("Route fallback.")).toBeInTheDocument();

  view.rerender(
    <ResettableErrorBoundary fallback={<p>Route fallback.</p>} resetToken="initial">
      <ThrowingChild shouldThrow={false} />
    </ResettableErrorBoundary>
  );

  expect(screen.getByText("Route fallback.")).toBeInTheDocument();

  view.rerender(
    <ResettableErrorBoundary fallback={<p>Route fallback.</p>} resetToken="next">
      <ThrowingChild shouldThrow={false} />
    </ResettableErrorBoundary>
  );

  expect(screen.getByText("Route content restored.")).toBeInTheDocument();
});
