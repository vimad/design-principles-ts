import { describe, it, expect } from 'vitest';
import { LoyaltyDiscount } from './loyalty-discount';
import type { Cart } from './types';

// LoyaltyDiscount tests need only the loyaltyPoints field on Cart.
// No items, no categories, no subtotal arithmetic required.

describe('LoyaltyDiscount', () => {
  const strategy = new LoyaltyDiscount();

  it('converts 100 points into $5 off', () => {
    expect(strategy.apply(cartWith(100), 500)).toBe(5);
  });

  it('scales linearly: 500 points → $25 off', () => {
    expect(strategy.apply(cartWith(500), 500)).toBe(25);
  });

  it('rounds down — partial batches earn nothing', () => {
    expect(strategy.apply(cartWith(199), 500)).toBe(5); // only 1 complete batch of 100
  });

  it('returns $0 when the customer has no points', () => {
    expect(strategy.apply(cartWith(0), 500)).toBe(0);
  });

  it('returns $0 when the customer has fewer than 100 points', () => {
    expect(strategy.apply(cartWith(99), 500)).toBe(0);
  });
});

function cartWith(loyaltyPoints: number): Cart {
  return { customerId: 'c1', items: [], loyaltyPoints };
}
