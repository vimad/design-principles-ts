import type { Cart, PriceResult } from './types';
import type { DiscountStrategy } from './discount-strategy';

// Closed for modification: this class never needs to change when a new
// promotion type is introduced.
// Open for extension: pass in any DiscountStrategy implementation.

export class PricingEngine {
  constructor(private readonly strategies: DiscountStrategy[]) {}

  calculate(cart: Cart): PriceResult {
    const subtotal = cart.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );

    let totalDiscount = 0;
    const appliedDiscounts: string[] = [];

    for (const strategy of this.strategies) {
      const discount = strategy.apply(cart, subtotal);
      if (discount > 0) {
        totalDiscount += discount;
        appliedDiscounts.push(strategy.name);
      }
    }

    totalDiscount = Math.min(totalDiscount, subtotal);
    const finalPrice = subtotal - totalDiscount;

    return { subtotal, totalDiscount, finalPrice, appliedDiscounts };
  }
}
