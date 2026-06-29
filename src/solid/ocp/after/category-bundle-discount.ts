import type { Cart } from './types';
import type { DiscountStrategy } from './discount-strategy';

// Configurable: requires N distinct categories → applies X% off.
// e.g. new CategoryBundleDiscount(3, 8) = "3 categories → 8% off"
export class CategoryBundleDiscount implements DiscountStrategy {
  readonly name: string;

  constructor(
    private readonly requiredCategories: number,
    private readonly discountPercent: number,
  ) {
    this.name = `Category Bundle ${discountPercent}% off`;
  }

  apply(cart: Cart, subtotal: number): number {
    const uniqueCategories = new Set(cart.items.map(item => item.category));
    if (uniqueCategories.size < this.requiredCategories) {
      return 0;
    }
    return subtotal * (this.discountPercent / 100);
  }
}
