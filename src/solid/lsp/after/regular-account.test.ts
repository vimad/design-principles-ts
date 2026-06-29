import { describe, it, expect } from 'vitest';
import { RegularAccount } from './regular-account';
import { WithdrawalError } from './types';
import type { DepositableAccount, WithdrawableAccount } from './types';

// Proves RegularAccount is substitutable for both interfaces it claims to implement.

describe('RegularAccount as DepositableAccount', () => {
  function depositTo(account: DepositableAccount, amount: number): void {
    account.deposit(amount);
  }

  it('increases balance on deposit', () => {
    const account = new RegularAccount('R1', 200);
    depositTo(account, 100);
    expect(account.getBalance()).toBe(300);
  });
});

describe('RegularAccount as WithdrawableAccount', () => {
  function withdrawFrom(account: WithdrawableAccount, amount: number): void {
    account.withdraw(amount);
  }

  it('decreases balance on withdrawal', () => {
    const account = new RegularAccount('R1', 500);
    withdrawFrom(account, 100);
    expect(account.getBalance()).toBe(400);
  });

  it('throws WithdrawalError on insufficient funds', () => {
    const account = new RegularAccount('R1', 50);
    expect(() => withdrawFrom(account, 100)).toThrow(WithdrawalError);
  });

  it('allows withdrawing the entire balance', () => {
    const account = new RegularAccount('R1', 100);
    withdrawFrom(account, 100);
    expect(account.getBalance()).toBe(0);
  });
});
