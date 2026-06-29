# LSP — Liskov Substitution Principle

## Definition

If `S` is a subtype of `T`, objects of type `T` may be replaced with objects of type `S` without altering any of the correct behaviour of the program.

In plain terms: **a subtype must honour every promise the parent type makes**. If calling code works correctly with the parent, it must work correctly with any child — without needing to know which child it's dealing with.

---

## The Example: Bank Account Hierarchy

Domain: a banking system with three account types.

### The inherited promise and who breaks it

`BankAccount.withdraw(amount)` makes this promise:
> If `amount > 0` and `amount <= balance`, the withdrawal succeeds and balance is reduced.

| Subclass | What it does | Verdict |
|---|---|---|
| `RegularAccount` | Honours the promise fully | ✓ Substitutable |
| `SavingsAccount` | Adds a minimum-balance restriction — throws when parent said it would succeed | ✗ Strengthened precondition |
| `InvestmentAccount` | Always throws before maturity — ignores the precondition entirely | ✗ Postcondition never delivered |

### Why `SavingsAccount` is the harder case to spot

`SavingsAccount` feels correct. Savings accounts *do* have minimum balances. But look at what this means from a caller's perspective:

```typescript
function processWithdrawal(account: BankAccount, amount: number): void {
  if (amount > 0 && amount <= account.getBalance()) {
    account.withdraw(amount); // caller checked everything the parent promised
  }
}
```

This function is correct for `RegularAccount`. But call it with a `SavingsAccount` where `balance = $200`, `minimumBalance = $100`, and `amount = $150`. The caller's checks pass. The withdrawal still throws. **The caller followed the parent's rules and still got burned.**

### The data integrity problem

`AccountService.chargeMonthlyFee(accounts: BankAccount[], fee: number)` iterates and calls `withdraw()` on each account. If `InvestmentAccount` is in position 3 of a 5-account list:

- Accounts 1 and 2: charged ✓
- Account 3: throws — loop aborts
- Accounts 4 and 5: **never charged**

The fee batch is permanently incomplete. No rollback. No indication to the caller of which accounts were affected. This data integrity hazard is a direct consequence of the LSP violation — the type system promised safety that the runtime couldn't deliver.

### The defensive try/catch smell

`AccountService.chargeMonthlyFeeDefensive` uses a try/catch around every withdrawal. Look at why it exists: it is *required* because subtypes lie. Without LSP violations, that defensive code is unnecessary. When you find yourself adding try/catch around calls to a parent-class method, ask whether a subtype is breaking a promise.

---

## What the `after/` Version Does Instead

Replace the single abstract class with interfaces that make honest, minimal promises:

```
Account                  → id + getBalance()
DepositableAccount       → + deposit()    (all three account types implement this)
WithdrawableAccount      → + withdraw()   (RegularAccount + SavingsAccount only)
```

`InvestmentAccount` does NOT implement `WithdrawableAccount` — because it is not one. This is not a shortcoming; it is an accurate description.

```typescript
// Before — compiles, throws at runtime:
service.chargeMonthlyFee([investment], 10);

// After — TypeScript error at development time:
// Argument of type 'InvestmentAccount[]' is not assignable to
// parameter of type 'WithdrawableAccount[]'
// InvestmentAccount has no 'withdraw' method.
```

The partial-state data integrity problem disappears: the type system prevents invalid lists from being constructed.

### Is `SavingsAccount` still an LSP violation?

In the `after/` version, `SavingsAccount` implements `WithdrawableAccount`, whose contract explicitly says:
> "Throws `WithdrawalError` if the account's own rules prevent the withdrawal."

`SavingsAccount`'s minimum-balance rejection is now part of the contract — not a surprise. Callers who catch `WithdrawalError` handle it correctly. The parent's promise and the subtype's behaviour are aligned.

The key difference from `before/`: the **exception type** is specified and consistent. In `before/`, `SavingsAccount` threw a generic `Error` that callers couldn't reliably catch without checking the message. In `after/`, it throws `WithdrawalError` — a documented, catchable type.

---

## How LSP Improves Testability

**Before**: the tests in `bank-account.test.ts` need to set up the same logical scenario three times (once per account type) to discover which subtypes honour the contract. The pattern `expect(() => safeWithdraw(account, 100)).not.toThrow()` vs `.toThrow()` is the smell — the same code should produce the same result for every subtype.

**After**: each account type's test file writes the same helper `withdrawFrom(account: WithdrawableAccount, ...)` and the test passes for every implementation. `InvestmentAccount` simply has no withdrawal test because there is no `withdraw()` to test. The class surface area matches the real behaviour.

The `@ts-expect-error` comment in `account-service.test.ts` is deliberately left to show where the TypeScript compile error now lives — where the misuse used to compile silently.

---

## The Reverse Direction: Testability as a Design Signal

The first symptom appears in the test:

> "I want to test `chargeMonthlyFee` with a list of mixed account types. But I have to wrap it in try/catch to avoid the test blowing up when `InvestmentAccount` is in the list."

That reluctance is the test revealing an LSP violation. The moment you write a try/catch in a test to tolerate an unexpected exception from a subtype, the subtype is breaking a promise.

The natural fix when trying to make the test clean: "I should require that the list only contains accounts that actually support withdrawal." That is LSP, arrived at through test pressure.

---

## Connection to SRP and OCP

- **SRP**: `BankAccount` in `before/` has multiple reasons to change — regular rules, savings rules, investment rules. The `after/` separates these into distinct classes.
- **OCP**: The `before/` `AccountService` is implicitly open for modification — every new account type that breaks the contract forces a defensive change to the service. The `after/` service is closed; new account types that implement the right interfaces work without touching it.
- **DIP** (coming next): `AccountService` now depends on interfaces (`WithdrawableAccount`, `DepositableAccount`), not on concrete classes. This is DIP, and it emerges naturally from fixing LSP.

---

## When to Apply LSP

- When a subclass overrides a method to throw `UnsupportedOperationException` (or equivalent) — the IS-A claim is wrong
- When client code requires type-checking (`instanceof`) before calling a method — the hierarchy is broken
- When adding a new subtype to a list causes existing operations to fail for some members
- When you need a try/catch just to handle "that one subtype"

## When NOT to Over-Apply It

- **Not every exception is a violation.** `InsufficientFundsError` from `withdraw()` is fine — it's in the contract. `MaturityDateError` from `withdraw()` is NOT fine — it makes the method unpredictably conditional.
- **Interface segregation vs LSP.** Sometimes the right fix is ISP (split the interface, as we did here) rather than redesigning the class hierarchy. ISP and LSP are frequently solved together.
- **Don't force IS-A.** If you're adding extra flags or `if type === X` checks to make a subclass fit, the hierarchy is wrong. Prefer composition.

---

## Discussion Questions

1. In `before/bank-account.ts`, both `SavingsAccount` and `InvestmentAccount` add `override withdraw()`. What is the difference between these two violations? One is a matter of degree; the other is categorical. Which is which?

2. The `chargeMonthlyFeeDefensive` method in `before/account-service.ts` catches every withdrawal error and returns a report. In the `after/` version, this method doesn't exist. Where did the error-handling logic go, and is that better or worse?

3. `SavingsAccount` in the `after/` version still throws — but it throws `WithdrawalError`. What changed compared to `before/`, and why does that make it no longer an LSP violation? (Hint: re-read the `WithdrawableAccount` contract in `types.ts`.)
