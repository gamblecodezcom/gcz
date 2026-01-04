import '@testing-library/jest-dom';

// -----------------------------
// matchMedia Mock
// -----------------------------
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),            // deprecated
    removeListener: jest.fn(),         // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// -----------------------------
// IntersectionObserver Mock
// -----------------------------
class MockIntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return []; }
}

global.IntersectionObserver = MockIntersectionObserver as any;

// -----------------------------
// ResizeObserver Mock (important for modern UIs)
// -----------------------------
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = MockResizeObserver as any;
