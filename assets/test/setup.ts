import "@testing-library/jest-dom/vitest";

class TestResizeObserver implements ResizeObserver {
  private readonly observedElements = new Set<Element>();

  disconnect() {
    this.observedElements.clear();
  }

  observe(target: Element) {
    this.observedElements.add(target);
  }

  unobserve(target: Element) {
    this.observedElements.delete(target);
  }
}

globalThis.ResizeObserver ??= TestResizeObserver;
globalThis.PointerEvent ??= MouseEvent as unknown as typeof PointerEvent;

Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.setPointerCapture ??= () => {};
Element.prototype.releasePointerCapture ??= () => {};
Element.prototype.scrollIntoView ??= () => {};
