import { describe, it, expect } from 'vitest';
import { PercentageDiscount } from './percentage-discount';
import type { Cart } from './types';

// PercentageDiscount is testable with just a subtotal number.
// No cart items, no loyalty points, no categories required.

describe('PercentageDiscount', () => {
  it('deducts the correct fraction of the subtotal', () => {
    const strategy = new PercentageDiscount(10);
    expect(strategy.apply(emptyCart(), 200)).toBe(20);
  });

  it('scales with the subtotal', () => {
    const strategy = new PercentageDiscount(25);
    expect(strategy.apply(emptyCart(), 400)).toBe(100);
  });

  it('returns 0 for a 0% discount', () => {
    expect(new PercentageDiscount(0).apply(emptyCart(), 200)).toBe(0);
  });

  it('exposes a human-readable name', () => {
    expect(new PercentageDiscount(15).name).toBe('15% off');
  });
});

function emptyCart(): Cart {
  return { customerId: 'c1', items: [], loyaltyPoints: 0 };
}
