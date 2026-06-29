export interface OrderItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface PaymentMethod {
  type: 'credit_card' | 'paypal';
  token: string;
}

export interface Order {
  id: string;
  customerId: string;
  customerEmail: string;
  items: OrderItem[];
  paymentMethod: PaymentMethod;
}

export interface ProcessResult {
  orderId: string;
  total: number;
  transactionId: string;
}
