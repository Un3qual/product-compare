import "@testing-library/jest-dom/vitest";

class TestResizeObserver implements ResizeObserver {
  disconnect = () => undefined;
  observe = () => undefined;
  unobserve = () => undefined;
}

globalThis.ResizeObserver ??= TestResizeObserver;
