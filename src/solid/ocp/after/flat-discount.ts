import type { Cart } from './types';
import type { DiscountStrategy } from './discount-strategy';

export class FlatDiscount implements DiscountStrategy {
  readonly name: string;

  constructor(private readonly amount: number) {
    this.name = `$${amount} off`;
  }

  apply(_cart: Cart, _subtotal: number): number {
    return this.amount;
  }
}
