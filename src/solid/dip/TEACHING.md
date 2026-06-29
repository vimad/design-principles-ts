# DIP — Dependency Inversion Principle

## Definition

1. High-level modules should not depend on low-level modules. Both should depend on abstractions.
2. Abstractions should not depend on details. Details should depend on abstractions.

In plain terms: **high-level policy should own the interfaces; low-level implementations plug into them**. The dependency arrows point from concrete → abstract, never from high-level → concrete.

---

## The Example: Sales Report Generation

Domain: a service that fetches sales data, computes a summary, formats it as a report, and delivers it.

### The violation

`before/SalesReportService` creates its own dependencies by calling `new` inside its constructor:

```typescript
constructor(databaseUrl: string, smtpHost: string, fromAddress: string) {
  this.repository = new PostgresSaleRepository(databaseUrl);
  this.formatter  = new CsvReportFormatter();
  this.mailer     = new SmtpReportMailer(smtpHost, fromAddress);
}
```

Two DIP violations in one constructor:

**1. High-level depends on low-level (by name).** `SalesReportService` imports `PostgresSaleRepository`, `CsvReportFormatter`, and `SmtpReportMailer` directly. Changing the database provider means editing the high-level service.

**2. Infrastructure details leak into the high-level API.** The constructor signature accepts `databaseUrl` and `smtpHost`. The service's callers must know low-level details just to construct it. The connection between the high-level algorithm and the low-level infrastructure is baked in — there is no seam.

### The cost: an untestable algorithm

`generateAndSend()` runs a business algorithm:
1. Fetch sales for the period
2. Compute total revenue and top region by revenue
3. Format the summary into a deliverable report
4. Send to recipients

That logic is correct or incorrect independent of whether the database is Postgres or SQLite, or whether delivery is SMTP or Slack. But there is no way to reach that logic in a test. The first call hits `PostgresSaleRepository.fetchForPeriod()` which throws because there is no database.

The `before/` test file demonstrates this: the only assertion possible is `expect(...).toThrow('PostgresSaleRepository')`. The algorithm is never exercised.

---

## What the `after/` Version Does Instead

Three focused interfaces replace the three hardcoded concrete classes:

```typescript
// types.ts — owned by the high-level policy, not by the implementations
interface SaleRepository  { fetchForPeriod(from: Date, to: Date): Sale[]; }
interface ReportFormatter { format(summary: SalesSummary): Report; }
interface ReportMailer    { send(report: Report, recipients: string[]): void; }
```

`SalesReportService` receives all three through its constructor:

```typescript
constructor(
  private readonly repository: SaleRepository,
  private readonly formatter:  ReportFormatter,
  private readonly mailer:     ReportMailer,
) {}
```

The class does not import `PostgresSaleRepository`, `CsvReportFormatter`, or `SmtpReportMailer`. It does not know they exist.

### Dependency directions

```
before/ — arrows point wrong:
  SalesReportService ──→ PostgresSaleRepository  (high-level depends on low-level)
  SalesReportService ──→ CsvReportFormatter
  SalesReportService ──→ SmtpReportMailer

after/ — arrows point inward:
  PostgresSaleRepository ──→ SaleRepository ←── SalesReportService
  CsvReportFormatter     ──→ ReportFormatter ←──
  SmtpReportMailer       ──→ ReportMailer    ←──
```

Neither the high-level service nor the low-level implementations point at each other.

### Swappability at the composition root

```typescript
// Production wiring (done once, at startup)
const service = new SalesReportService(
  new PostgresSaleRepository(process.env.DATABASE_URL),
  new CsvReportFormatter(),
  new SmtpReportMailer(process.env.SMTP_HOST, 'reports@company.com'),
);

// Test wiring (no infrastructure required)
const service = new SalesReportService(
  new InMemorySaleRepository(fixtureSales),
  new CsvReportFormatter(),
  { send: vi.fn() },
);
```

Same `SalesReportService`. Same algorithm. Different implementations. Zero changes to the class.

---

## How DIP Improves Testability

**Before**: the test cannot reach the algorithm at all. Every call throws before the business logic runs.

**After**: the full algorithm is tested in five focused cases with no infrastructure:

- Total revenue computed correctly
- Top region identified by revenue (not by count — a subtle correctness requirement)
- Correct recipients passed to the mailer
- Exactly one report sent per call
- Algorithm unchanged when a different formatter is injected

Each test is 5–8 lines of setup and assertion. This is the direct benefit of DIP: injectable dependencies are test seams. Hardcoded `new` calls are walls.

---

## The Reverse Direction: Testability as a Design Signal

The friction appears immediately when trying to write the first test:

> "I want to test whether the top-region calculation correctly ranks by revenue, not by count. But I can't call `generateAndSend()` without a real database. And `summarise()` is private — I can't call it directly."

That dead end is DIP surfacing through the test. The instinct to make the test work — "I wish I could just pass in the sales data directly" — is the same instinct that produces the constructor injection pattern. Constructor injection is not a testing trick; it's the natural shape of a class that has separated its algorithm from its infrastructure.

---

## Connection to ISP and LSP

- **ISP**: The three interfaces (`SaleRepository`, `ReportFormatter`, `ReportMailer`) are each narrow — one method or two. ISP keeps them small enough that DIP is practical. A fat 10-method `InfrastructureLayer` interface would not serve DIP well.
- **LSP**: In the LSP example, `AccountService` was refactored to depend on `WithdrawableAccount` and `DepositableAccount` interfaces. That was DIP applied to a hierarchy: the service now depends on abstractions, not on `BankAccount` or its concrete subclasses.
- **SRP**: Constructor injection produces naturally SRP-compliant classes. When a class's dependencies are explicit in its constructor, it becomes obvious if there are too many — a class that needs 6 injected services probably has too many responsibilities.

---

## When to Apply DIP

- When a class creates its own dependencies with `new` and those dependencies do I/O (database, network, filesystem)
- When changing a low-level detail (database vendor, email provider) requires editing a high-level class
- When a class is hard to test because it requires real infrastructure to instantiate
- When you cannot pass a test double into a class because it builds its own collaborators

## When NOT to Over-Apply It

- **Don't inject stable, deterministic collaborators.** `new Date()` in a method body is not a DIP violation worth fixing unless the class explicitly needs clock injection. `Math.random()` can stay where it is.
- **Don't add interfaces for classes that will only ever have one implementation.** An interface for `EmailReportFormatter` when only CSV will ever exist is premature abstraction. Add the interface when a second implementation appears or when the test needs a swap.
- **Composition roots are the right place for `new`.** Using `new` is not inherently wrong — it is wrong when it happens inside a high-level policy class. The wiring code at application startup is supposed to do `new`. The algorithm classes are not.
- **Don't confuse DIP with a DI framework.** Constructor injection is a pattern; a dependency injection container is a tool. DIP can be applied with plain constructor calls. A framework is useful at scale but not required.

---

## Discussion Questions

1. In `before/`, the constructor accepts `databaseUrl: string` and `smtpHost: string`. Why is leaking these strings into the high-level constructor a DIP violation — and not just an API design choice? What would a caller of `SalesReportService` have to know that it shouldn't?

2. `InMemorySaleRepository.fetchForPeriod()` ignores the `from` and `to` parameters and returns all sales. A production `PostgresSaleRepository` would filter by date. Does this difference matter for the tests in `sales-report-service.test.ts`? What does your answer reveal about what those tests are actually testing?

3. The `after/` tests inject `{ send: vi.fn() }` directly as the `ReportMailer` — a plain object literal satisfying the interface. In `before/`, this is impossible because `SmtpReportMailer` is constructed inside the class. What property of small interfaces (ISP) makes this one-liner possible, and how does it connect to DIP?
