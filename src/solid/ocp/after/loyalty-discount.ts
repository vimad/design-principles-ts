import type { Cart } from './types';
import type { DiscountStrategy } from './discount-strategy';

const POINTS_PER_REWARD = 100;
const REWARD_VALUE = 5;

export class LoyaltyDiscount implements DiscountStrategy {
  readonly name = 'Loyalty Points';

  apply(cart: Cart, _subtotal: number): number {
    return Math.floor(cart.loyaltyPoints / POINTS_PER_REWARD) * REWARD_VALUE;
  }
}
