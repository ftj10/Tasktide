// INPUT: jsdom test runtime
// OUTPUT: browser API shims for frontend tests
// EFFECT: Provides the UI test environment required by planner components and calendar features
import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

let screenWidth = 1024;

function matchesMediaQuery(query: string) {
  const minMatch = query.match(/\(min-width:\s*(\d+(?:\.\d+)?)px\)/);
  const maxMatch = query.match(/\(max-width:\s*(\d+(?:\.\d+)?)px\)/);
  const minWidth = minMatch ? Number(minMatch[1]) : undefined;
  const maxWidth = maxMatch ? Number(maxMatch[1]) : undefined;
  const passesMin = minWidth === undefined || screenWidth >= minWidth;
  const passesMax = maxWidth === undefined || screenWidth <= maxWidth;
  return passesMin && passesMax;
}

export function setScreenWidth(nextWidth: number) {
  screenWidth = nextWidth;
  window.innerWidth = nextWidth;
  window.dispatchEvent(new Event("resize"));
}

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: matchesMediaQuery(query),
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal("ResizeObserver", ResizeObserverMock);
vi.stubGlobal("scrollTo", vi.fn());
