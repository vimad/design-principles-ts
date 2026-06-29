import { describe, it, expect } from 'vitest';
import { FlatDiscount } from './flat-discount';
import type { Cart } from './types';

describe('FlatDiscount', () => {
  it('returns the fixed amount regardless of the subtotal', () => {
    const strategy = new FlatDiscount(25);
    expect(strategy.apply(emptyCart(), 200)).toBe(25);
    expect(strategy.apply(emptyCart(), 30)).toBe(25);
  });

  it('exposes a human-readable name', () => {
    expect(new FlatDiscount(25).name).toBe('$25 off');
  });
});

function emptyCart(): Cart {
  return { customerId: 'c1', items: [], loyaltyPoints: 0 };
}
