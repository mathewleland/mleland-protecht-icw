import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ICWWidget, createICWWidget } from './ICWWidget';
import { ICWResponse } from '../api/types';

// Mock the API module
vi.mock('../api/httpClient', () => ({
    configureICW: vi.fn(),
}));

// Mock utils
vi.mock('./utils', () => ({
    createMaterialIcon: vi.fn((iconName: string, tooltip?: string) =>
        `<span class="material-icons">${iconName}</span>`
    ),
    translateLink: {
        faq: 'FAQ',
        help_center: 'Help Center',
        RefundTerms: 'Refund Terms',
    },
}));

// Mock styles
vi.mock('../styles/styles', () => ({
    baseStyles: '<style>/* base styles */</style>',
    loadingStyles: '<style>/* loading styles */</style>',
}));

import { configureICW } from '../api/httpClient';

const mockConfigureICW = vi.mocked(configureICW);

describe('ICWWidget', () => {
    let widget: ICWWidget;
    let mockConfig: any;
    let mockResponse: ICWResponse;

    beforeEach(() => {
        mockConfig = {
            containerId: 'test-container',
            apiKey: 'test-api-key',
            currency: 'USD',
            items: [{ unit_cost: '100.00', quantity: 1 }],
            locale: 'en_US',
            onProtectionToggle: vi.fn(),
        };

        mockResponse = {
            token: 'test-token',
            token_opt_out: 'test-token-opt-out',
            currency: 'USD',
            symbol: '$',
            quote: [{ coverage_amount: '100.00', premium: '10.00', reference_id: 'ref-1', quantity: 1 }],
            quote_total: '10.00',
            quote_literal: '$10.00',
            order_total: '110.00',
            order_literal: '$110.00',
            legal_content: 'Legal content',
            legal_content_expander: 'Legal expander',
            perils: [
                { icon: 'CarCrash', id: 'car-crash', name: 'Car Crash' },
                { icon: 'Thunderstorm', id: 'storm', name: 'Storm Damage' },
            ],
            links: [
                { url: 'https://example.com/faq', type: 'faq' },
                { url: 'https://example.com/help', type: 'help_center' },
            ],
            underwriter: {
                name: 'Test Insurance',
                legal_name: 'Test Insurance Company LLC',
                id: 'test-insurer',
            },
        };

        // Create widget instance directly for testing internal methods
        widget = Object.create(ICWWidget.prototype);
        (widget as any).shadow = {
            innerHTML: '',
            querySelector: vi.fn(),
            querySelectorAll: vi.fn(),
        };
    });

    describe('Constructor and Initialization', () => {
        it('should initialize with default config values', () => {
            const configWithoutOptionals = {
                containerId: 'test-container',
                apiKey: 'test-api-key',
                currency: 'USD',
                items: [{ unit_cost: '100.00' }],
            };

            widget.initialize(configWithoutOptionals);

            // Access private config through any type for testing
            const config = (widget as any).config;
            expect(config.locale).toBe('en_US');
            expect(config.onProtectionToggle).toBeTypeOf('function');
        });

        it('should override default config values when provided', () => {
            widget.initialize(mockConfig);

            const config = (widget as any).config;
            expect(config.locale).toBe('en_US');
            expect(config.onProtectionToggle).toBe(mockConfig.onProtectionToggle);
        });
    });

    describe('Loading State', () => {
        it('should set loading HTML', () => {
            (widget as any).renderLoading();

            expect((widget as any).shadow.innerHTML).toContain('Fetching Protecht-ions...');
            expect((widget as any).shadow.innerHTML).toContain('loading');
        });
    });

    describe('Error State', () => {
        it('should set error HTML', () => {
            const error = new Error('Test error');
            (widget as any).renderError(error);

            expect((widget as any).shadow.innerHTML).toContain('Error: Test error');
        });

        it('should render error when no data is received', () => {
            widget.initialize(mockConfig);

            // Call renderWidget without setting data
            (widget as any).renderWidget();

            expect((widget as any).shadow.innerHTML).toContain('Error: No data received from API');
        });
    });

    describe('Widget Rendering', () => {
        beforeEach(() => {
            widget.initialize(mockConfig);
            (widget as any).data = mockResponse;

            // Mock querySelector to return elements with proper innerHTML tracking
            const mockElements = {
                perils: { innerHTML: '' },
                links: { innerHTML: '' },
                underwriter: { innerHTML: '' },
                checkbox: {
                    addEventListener: vi.fn(),
                    checked: false,
                    type: 'checkbox'
                }
            };

            (widget as any).shadow.querySelector = vi.fn((selector) => {
                if (selector === '#perils') return mockElements.perils;
                if (selector === '#links') return mockElements.links;
                if (selector === '#underwriter') return mockElements.underwriter;
                if (selector === '#protection-checkbox') return mockElements.checkbox;
                return null;
            });
        });

        it('should render quote total', () => {
            (widget as any).renderWidget();

            expect((widget as any).shadow.innerHTML).toContain('Total: $10.00');
        });

        it('should render protection toggle checkbox', () => {
            (widget as any).renderWidget();

            expect((widget as any).shadow.innerHTML).toContain('protection-checkbox');
            expect((widget as any).shadow.innerHTML).toContain('Protecht my purchase');
        });

        it('should render perils section with data', () => {
            (widget as any).renderWidget();

            const perilsContainer = (widget as any).shadow.querySelector('#perils');
            expect(perilsContainer!.innerHTML).toContain('Perils:');
        });

        it('should render empty perils message when no perils', () => {
            (widget as any).data = { ...mockResponse, perils: [] };
            (widget as any).renderWidget();

            const perilsContainer = (widget as any).shadow.querySelector('#perils');
            expect(perilsContainer!.innerHTML).toContain('No perils available');
        });
    });

    describe('API Integration', () => {
        beforeEach(() => {
            // Mock renderWidget method to avoid DOM manipulation issues
            (widget as any).shadow.innerHTML = '';
            (widget as any).shadow.querySelector = vi.fn(() => ({ innerHTML: '' }));
            const renderWidgetSpy = vi.spyOn(widget as any, 'renderWidget').mockImplementation(() => { });
        });

        it('should call configureICW with correct parameters', async () => {
            mockConfigureICW.mockResolvedValue(mockResponse);

            widget.initialize(mockConfig);
            await (widget as any).fetchAndRender();

            expect(mockConfigureICW).toHaveBeenCalledWith(
                'test-api-key',
                {
                    currency: 'USD',
                    items: [{ unit_cost: '100.00', quantity: 1 }],
                    locale: 'en_US',
                }
            );

            expect((widget as any).data).toEqual(mockResponse);
        });

        it('should handle API errors', async () => {
            const error = new Error('API Error');
            mockConfigureICW.mockRejectedValue(error);

            widget.initialize(mockConfig);

            // Test fetchAndRender error handling directly - it should re-throw the error
            await expect((widget as any).fetchAndRender()).rejects.toThrow('API Error');
        });
    });
});

describe('createICWWidget Factory Function', () => {
    let container: HTMLElement;
    let mockConfig: any;

    beforeEach(() => {
        // Mock customElements
        global.customElements = {
            define: vi.fn(),
            get: vi.fn(() => ICWWidget),
            whenDefined: vi.fn(() => Promise.resolve()),
        } as any;

        // Create real container element
        container = {
            id: 'test-container',
            appendChild: vi.fn(),
            querySelector: vi.fn(() => null),
        } as any;

        // Mock document methods
        const originalCreateElement = document.createElement.bind(document);
        global.document.getElementById = vi.fn((id) => {
            if (id === 'test-container') return container;
            return null;
        });

        global.document.createElement = vi.fn((tagName) => {
            if (tagName === 'protecht-icw') {
                return {
                    setAttribute: vi.fn(),
                    initialize: vi.fn(),
                } as any;
            }
            return originalCreateElement(tagName);
        });

        // Mock document.querySelector for widget reuse
        global.document.querySelector = vi.fn(() => null);

        mockConfig = {
            containerId: 'test-container',
            apiKey: 'test-api-key',
            currency: 'USD',
            items: [{ unit_cost: '100.00' }],
        };
    });

    it('should create and append widget to container', () => {
        createICWWidget(mockConfig);

        expect(container.appendChild).toHaveBeenCalled();
        expect(global.document.createElement).toHaveBeenCalledWith('protecht-icw');
    });

    it('should throw error if container not found', () => {
        global.document.getElementById = vi.fn(() => null);

        expect(() => createICWWidget(mockConfig)).toThrow(
            'Container "test-container" not found.'
        );
    });

    it('should reuse existing widget if found', () => {
        const existingWidget = { initialize: vi.fn() };
        global.document.querySelector = vi.fn(() => existingWidget as any);

        createICWWidget(mockConfig);

        expect(existingWidget.initialize).toHaveBeenCalledWith(mockConfig);
        expect(container.appendChild).not.toHaveBeenCalled();
    });
}); 