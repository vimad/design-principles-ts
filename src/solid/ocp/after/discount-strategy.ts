import type { Cart } from './types';

// The extension point. New promotion types implement this interface.
// PricingEngine never needs to change when a new strategy is added.

export interface DiscountStrategy {
  readonly name: string;
  apply(cart: Cart, subtotal: number): number;
}
