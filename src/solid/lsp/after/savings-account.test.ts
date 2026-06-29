import { describe, it, expect } from 'vitest';
import { SavingsAccount } from './savings-account';
import { WithdrawalError } from './types';
import type { WithdrawableAccount } from './types';

// All tests use WithdrawableAccount — not SavingsAccount directly.
// This proves the contract is fulfilled: any code written against
// WithdrawableAccount works correctly with SavingsAccount.

describe('SavingsAccount as WithdrawableAccount', () => {
  function withdrawFrom(account: WithdrawableAccount, amount: number): void {
    account.withdraw(amount);
  }

  it('succeeds when the balance stays above the minimum', () => {
    const account = new SavingsAccount('S1', 500, 100);
    withdrawFrom(account, 300); // leaves $200, above $100 minimum
    expect(account.getBalance()).toBe(200);
  });

  it('succeeds when withdrawal leaves exactly the minimum balance', () => {
    const account = new SavingsAccount('S1', 300, 100);
    withdrawFrom(account, 200); // leaves exactly $100
    expect(account.getBalance()).toBe(100);
  });

  it('throws WithdrawalError — not a generic Error — when minimum would be breached', () => {
    const account = new SavingsAccount('S1', 200, 100);
    // The WithdrawableAccount contract says rejections are WithdrawalError.
    // Callers who catch WithdrawalError are not surprised — this is the promised exception type.
    expect(() => withdrawFrom(account, 150)).toThrow(WithdrawalError);
    expect(() => withdrawFrom(account, 150)).toThrow('minimum balance');
  });

  it('does not mutate balance when the withdrawal is rejected', () => {
    const account = new SavingsAccount('S1', 150, 100);
    expect(() => withdrawFrom(account, 100)).toThrow(WithdrawalError);
    expect(account.getBalance()).toBe(150); // unchanged
  });
});
