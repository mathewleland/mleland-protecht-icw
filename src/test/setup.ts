import { beforeEach, vi } from 'vitest';

// Mock fetch globally
global.fetch = vi.fn();

// Mock console methods to reduce noise in tests
global.console = {
    ...console,
    log: vi.fn(),
    error: vi.fn(),
};

// Mock custom elements registry globally
global.customElements = {
    define: vi.fn(),
    get: vi.fn(() => undefined),
    whenDefined: vi.fn(() => Promise.resolve()),
} as any;

// Setup DOM before each test
beforeEach(() => {
    document.body.innerHTML = '';
    // Reset fetch mock
    vi.resetAllMocks();
}); 