import { describe, it, expect } from 'vitest';
import { CategoryBundleDiscount } from './category-bundle-discount';
import type { Cart } from './types';

// These tests need only item categories and a subtotal — no payment, no loyalty points.

describe('CategoryBundleDiscount', () => {
  const strategy = new CategoryBundleDiscount(3, 8);

  it('applies when the cart has exactly 3 distinct categories', () => {
    const cart = cartWithCategories(['electronics', 'clothing', 'books']);
    expect(strategy.apply(cart, 200)).toBeCloseTo(16); // 8% of 200
  });

  it('applies when the cart has more than 3 categories', () => {
    const cart = cartWithCategories(['electronics', 'clothing', 'books', 'toys']);
    expect(strategy.apply(cart, 200)).toBeCloseTo(16);
  });

  it('does not apply when fewer than 3 categories are present', () => {
    const cart = cartWithCategories(['electronics', 'clothing']);
    expect(strategy.apply(cart, 200)).toBe(0);
  });

  it('counts distinct categories — duplicates do not count twice', () => {
    // Three items but only two distinct categories
    const cart = cartWithCategories(['electronics', 'electronics', 'clothing']);
    expect(strategy.apply(cart, 200)).toBe(0);
  });

  it('is configurable — works with different thresholds and rates', () => {
    const lenient = new CategoryBundleDiscount(2, 5); // 2 categories → 5% off
    const cart = cartWithCategories(['electronics', 'clothing']);
    expect(lenient.apply(cart, 200)).toBeCloseTo(10); // 5% of 200
  });

  it('exposes a human-readable name', () => {
    expect(strategy.name).toBe('Category Bundle 8% off');
  });
});

function cartWithCategories(categories: string[]): Cart {
  return {
    customerId: 'c1',
    loyaltyPoints: 0,
    items: categories.map((category, i) => ({
      productId: `P${i}`,
      category,
      quantity: 1,
      unitPrice: 50,
    })),
  };
}
