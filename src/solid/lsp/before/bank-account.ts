// LSP violated.
//
// The abstract base class BankAccount makes a behavioral promise:
//   withdraw(amount) succeeds when amount > 0 and amount <= balance.
//
// Two subclasses break that promise:
//   SavingsAccount — STRENGTHENS the precondition: also requires balance - amount >= minimumBalance
//   InvestmentAccount — IGNORES the precondition entirely: always throws before maturity
//
// Any code written against BankAccount is silently broken for these subtypes.
// The type system says "substitutable". The runtime says otherwise.

export abstract class BankAccount {
  constructor(
    readonly id: string,
    protected balance: number,
  ) {}

  getBalance(): number {
    return this.balance;
  }

  deposit(amount: number): void {
    if (amount <= 0) throw new Error('Amount must be positive');
    this.balance += amount;
  }

  // Documented promise: throws only when amount <= 0 or amount > balance.
  withdraw(amount: number): void {
    if (amount <= 0) throw new Error('Amount must be positive');
    if (amount > this.balance) throw new Error('Insufficient funds');
    this.balance -= amount;
  }

  transfer(amount: number, to: BankAccount): void {
    this.withdraw(amount);
    to.deposit(amount);
  }
}

export class RegularAccount extends BankAccount {
  // Fully substitutable — no additional constraints.
}

export class SavingsAccount extends BankAccount {
  private readonly minimumBalance: number;

  constructor(id: string, balance: number, minimumBalance = 100) {
    super(id, balance);
    this.minimumBalance = minimumBalance;
  }

  // STRENGTHENED PRECONDITION — LSP violation.
  // Parent promises: succeeds when amount > 0 and amount <= balance.
  // This subclass adds: ALSO requires balance - amount >= minimumBalance.
  //
  // Code that checks `amount <= account.getBalance()` before calling withdraw()
  // is no longer safe when account is a SavingsAccount.
  override withdraw(amount: number): void {
    if (this.balance - amount < this.minimumBalance) {
      throw new Error(
        `Withdrawal would breach the minimum balance of $${this.minimumBalance}`
      );
    }
    super.withdraw(amount);
  }
}

export class InvestmentAccount extends BankAccount {
  private readonly maturityDate: Date;

  constructor(id: string, balance: number, maturityDate: Date) {
    super(id, balance);
    this.maturityDate = maturityDate;
  }

  // POSTCONDITION NEVER DELIVERED before maturity — the worst LSP violation.
  // Parent promises: if amount > 0 and amount <= balance, balance is reduced.
  // This subclass makes that promise impossible to fulfil for months or years.
  // It also silently breaks transfer() — inherited from BankAccount, which calls withdraw().
  override withdraw(amount: number): void {
    if (new Date() < this.maturityDate) {
      throw new Error(
        `Cannot withdraw from investment account '${this.id}' before its maturity date`
      );
    }
    super.withdraw(amount);
  }
}
