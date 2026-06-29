import { describe, it, expect } from 'vitest';
import { RegularAccount, SavingsAccount, InvestmentAccount } from './bank-account';
import { AccountService } from './account-service';

// ---------------------------------------------------------------------------
// The LSP substitution test: replace BankAccount with each subtype and
// observe whether the behaviour stays within the parent's promise.
//
// PARENT'S PROMISE: withdraw(amount) succeeds when amount > 0 and amount <= balance.
//
// This suite deliberately tries the same logical operation on different subtypes.
// A well-designed type hierarchy passes all substitution tests.
// This one does not.
// ---------------------------------------------------------------------------

const FUTURE = new Date('2099-12-31');

describe('Substitution tests — before (LSP violated)', () => {
  // The helper represents "code written against BankAccount" — a client
  // that trusts the parent's promise before calling withdraw().
  function safeWithdraw(account: RegularAccount | SavingsAccount | InvestmentAccount, amount: number) {
    // Caller did their due diligence: checked amount > 0 and amount <= balance.
    if (amount <= 0 || amount > account.getBalance()) {
      throw new Error('Caller pre-check failed');
    }
    account.withdraw(amount); // Should succeed — parent promised it would.
  }

  it('RegularAccount — substitution holds', () => {
    const account = new RegularAccount('R1', 500);
    expect(() => safeWithdraw(account, 100)).not.toThrow();
    expect(account.getBalance()).toBe(400);
  });

  it('SavingsAccount — substitution breaks when minimum balance is threatened', () => {
    // balance: $200, minimum: $100, amount: $150 → leaves $50, below minimum
    // Caller checked: amount(150) <= balance(200) ✓ — but it still throws.
    const account = new SavingsAccount('S1', 200, 100);
    expect(() => safeWithdraw(account, 150)).toThrow('minimum balance');
    // The parent's promise was broken. The caller's pre-check was not enough.
  });

  it('InvestmentAccount — substitution always breaks before maturity', () => {
    const account = new InvestmentAccount('I1', 10_000, FUTURE);
    // balance: $10,000, amount: $100 — perfectly valid by the parent's rules
    expect(() => safeWithdraw(account, 100)).toThrow('before its maturity date');
    // The parent's promise was broken completely. No amount of caller diligence helps.
  });
});

describe('AccountService — partial state when LSP is violated', () => {
  it('charges all regular accounts without issue', () => {
    const service = new AccountService();
    const accounts = [
      new RegularAccount('R1', 500),
      new RegularAccount('R2', 300),
    ];
    service.chargeMonthlyFee(accounts, 10);
    expect(accounts[0]?.getBalance()).toBe(490);
    expect(accounts[1]?.getBalance()).toBe(290);
  });

  it('leaves accounts in partial state when an InvestmentAccount is in the list', () => {
    const service = new AccountService();
    const regular = new RegularAccount('R1', 500);
    const investment = new InvestmentAccount('I1', 10_000, FUTURE);

    // The type signature accepts this — both are BankAccount.
    // But the runtime throws midway through the loop, leaving `regular` charged
    // and `investment` untouched. This is a data integrity problem.
    expect(() =>
      service.chargeMonthlyFee([regular, investment], 10)
    ).toThrow('before its maturity date');

    expect(regular.getBalance()).toBe(490);   // was charged
    expect(investment.getBalance()).toBe(10_000); // was NOT charged — loop never got there...
    // Actually investment comes second, so regular was charged first, then investment threw.
    // The fee batch is permanently incomplete. No rollback. No signal to the caller.
  });

  it('defensive variant forces callers to handle errors that should not exist', () => {
    const service = new AccountService();
    const accounts = [
      new RegularAccount('R1', 500),
      new InvestmentAccount('I1', 10_000, FUTURE),
    ];

    // The try/catch inside chargeMonthlyFeeDefensive is only there because subtypes lie.
    // Without LSP violations, this defensive logic is dead code.
    const report = service.chargeMonthlyFeeDefensive(accounts, 10);
    expect(report.charged).toEqual(['R1']);
    expect(report.failed[0]?.id).toBe('I1');
    expect(report.failed[0]?.reason).toMatch('before its maturity date');
  });
});
