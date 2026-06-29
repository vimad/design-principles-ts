import type { Cart } from './types';
import type { DiscountStrategy } from './discount-strategy';

export class PercentageDiscount implements DiscountStrategy {
  readonly name: string;

  constructor(private readonly percent: number) {
    this.name = `${percent}% off`;
  }

  apply(_cart: Cart, subtotal: number): number {
    return subtotal * (this.percent / 100);
  }
}
