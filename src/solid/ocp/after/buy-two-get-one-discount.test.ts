import { describe, it, expect } from 'vitest';
import { BuyTwoGetOneDiscount } from './buy-two-get-one-discount';
import type { Cart } from './types';

// These tests need only item quantities and prices — nothing else.
// No percentage value, no loyalty points, no categories.

describe('BuyTwoGetOneDiscount', () => {
  const strategy = new BuyTwoGetOneDiscount();

  it('gives one free unit when quantity is 3', () => {
    expect(strategy.apply(cartWith([{ quantity: 3, unitPrice: 20 }]), 0)).toBe(20);
  });

  it('gives two free units when quantity is 6', () => {
    expect(strategy.apply(cartWith([{ quantity: 6, unitPrice: 20 }]), 0)).toBe(40);
  });

  it('gives no discount when quantity is below 3', () => {
    expect(strategy.apply(cartWith([{ quantity: 2, unitPrice: 20 }]), 0)).toBe(0);
  });

  it('ignores remainder units beyond the last complete triplet', () => {
    // qty 5 = one free (from the first 3) + 2 remainder (no second free yet)
    expect(strategy.apply(cartWith([{ quantity: 5, unitPrice: 20 }]), 0)).toBe(20);
  });

  it('applies independently to each line item', () => {
    // P1: qty 3 → 1 free × $20 = $20
    // P2: qty 3 → 1 free × $10 = $10
    const cart = cartWith([
      { quantity: 3, unitPrice: 20 },
      { quantity: 3, unitPrice: 10 },
    ]);
    expect(strategy.apply(cart, 0)).toBe(30);
  });

  it('gives no discount for a single-item cart', () => {
    expect(strategy.apply(cartWith([{ quantity: 1, unitPrice: 50 }]), 0)).toBe(0);
  });
});

function cartWith(items: Array<{ quantity: number; unitPrice: number }>): Cart {
  return {
    customerId: 'c1',
    loyaltyPoints: 0,
    items: items.map((item, i) => ({
      productId: `P${i}`,
      category: 'electronics',
      ...item,
    })),
  };
}
