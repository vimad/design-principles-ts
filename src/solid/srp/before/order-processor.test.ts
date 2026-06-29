import { describe, it, expect } from 'vitest';
import { OrderProcessor } from './order-processor';
import type { ProcessResult } from './order-processor';

// ---------------------------------------------------------------------------
// Notice the testing friction that SRP violation creates:
//
// PROBLEM 1 — You can't test any single concern in isolation.
//   To test that a declined payment is handled, the order must first survive
//   validation AND the inventory check. Every test must build a fully valid
//   order that satisfies ALL five responsibilities simultaneously.
//
// PROBLEM 2 — The internals are sealed behind private methods.
//   There is no seam to inject a different inventory dataset, a different
//   payment provider, or a spy on the email sender. The tests are locked to
//   the hardcoded fixtures inside the class.
//
// PROBLEM 3 — Side effects fire on every test.
//   Every passing test prints "[DB]" and "[SMTP]" noise to the console.
//   You cannot assert that the email was (or wasn't) sent.
//
// PROBLEM 4 — Tests know too much about internals.
//   The inventory test must pick 'WIDGET-B' because it happens to have low
//   stock in the private fixture. Change the fixture, the test silently breaks.
// ---------------------------------------------------------------------------

const validOrder = {
  id: 'ord_1',
  customerId: 'cust_1',
  customerEmail: 'alice@example.com',
  items: [{ productId: 'WIDGET-A', quantity: 2, unitPrice: 50 }],
  paymentMethod: { type: 'credit_card' as const, token: 'tok_valid' },
};

describe('OrderProcessor — before (SRP violated)', () => {
  it('processes a valid order end-to-end', () => {
    const processor = new OrderProcessor();
    const result: ProcessResult = processor.process(validOrder);
    expect(result.total).toBe(100);
    expect(result.orderId).toMatch(/^ord_/);
  });

  // To test validation, we still need a product that exists in the hardcoded
  // inventory and a valid payment token — even though neither is relevant here.
  it('rejects an order with no customer ID', () => {
    const processor = new OrderProcessor();
    expect(() =>
      processor.process({ ...validOrder, customerId: '' })
    ).toThrow('Customer ID is required');
  });

  it('rejects an order with no items', () => {
    const processor = new OrderProcessor();
    expect(() =>
      processor.process({ ...validOrder, items: [] })
    ).toThrow('Order must contain at least one item');
  });

  // To test inventory, we must know which product has low stock in the
  // private fixture. This leaks internal knowledge into the test.
  it('rejects when stock is insufficient', () => {
    const processor = new OrderProcessor();
    expect(() =>
      processor.process({
        ...validOrder,
        items: [{ productId: 'WIDGET-B', quantity: 10, unitPrice: 50 }],
      })
    ).toThrow('Insufficient stock');
  });

  // To test payment decline, the order must first pass validation AND
  // inventory — so we must use WIDGET-A which happens to have enough stock.
  it('rejects a declined payment', () => {
    const processor = new OrderProcessor();
    expect(() =>
      processor.process({
        ...validOrder,
        paymentMethod: { type: 'credit_card', token: 'tok_declined' },
      })
    ).toThrow('Payment declined');
  });

  // What we CANNOT test at all:
  // - Whether the confirmation email was actually sent
  // - What happens if the DB save fails after payment succeeds
  // - OrderProcessor with a different payment provider (e.g., PayPal)
  // - OrderProcessor with a real or different inventory backend
  // - Adding an SMS notification without touching this class
});
