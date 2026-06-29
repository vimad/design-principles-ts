import { describe, it, expect } from 'vitest';
import { PricingEngine } from './pricing-engine';
import { PercentageDiscount } from './percentage-discount';
import { FlatDiscount } from './flat-discount';
import { BuyTwoGetOneDiscount } from './buy-two-get-one-discount';
import { LoyaltyDiscount } from './loyalty-discount';
import { CategoryBundleDiscount } from './category-bundle-discount';
import type { Cart } from './types';
import type { DiscountStrategy } from './discount-strategy';

// PricingEngine tests focus on composition and orchestration:
// Does the engine correctly apply, stack, and report strategies?
// It doesn't care what any specific strategy computes — that's each strategy's test.

describe('PricingEngine', () => {
  it('returns the full subtotal when no strategies are configured', () => {
    const engine = new PricingEngine([]);
    const result = engine.calculate(basicCart());
    expect(result.subtotal).toBe(200);
    expect(result.totalDiscount).toBe(0);
    expect(result.finalPrice).toBe(200);
    expect(result.appliedDiscounts).toHaveLength(0);
  });

  it('applies a single strategy and reflects it in the result', () => {
    const engine = new PricingEngine([new FlatDiscount(20)]);
    const result = engine.calculate(basicCart());
    expect(result.finalPrice).toBe(180);
    expect(result.appliedDiscounts).toEqual(['$20 off']);
  });

  it('stacks multiple strategies — discounts accumulate', () => {
    const engine = new PricingEngine([
      new PercentageDiscount(10), // $20 off
      new FlatDiscount(15),       // $15 off
    ]);
    const result = engine.calculate(basicCart());
    expect(result.totalDiscount).toBe(35);
    expect(result.finalPrice).toBe(165);
    expect(result.appliedDiscounts).toHaveLength(2);
  });

  it('omits a strategy from appliedDiscounts when its discount is zero', () => {
    // A strategy that never fires (e.g. loyalty with 0 points)
    const engine = new PricingEngine([new LoyaltyDiscount(), new FlatDiscount(10)]);
    const result = engine.calculate(basicCart()); // loyaltyPoints: 0
    expect(result.appliedDiscounts).toEqual(['$10 off']); // loyalty silently excluded
  });

  it('clamps finalPrice to zero when total discounts exceed the subtotal', () => {
    const engine = new PricingEngine([new FlatDiscount(9999)]);
    const result = engine.calculate(basicCart());
    expect(result.finalPrice).toBe(0);
    expect(result.totalDiscount).toBe(200); // capped at subtotal
  });

  // -------------------------------------------------------------------------
  // OCP's killer test: add a brand-new strategy with ZERO changes to PricingEngine.
  //
  // Imagine the business asks for a "first-time customer" discount one week after
  // shipping. In the before/ version, you edit PricingEngine. Here, you write
  // a new class and hand it in. PricingEngine is unchanged, and all existing
  // tests above continue to pass.
  // -------------------------------------------------------------------------

  it('accepts a custom strategy without any change to PricingEngine', () => {
    const firstTimeBuyer: DiscountStrategy = {
      name: 'First-time customer 12% off',
      apply: (_cart, subtotal) => subtotal * 0.12,
    };
    const engine = new PricingEngine([firstTimeBuyer]);
    const result = engine.calculate(basicCart());
    expect(result.totalDiscount).toBeCloseTo(24); // 12% of 200
    expect(result.appliedDiscounts).toEqual(['First-time customer 12% off']);
  });

  it('integrates all five built-in strategies on a realistic cart', () => {
    // subtotal: 3×$30 + 1×$20 + 1×$10 = $120
    // BOGO:     floor(3/3) × $30 = $30
    // Loyalty:  floor(200/100) × $5 = $10
    // Bundle:   3 categories → 8% × $120 = $9.60
    // Total discount: $49.60   Final: $70.40

    const engine = new PricingEngine([
      new BuyTwoGetOneDiscount(),
      new LoyaltyDiscount(),
      new CategoryBundleDiscount(3, 8),
    ]);

    const richCart: Cart = {
      customerId: 'c1',
      loyaltyPoints: 200,
      items: [
        { productId: 'P1', category: 'electronics', quantity: 3, unitPrice: 30 },
        { productId: 'P2', category: 'clothing',    quantity: 1, unitPrice: 20 },
        { productId: 'P3', category: 'books',       quantity: 1, unitPrice: 10 },
      ],
    };

    const result = engine.calculate(richCart);
    expect(result.subtotal).toBe(120);
    expect(result.totalDiscount).toBeCloseTo(49.6);
    expect(result.finalPrice).toBeCloseTo(70.4);
    expect(result.appliedDiscounts).toHaveLength(3);
  });
});

function basicCart(): Cart {
  return {
    customerId: 'c1',
    loyaltyPoints: 0,
    items: [{ productId: 'P1', category: 'electronics', quantity: 2, unitPrice: 100 }],
  };
}
