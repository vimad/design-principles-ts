import { WithdrawalError } from './types';
import type { DepositableAccount, WithdrawableAccount } from './types';

export class RegularAccount implements DepositableAccount, WithdrawableAccount {
  private balance: number;

  constructor(
    readonly id: string,
    initialBalance: number,
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

  withdraw(amount: number): void {
    if (amount <= 0) throw new Error('Amount must be positive');
    if (amount > this.balance) throw new WithdrawalError('Insufficient funds');
    this.balance -= amount;
  }
}
