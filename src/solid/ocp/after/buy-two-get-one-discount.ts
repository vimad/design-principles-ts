import type { Cart } from './types';
import type { DiscountStrategy } from './discount-strategy';

// For every 3 units of the same product, one is free.
// Buy 6 → 2 free. Buy 9 → 3 free. Buy 2 → 0 free.
export class BuyTwoGetOneDiscount implements DiscountStrategy {
  readonly name = 'Buy 2 Get 1 Free';

  apply(cart: Cart, _subtotal: number): number {
    return cart.items.reduce((total, item) => {
      const freeUnits = Math.floor(item.quantity / 3);
      return total + freeUnits * item.unitPrice;
    }, 0);
  }
}
