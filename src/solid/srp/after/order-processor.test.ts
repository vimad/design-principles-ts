import { describe, it, expect, vi } from 'vitest';
import { OrderProcessor } from './order-processor';
import { OrderValidator } from './order-validator';
import { WarehouseInventoryService } from './inventory-service';
import { StripePaymentGateway } from './payment-gateway';
import { InMemoryOrderRepository } from './order-repository';
import type { NotificationService } from './notification-service';
import type { Order } from './types';

// ---------------------------------------------------------------------------
// OrderProcessor tests focus purely on orchestration: does it call collaborators
// in the right order, pass the right data between them, and handle failures?
//
// Notice what changed compared to the before/ tests:
//
//  - NotificationService is a vi.fn() — we can assert it was (or wasn't) called.
//    In before/, there was no way to observe whether email was sent at all.
//
//  - We control the starting inventory explicitly via the constructor.
//    In before/, tests had to know which products were in the internal fixture.
//
//  - Each test reads as: "given this setup, does the orchestrator behave correctly?"
//    None of them care about payment internals, validation rules, or email templates.
// ---------------------------------------------------------------------------

describe('OrderProcessor', () => {
  it('returns the total, orderId, and transactionId for a valid order', () => {
    const { processor } = build();

    const result = processor.process(order());

    expect(result.total).toBe(100);
    expect(result.orderId).toBe('ord_1');
    expect(result.transactionId).toMatch(/^txn_/);
  });

  it('sends a confirmation notification after a successful order', () => {
    const { processor, notifications } = build();

    processor.process(order());

    expect(notifications.orderConfirmed).toHaveBeenCalledOnce();
    expect(notifications.orderConfirmed).toHaveBeenCalledWith(
      'alice@example.com',
      'ord_1',
      100
    );
  });

  it('does not persist the order when payment is declined', () => {
    const { processor, repository } = build();

    expect(() =>
      processor.process(order({ paymentToken: 'tok_declined' }))
    ).toThrow('Payment declined');

    expect(repository.all()).toHaveLength(0);
  });

  it('does not send a notification when payment is declined', () => {
    const { processor, notifications } = build();

    expect(() =>
      processor.process(order({ paymentToken: 'tok_declined' }))
    ).toThrow('Payment declined');

    expect(notifications.orderConfirmed).not.toHaveBeenCalled();
  });

  it('rejects invalid orders before touching payment or inventory', () => {
    const { processor, notifications } = build();

    expect(() =>
      processor.process(order({ customerId: '' }))
    ).toThrow('Customer ID is required');

    expect(notifications.orderConfirmed).not.toHaveBeenCalled();
  });

  it('accumulates the correct total across multiple line items', () => {
    const { processor } = build();

    const result = processor.process({
      ...order(),
      items: [
        { productId: 'WIDGET-A', quantity: 2, unitPrice: 30 },
        { productId: 'WIDGET-B', quantity: 1, unitPrice: 20 },
      ],
    });

    expect(result.total).toBe(80);
  });
});

// ---- Helpers ----

function order(overrides?: { paymentToken?: string; customerId?: string }): Order {
  return {
    id: 'ord_test',
    customerId: overrides?.customerId ?? 'cust_1',
    customerEmail: 'alice@example.com',
    items: [{ productId: 'WIDGET-A', quantity: 2, unitPrice: 50 }],
    paymentMethod: {
      type: 'credit_card',
      token: overrides?.paymentToken ?? 'tok_valid',
    },
  };
}

function build() {
  const repository = new InMemoryOrderRepository();
  const notifications: NotificationService = { orderConfirmed: vi.fn() };

  const processor = new OrderProcessor(
    new OrderValidator(),
    new WarehouseInventoryService({ 'WIDGET-A': 50, 'WIDGET-B': 10 }),
    new StripePaymentGateway(),
    repository,
    notifications,
  );

  return { processor, repository, notifications };
}
