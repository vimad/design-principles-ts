import type { Order, ProcessResult } from './types';
import type { InventoryService } from './inventory-service';
import type { PaymentGateway } from './payment-gateway';
import type { OrderRepository } from './order-repository';
import type { NotificationService } from './notification-service';
import { OrderValidator } from './order-validator';

// Single responsibility: orchestrate the order processing sequence.
// Only reason to change: the sequence or coordination between steps changes.
//
// It does NOT know how validation works, which payment provider is used,
// what database stores orders, or what channel sends notifications.
// Each collaborator is injected — swappable without touching this class.

export class OrderProcessor {
  constructor(
    private readonly validator: OrderValidator,
    private readonly inventory: InventoryService,
    private readonly payment: PaymentGateway,
    private readonly repository: OrderRepository,
    private readonly notifications: NotificationService,
  ) {}

  process(order: Order): ProcessResult {
    this.validator.validate(order);
    this.inventory.checkAvailability(order.items);

    const total = order.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );

    const { transactionId } = this.payment.charge(order.paymentMethod, total);
    this.inventory.deductStock(order.items);

    const orderId = this.repository.save(order, transactionId);
    this.notifications.orderConfirmed(order.customerEmail, orderId, total);

    return { orderId, total, transactionId };
  }
}
