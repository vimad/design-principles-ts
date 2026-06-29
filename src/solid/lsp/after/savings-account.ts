import { WithdrawalError } from './types';
import type { DepositableAccount, WithdrawableAccount } from './types';

// SavingsAccount implements WithdrawableAccount — it CAN be withdrawn from.
// Its minimum balance rule is a legitimate rejection reason, not a broken promise.
// The WithdrawableAccount contract says "throws WithdrawalError if rules prevent it" —
// SavingsAccount fulfils that contract exactly. Callers are not surprised.
export class SavingsAccount implements DepositableAccount, WithdrawableAccount {
  private balance: number;

  constructor(
    readonly id: string,
    initialBalance: number,
    private readonly minimumBalance = 100,
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
    if (this.balance - amount < this.minimumBalance) {
      throw new WithdrawalError(
        `Withdrawal would breach the minimum balance of $${this.minimumBalance}`
      );
    }
    this.balance -= amount;
  }
}
