// Open/Closed Principle violated.
//
// To add any new promotion type (flash sale, referral code, first-purchase bonus…)
// a developer MUST open this file and edit calculate(). There are two places
// that must stay in sync for every new type:
//   1. The PromotionType union — add the new string literal
//   2. The if-else chain — add the new branch
//
// Neither TypeScript nor the compiler will tell you if you miss step 2.
// The promo silently applies a $0 discount and the customer gets nothing.

export type PromotionType =
  | 'percentage'
  | 'flat'
  | 'buy_two_get_one'
  | 'loyalty'
  | 'category_bundle';

export interface Promotion {
  type: PromotionType;
  value?: number; // used by 'percentage' and 'flat'
}

export interface CartItem {
  productId: string;
  category: string;
  quantity: number;
  unitPrice: number;
}

export interface Cart {
  customerId: string;
  items: CartItem[];
  loyaltyPoints: number;
}

export interface PriceResult {
  subtotal: number;
  totalDiscount: number;
  finalPrice: number;
  appliedDiscounts: string[];
}

export class PricingEngine {
  calculate(cart: Cart, promotions: Promotion[]): PriceResult {
    const subtotal = cart.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );

    let totalDiscount = 0;
    const appliedDiscounts: string[] = [];

    for (const promo of promotions) {
      if (promo.type === 'percentage') {
        if (promo.value === undefined) throw new Error('Percentage promo requires a value');
        const discount = subtotal * (promo.value / 100);
        totalDiscount += discount;
        appliedDiscounts.push(`${promo.value}% off`);

      } else if (promo.type === 'flat') {
        if (promo.value === undefined) throw new Error('Flat promo requires a value');
        totalDiscount += promo.value;
        appliedDiscounts.push(`$${promo.value} off`);

      } else if (promo.type === 'buy_two_get_one') {
        // For every 3 units of the same product, one is free
        let discount = 0;
        for (const item of cart.items) {
          const freeUnits = Math.floor(item.quantity / 3);
          discount += freeUnits * item.unitPrice;
        }
        totalDiscount += discount;
        if (discount > 0) appliedDiscounts.push('Buy 2 Get 1 Free');

      } else if (promo.type === 'loyalty') {
        // 100 points = $5 off
        const discount = Math.floor(cart.loyaltyPoints / 100) * 5;
        totalDiscount += discount;
        if (discount > 0) appliedDiscounts.push(`Loyalty: $${discount} off`);

      } else if (promo.type === 'category_bundle') {
        // 3+ distinct categories → 8% off the whole cart
        const uniqueCategories = new Set(cart.items.map(i => i.category));
        if (uniqueCategories.size >= 3) {
          const discount = subtotal * 0.08;
          totalDiscount += discount;
          appliedDiscounts.push('Category Bundle 8% off');
        }
      }
      // ← Every new promotion type means another else-if here.
      //   Editing an already-shipped, already-tested method to add new behaviour.
    }

    totalDiscount = Math.min(totalDiscount, subtotal);
    const finalPrice = subtotal - totalDiscount;
    return { subtotal, totalDiscount, finalPrice, appliedDiscounts };
  }
}
