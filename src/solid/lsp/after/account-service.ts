import type { DepositableAccount, WithdrawableAccount } from './types';

// AccountService now uses capability interfaces instead of a base class.
// Each method's parameter type is exactly as broad as the method needs — no more.
//
// chargeMonthlyFee: needs WithdrawableAccount[] — InvestmentAccount can never be here.
// applyInterest: needs DepositableAccount[] — ALL account types qualify.
// consolidateFunds: source needs WithdrawableAccount, target needs DepositableAccount.
//
// The try/catch that existed in before/account-service.ts is gone. It was defensive
// code forced by LSP violations. Here, the type system makes it impossible to pass
// an account that cannot fulfil the operation.

export class AccountService {
  chargeMonthlyFee(accounts: WithdrawableAccount[], fee: number): void {
    for (const account of accounts) {
      account.withdraw(fee);
    }
  }

  applyInterest(accounts: DepositableAccount[], annualRate: number): void {
    for (const account of accounts) {
      const interest = Math.floor(account.getBalance() * annualRate);
      account.deposit(interest);
    }
  }

  consolidateFunds(
    sources: WithdrawableAccount[],
    target: DepositableAccount,
  ): void {
    for (const source of sources) {
      const amount = source.getBalance();
      source.withdraw(amount);
      target.deposit(amount);
    }
  }
}
