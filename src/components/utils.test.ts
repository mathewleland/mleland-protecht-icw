import { describe, it, expect } from 'vitest';
import { createMaterialIcon, translateLink } from './utils';

describe('Utils', () => {
    describe('createMaterialIcon', () => {
        it('should create icon with known icon name', () => {
            const result = createMaterialIcon('CarCrash');
            expect(result).toContain('car_crash');
            expect(result).toContain('class="material-icons"');
        });

        it('should create icon with tooltip', () => {
            const result = createMaterialIcon('CarCrash', 'Car crash protection');
            expect(result).toContain('title="Car crash protection"');
            expect(result).toContain('aria-label="Car crash protection"');
        });

        it('should use fallback icon for unknown icon names', () => {
            const result = createMaterialIcon('UnknownIcon');
            expect(result).toContain('help_outline');
        });
    });

    describe('translateLink', () => {
        it('should contain expected link translations', () => {
            expect(translateLink.faq).toBe('FAQ');
            expect(translateLink.help_center).toBe('Help Center');
            expect(translateLink.RefundTerms).toBe('Refund Terms');
        });
    });
}); 