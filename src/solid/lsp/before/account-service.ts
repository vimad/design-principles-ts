import type { BankAccount } from './bank-account';

// Client code that operates on BankAccount.
// It was written against the parent class's promise, not against reality.
// Every method below is a ticking clock: it works until a non-substitutable
// subtype appears in the list.

export interface FeeReport {
  charged: string[];
  failed: Array<{ id: string; reason: string }>;
}

export class AccountService {
  // Intends to charge every account — but InvestmentAccount throws before maturity,
  // leaving accounts after it in the list uncharged (partial mutation).
  chargeMonthlyFee(accounts: BankAccount[], fee: number): void {
    for (const account of accounts) {
      account.withdraw(fee);
    }
  }

  // A defensive variant that catches errors and reports them.
  // The try/catch exists BECAUSE of the LSP violation — without it, one bad account
  // would crash the entire batch. This is accidental complexity forced by broken subtypes.
  chargeMonthlyFeeDefensive(accounts: BankAccount[], fee: number): FeeReport {
    const charged: string[] = [];
    const failed: Array<{ id: string; reason: string }> = [];

    for (const account of accounts) {
      try {
        account.withdraw(fee);
        charged.push(account.id);
      } catch (e) {
        failed.push({ id: account.id, reason: (e as Error).message });
      }
    }

    return { charged, failed };
  }

  // Drain each source into a single target account.
  // Breaks silently for InvestmentAccount — the source balance stays untouched.
  consolidateFunds(sources: BankAccount[], target: BankAccount): void {
    for (const source of sources) {
      const amount = source.getBalance();
      source.transfer(amount, target);
    }
  }
}
