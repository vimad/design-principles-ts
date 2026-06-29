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
