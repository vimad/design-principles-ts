import type { DepositableAccount } from './types';

// InvestmentAccount implements ONLY DepositableAccount.
// It deliberately does NOT implement WithdrawableAccount.
// This is not a limitation — it is an accurate description of what this account does.
//
// The TypeScript compiler now prevents InvestmentAccount from being passed to any
// function that requires withdrawal capability. The misuse that silently compiled
// before (but crashed at runtime) is now a compile-time error.
export class InvestmentAccount implements DepositableAccount {
  private balance: number;

  constructor(
    readonly id: string,
    initialBalance: number,
    readonly maturityDate: Date,
  ) {
    this.balance = initialBalance;
  }

  getBalance(): number {
    return this.balance;
  }

  deposit(amount: number): void {
    if (amount <= 0) throw new Error('Amount must be positive');
    this.balance += amount;
  }
}
