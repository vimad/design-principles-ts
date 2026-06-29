// Interfaces replace the single abstract class.
// Each interface makes an honest promise — only about what the implementor actually does.
//
// The key insight: "Account" and "account you can withdraw from" are different concepts.
// Conflating them into one class was the root cause of the LSP violations.

export interface Account {
  readonly id: string;
  getBalance(): number;
}

// Promise: deposit(amount) increases balance by amount.
// Always succeeds for amount > 0. No implementor may weaken this.
export interface DepositableAccount extends Account {
  deposit(amount: number): void;
}

// Promise: withdraw(amount) reduces balance by amount, or throws WithdrawalError
// if the account's own rules prevent it (insufficient funds, minimum balance, etc.).
// Note: the exception type is part of the contract — callers know what to expect.
export interface WithdrawableAccount extends Account {
  withdraw(amount: number): void;
}

export class WithdrawalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WithdrawalError';
  }
}
