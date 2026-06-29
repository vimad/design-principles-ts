import { describe, it, expect } from 'vitest';
import { PricingEngine } from './pricing-engine';
import type { Cart } from './pricing-engine';

// -----------------------------------------------------------------------
// Testing friction from OCP violation:
//
// PROBLEM 1 — No way to test a single promotion type in true isolation.
//   Testing BOGO still routes through the full calculate() method,
//   past all the other if-else branches. Any bug in an unrelated branch
//   could contaminate BOGO test failures.
//
// PROBLEM 2 — Testing a NEW promotion type is impossible before it's wired in.
//   You cannot write a test for 'flash_sale' until you've already modified
//   PricingEngine to handle it. Test-first is blocked.
//
// PROBLEM 3 — Misspelling a promo type silently does nothing.
//   'percentege' passes TypeScript if cast to any; at runtime the promo
//   applies $0 discount with no error, no log, no warning.
//
// PROBLEM 4 — Every new feature is a modification risk.
//   Adding 'referral_code' logic is an edit to an already-shipped, already-
//   tested method. Any typo could break the percentage or loyalty branch.
// -----------------------------------------------------------------------

describe('PricingEngine — before (OCP violated)', () => {
  it('applies a percentage discount', () => {
    const engine = new PricingEngine();
    const result = engine.calculate(basicCart(), [{ type: 'percentage', value: 10 }]);
    expect(result.subtotal).toBe(200);
    expect(result.finalPrice).toBe(180);
    expect(result.appliedDiscounts).toEqual(['10% off']);
  });

  it('applies a flat discount', () => {
    const engine = new PricingEngine();
    const result = engine.calculate(basicCart(), [{ type: 'flat', value: 25 }]);
    expect(result.finalPrice).toBe(175);
  });

  it('applies buy-two-get-one (pay for 2, receive 3)', () => {
    const engine = new PricingEngine();
    const cart: Cart = {
      customerId: 'c1',
      loyaltyPoints: 0,
      items: [{ productId: 'P1', category: 'electronics', quantity: 3, unitPrice: 30 }],
    };
    const result = engine.calculate(cart, [{ type: 'buy_two_get_one' }]);
    expect(result.subtotal).toBe(90);
    expect(result.finalPrice).toBe(60);
  });

  it('applies a loyalty discount (100 points = $5)', () => {
    const engine = new PricingEngine();
    const result = engine.calculate(
      { ...basicCart(), loyaltyPoints: 200 },
      [{ type: 'loyalty' }]
    );
    expect(result.finalPrice).toBe(190);
  });

  it('applies category bundle discount when 3+ categories present', () => {
    const engine = new PricingEngine();
    const cart: Cart = {
      customerId: 'c1',
      loyaltyPoints: 0,
      items: [
        { productId: 'P1', category: 'electronics', quantity: 1, unitPrice: 100 },
        { productId: 'P2', category: 'clothing',    quantity: 1, unitPrice: 50 },
        { productId: 'P3', category: 'books',       quantity: 1, unitPrice: 50 },
      ],
    };
    const result = engine.calculate(cart, [{ type: 'category_bundle' }]);
    expect(result.subtotal).toBe(200);
    expect(result.finalPrice).toBeCloseTo(184); // 8% off
  });

  it('stacks two promotions', () => {
    const engine = new PricingEngine();
    const result = engine.calculate(basicCart(), [
      { type: 'percentage', value: 10 },
      { type: 'flat', value: 15 },
    ]);
    expect(result.totalDiscount).toBe(35);
    expect(result.finalPrice).toBe(165);
  });

  // What we CANNOT do without modifying PricingEngine:
  // - Write a test for 'flash_sale' before adding the if-else
  // - Test BOGO logic without going through the entire calculate() method
  // - Add a 'referral_code' promo without risking breaking percentage/flat/loyalty
  // - Verify that ALL promotion types are handled — there is no exhaustiveness check
});

function basicCart(): Cart {
  return {
    customerId: 'c1',
    loyaltyPoints: 0,
    items: [{ productId: 'P1', category: 'electronics', quantity: 2, unitPrice: 100 }],
  };
}
