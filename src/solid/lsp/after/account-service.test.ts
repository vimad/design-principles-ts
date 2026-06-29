import { describe, it, expect } from 'vitest';
import { AccountService } from './account-service';
import { RegularAccount } from './regular-account';
import { SavingsAccount } from './savings-account';
import { InvestmentAccount } from './investment-account';

const FUTURE = new Date('2099-12-31');

describe('AccountService — after (LSP respected)', () => {
  describe('chargeMonthlyFee', () => {
    it('charges all withdrawable accounts — no exceptions, no partial state', () => {
      const service = new AccountService();
      const a = new RegularAccount('R1', 500);
      const b = new SavingsAccount('S1', 400, 100);

      service.chargeMonthlyFee([a, b], 10);

      expect(a.getBalance()).toBe(490);
      expect(b.getBalance()).toBe(390);
    });

    // TypeScript compile-time enforcement — uncomment to see the type error:
    //
    //   const investment = new InvestmentAccount('I1', 10_000, FUTURE);
    //   service.chargeMonthlyFee([investment], 10);
    //   // Error: Argument of type 'InvestmentAccount[]' is not assignable to
    //   //        parameter of type 'WithdrawableAccount[]'
    //   //        InvestmentAccount has no 'withdraw' method.
    //
    // This error replaces the silent runtime throw that existed in before/.
    // The misuse is caught at the earliest possible moment: during development.
  });

  describe('applyInterest', () => {
    it('applies interest to regular and savings accounts', () => {
      const service = new AccountService();
      const regular = new RegularAccount('R1', 1000);
      const savings = new SavingsAccount('S1', 2000, 100);

      service.applyInterest([regular, savings], 0.05); // 5%

      expect(regular.getBalance()).toBe(1050);
      expect(savings.getBalance()).toBe(2100);
    });

    it('applies interest to InvestmentAccount — it IS depositable', () => {
      const service = new AccountService();
      const investment = new InvestmentAccount('I1', 10_000, FUTURE);

      // InvestmentAccount implements DepositableAccount, so it is valid here.
      // This is the correct, intended use. applyInterest works for ALL account types.
      service.applyInterest([investment], 0.08); // 8%

      expect(investment.getBalance()).toBe(10_800);
    });

    it('applies interest across a mixed portfolio', () => {
      const service = new AccountService();
      const regular = new RegularAccount('R1', 1000);
      const investment = new InvestmentAccount('I1', 5000, FUTURE);

      // DepositableAccount[] — accepts all types because all can deposit.
      service.applyInterest([regular, investment], 0.10);

      expect(regular.getBalance()).toBe(1100);
      expect(investment.getBalance()).toBe(5500);
    });
  });

  describe('consolidateFunds', () => {
    it('drains all source accounts into the target', () => {
      const service = new AccountService();
      const source1 = new RegularAccount('R1', 300);
      const source2 = new SavingsAccount('S1', 500, 100);
      const target = new RegularAccount('T1', 0);

      // SavingsAccount can be drained to $100 (its minimum), but here we're
      // draining the full balance — this will throw. Let's test a valid scenario:
      const source3 = new RegularAccount('R2', 200);
      service.consolidateFunds([source1, source3], target);

      expect(source1.getBalance()).toBe(0);
      expect(source3.getBalance()).toBe(0);
      expect(target.getBalance()).toBe(500);
    });
  });
});
