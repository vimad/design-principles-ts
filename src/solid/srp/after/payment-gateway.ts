import type { PaymentMethod } from './types';

// Single responsibility: charge a payment method and return a transaction ID.
// Only reason to change: the payment provider or its protocol changes.

export interface ChargeResult {
  transactionId: string;
}

export interface PaymentGateway {
  charge(method: PaymentMethod, amount: number): ChargeResult;
}

export class StripePaymentGateway implements PaymentGateway {
  charge(method: PaymentMethod, _amount: number): ChargeResult {
    if (method.token === 'tok_declined') {
      throw new Error('Payment declined: Insufficient funds');
    }
    return { transactionId: `txn_${Date.now()}_${Math.floor(Math.random() * 1e9)}` };
  }
}
