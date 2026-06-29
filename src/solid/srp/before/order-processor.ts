// This class has five reasons to change — one for each responsibility mixed in:
//   1. Business changes validation rules
//   2. Warehouse team changes their inventory system
//   3. Finance team switches payment providers
//   4. Backend team changes DB schema or storage layer
//   5. Marketing adds SMS or changes the email template
//
// Any one of those changes forces an edit to this class, even though the other
// four responsibilities are completely untouched.

interface OrderItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

interface PaymentMethod {
  type: 'credit_card' | 'paypal';
  token: string;
}

interface Order {
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

export class OrderProcessor {
  process(order: Order): ProcessResult {
    // ---- Responsibility 1: Input validation ----
    if (!order.customerId) {
      throw new Error('Customer ID is required');
    }
    if (order.items.length === 0) {
      throw new Error('Order must contain at least one item');
    }
    for (const item of order.items) {
      if (item.quantity <= 0) {
        throw new Error(`Item ${item.productId} has invalid quantity`);
      }
      if (item.unitPrice <= 0) {
        throw new Error(`Item ${item.productId} has invalid price`);
      }
    }

    // ---- Responsibility 2: Inventory ----
    for (const item of order.items) {
      const available = this.fetchStockLevel(item.productId);
      if (available < item.quantity) {
        throw new Error(
          `Insufficient stock for ${item.productId}: need ${item.quantity}, have ${available}`
        );
      }
    }

    // ---- Responsibility 3: Payment ----
    const total = order.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    const charge = this.chargePayment(order.paymentMethod, total);
    if (!charge.approved) {
      throw new Error(`Payment declined: ${charge.reason}`);
    }

    // Deduct stock only after payment succeeds
    for (const item of order.items) {
      this.deductStock(item.productId, item.quantity);
    }

    // ---- Responsibility 4: Persistence ----
    const orderId = this.saveOrder(order, charge.transactionId);

    // ---- Responsibility 5: Notification ----
    this.sendConfirmationEmail(order.customerEmail, orderId, total);

    return { orderId, total, transactionId: charge.transactionId };
  }

  private fetchStockLevel(productId: string): number {
    // Hardcoded — cannot be swapped for a real DB or a test double
    const inventory: Record<string, number> = {
      'WIDGET-A': 50,
      'WIDGET-B': 3,
    };
    return inventory[productId] ?? 0;
  }

  private chargePayment(
    method: PaymentMethod,
    _amount: number
  ): { approved: boolean; transactionId: string; reason: string } {
    // Hardcoded payment logic — cannot swap providers without changing this class
    if (method.token === 'tok_declined') {
      return { approved: false, transactionId: '', reason: 'Insufficient funds' };
    }
    return { approved: true, transactionId: `txn_${Date.now()}`, reason: '' };
  }

  private deductStock(productId: string, quantity: number): void {
    console.log(`[DB] Deducted ${quantity} units of ${productId}`);
  }

  private saveOrder(order: Order, transactionId: string): string {
    console.log(`[DB] Saved order for customer ${order.customerId}, txn ${transactionId}`);
    return `ord_${Date.now()}`;
  }

  private sendConfirmationEmail(email: string, orderId: string, total: number): void {
    console.log(`[SMTP] Sent confirmation to ${email}: order ${orderId}, total $${total.toFixed(2)}`);
  }
}
