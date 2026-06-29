# SRP — Single Responsibility Principle

## Definition

A class should have one, and only one, **reason to change**.

"Reason to change" is not about line count or number of methods. It is about *who* (which team, actor, or concern) drives the change. If two different business teams would need to edit the same class for unrelated reasons, it has two responsibilities.

---

## The Example: Order Processing

Domain: an e-commerce order flow — validate an order, check inventory, charge payment, persist it, and send a confirmation.

### What `before/OrderProcessor` does wrong

The single class handles five distinct responsibilities:

| Responsibility | Who drives the change |
|---|---|
| Input validation | Business rules team |
| Inventory check | Warehouse operations team |
| Payment charging | Finance / provider switch |
| Order persistence | Backend / schema migrations |
| Confirmation email | Marketing / notification channel |

Any change to *any* of these five concerns forces an edit to the same class — even if the other four are completely untouched. A marketing team redesigning the email template and a finance team switching from Stripe to PayPal are both editing `OrderProcessor`. That is two reasons to change.

### The concrete cost

- **Fragility**: a bug introduced while changing the email template can break the payment path.
- **Tight coupling**: to replace Stripe with PayPal, you must edit the class that also handles DB persistence.
- **Untestability**: the private methods have no seam — there is nowhere to inject a test double or a different implementation (see below).

---

## What `after/` Does Instead

Each class has one job and one reason to change:

| Class | Responsibility | Reason to change |
|---|---|---|
| `OrderValidator` | Validate inputs | Validation rules change |
| `WarehouseInventoryService` | Read and deduct stock | Inventory system changes |
| `StripePaymentGateway` | Charge a payment | Provider or protocol changes |
| `InMemoryOrderRepository` | Persist orders | Storage layer changes |
| `EmailNotificationService` | Send confirmations | Channel or template changes |
| `OrderProcessor` | Sequence the above | *Order of operations* changes |

`OrderProcessor` still exists — but its only job is **orchestration**. It does not know how validation works, which payment provider is in use, what database is queried, or what channel sends the notification. If you switch to PayPal: edit `StripePaymentGateway`, done. If you add SMS: add `SmsNotificationService`, done. `OrderProcessor` and all other classes remain untouched.

---

## How SRP Improves Testability

Compare the test files side by side.

**`before/order-processor.test.ts`** — every test must:
- Build a complete `Order` object satisfying all five responsibilities at once
- Know which products exist in the hardcoded inventory fixture (internal knowledge leaking into tests)
- Accept that `console.log` fires for DB and SMTP on every test (side effects you can't observe or suppress)
- Accept that you cannot assert whether the email was sent at all

**`after/order-validator.test.ts`** — tests need only an `Order` shape. No DB, no payment, no email. You can probe every edge case in isolation.

**`after/inventory-service.test.ts`** — tests pass in exactly the stock state they need. No hardcoded fixture, no coupling to product names in another class.

**`after/order-processor.test.ts`** — the orchestrator test uses `vi.fn()` for `NotificationService`. You can now assert *whether* the email was sent, *when* it was sent, and *what* it was sent with.

The rule: **every time you extract a responsibility, you create a seam — and every seam is a place you can inject a test double.**

---

## The Reverse Direction: Testability as a Design Signal

The relationship runs both ways. You do not need to know SRP to arrive at it.

> "I want to test payment decline, but I keep having to satisfy the inventory check to get there. I wish I could just pass in the payment logic directly."

That thought is the instinct to inject a dependency. Once you inject it, you have split a responsibility. The desire for testability and the desire for SRP are the same desire — they just enter from different doors.

Practically: **if a test is hard to write, ask what it depends on that it shouldn't**. The answer usually points to a responsibility that belongs in its own class.

---

## When to Apply SRP

- When you catch yourself saying "this class does X, *and also* Y"
- When two different teams or concerns both drive changes to the same class
- When a test needs to set up five things to test one thing
- When adding a new notification channel (or a new payment provider) requires editing a class whose name is not `NotificationService` or `PaymentGateway`

## When NOT to Over-Apply It

- **Length is not the smell** — a 300-line class with one clear responsibility is fine; a 30-line class with two is not.
- **Cohesion matters** — a `Price` class with `amount`, `currency`, and `format()` has one responsibility even though it has multiple fields and methods. They all serve the same actor.
- **Don't split prematurely** — if there is only one team and one reason the class could change, you have one responsibility. Don't abstract what hasn't varied yet. (YAGNI applies here.)

---

## Discussion Questions

1. In `before/OrderProcessor`, a new requirement arrives: "send an SMS in addition to the email." Which class do you change? Which classes could accidentally break? Now answer the same question for the `after/` version.

2. Look at `after/order-processor.test.ts`. The test for "does not persist the order when payment is declined" can only exist because of SRP — the repository is observable from outside. Where would that test live in the `before/` version, and what would it look like?

3. In the `after/` design, `OrderProcessor` accepts `OrderValidator` as a concrete class, not an interface. Is that a problem? Which principle would you apply to fix it, and which example in this repo covers it?
