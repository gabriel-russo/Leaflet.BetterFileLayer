/**
 * Test environment polyfills.
 *
 * jsdom does not implement ResizeObserver, which Leaflet 2 uses while
 * initializing a map. A no-op stub is enough for the control tests.
 */
class ResizeObserverStub {
  observe = () => undefined;

  unobserve = () => undefined;

  disconnect = () => undefined;
}

globalThis.ResizeObserver =
  globalThis.ResizeObserver ?? (ResizeObserverStub as unknown as typeof ResizeObserver);
