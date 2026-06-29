import { describe, it, expect } from 'vitest';
import { OrderValidator } from './order-validator';
import type { Order } from './types';

// OrderValidator tests need absolutely nothing else:
// no database, no payment gateway, no email server, no inventory.
// This isolation is a direct consequence of SRP — validation is its own concern.

describe('OrderValidator', () => {
  const validator = new OrderValidator();

  it('accepts a valid order', () => {
    expect(() => validator.validate(validOrder())).not.toThrow();
  });

  it('rejects when customer ID is absent', () => {
    expect(() =>
      validator.validate({ ...validOrder(), customerId: '' })
    ).toThrow('Customer ID is required');
  });

  it('rejects an order with no items', () => {
    expect(() =>
      validator.validate({ ...validOrder(), items: [] })
    ).toThrow('Order must contain at least one item');
  });

  it('rejects an item with zero quantity', () => {
    expect(() =>
      validator.validate({
        ...validOrder(),
        items: [{ productId: 'P1', quantity: 0, unitPrice: 50 }],
      })
    ).toThrow('invalid quantity');
  });

  it('rejects an item with a negative quantity', () => {
    expect(() =>
      validator.validate({
        ...validOrder(),
        items: [{ productId: 'P1', quantity: -1, unitPrice: 50 }],
      })
    ).toThrow('invalid quantity');
  });

  it('rejects an item with a zero price', () => {
    expect(() =>
      validator.validate({
        ...validOrder(),
        items: [{ productId: 'P1', quantity: 1, unitPrice: 0 }],
      })
    ).toThrow('invalid price');
  });

  it('rejects an item with a negative price', () => {
    expect(() =>
      validator.validate({
        ...validOrder(),
        items: [{ productId: 'P1', quantity: 1, unitPrice: -10 }],
      })
    ).toThrow('invalid price');
  });
});

function validOrder(): Order {
  return {
    id: 'ord_1',
    customerId: 'cust_1',
    customerEmail: 'alice@example.com',
    items: [{ productId: 'WIDGET-A', quantity: 2, unitPrice: 50 }],
    paymentMethod: { type: 'credit_card', token: 'tok_valid' },
  };
}
