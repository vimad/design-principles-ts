import { describe, it, expect } from 'vitest';
import { StripePaymentGateway } from './payment-gateway';

// StripePaymentGateway tests need only a token and an amount.
// No order object, no customer, no inventory state, no email.

describe('StripePaymentGateway', () => {
  const gateway = new StripePaymentGateway();

  it('returns a transaction ID for a successful charge', () => {
    const result = gateway.charge({ type: 'credit_card', token: 'tok_valid' }, 100);
    expect(result.transactionId).toMatch(/^txn_/);
  });

  it('throws a clear error for a declined card', () => {
    expect(() =>
      gateway.charge({ type: 'credit_card', token: 'tok_declined' }, 100)
    ).toThrow('Payment declined: Insufficient funds');
  });

  it('produces a unique transaction ID each time', () => {
    const a = gateway.charge({ type: 'credit_card', token: 'tok_a' }, 50);
    const b = gateway.charge({ type: 'credit_card', token: 'tok_b' }, 50);
    expect(a.transactionId).not.toBe(b.transactionId);
  });
});
