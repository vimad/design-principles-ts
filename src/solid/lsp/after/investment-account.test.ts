import { describe, it, expect } from 'vitest';
import { InvestmentAccount } from './investment-account';
import type { DepositableAccount } from './types';
// Note: WithdrawableAccount is NOT imported here.
// InvestmentAccount cannot implement it, so there is nothing to test against it.

const FUTURE = new Date('2099-12-31');

describe('InvestmentAccount as DepositableAccount', () => {
  function depositTo(account: DepositableAccount, amount: number): void {
    account.deposit(amount);
  }

  it('accepts deposits — this is its full contract', () => {
    const account = new InvestmentAccount('I1', 10_000, FUTURE);
    depositTo(account, 500);
    expect(account.getBalance()).toBe(10_500);
  });

  it('reports the correct balance', () => {
    const account = new InvestmentAccount('I1', 10_000, FUTURE);
    expect(account.getBalance()).toBe(10_000);
  });

  it('exposes its maturity date for display or scheduling purposes', () => {
    const account = new InvestmentAccount('I1', 10_000, FUTURE);
    expect(account.maturityDate).toEqual(FUTURE);
  });
});

// The test that existed in before/ ("throws when withdraw() is called before maturity")
// no longer exists here — because InvestmentAccount doesn't have a withdraw() method.
// The class cannot express the broken promise; TypeScript removes it from the type.
