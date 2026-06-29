import type { Order } from './types';

// Single responsibility: validate that an Order is structurally correct before
// any downstream work happens. Only reason to change: validation rules change.

export class OrderValidator {
  validate(order: Order): void {
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
  }
}
