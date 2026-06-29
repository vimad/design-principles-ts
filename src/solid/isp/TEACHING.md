# ISP — Interface Segregation Principle

## Definition

No client should be forced to depend on methods it does not use.

In plain terms: **keep interfaces narrow**. If a class is forced to implement methods it cannot meaningfully support — throwing `UnsupportedOperationException`, returning empty values, or no-oping — the interface is too wide and should be split.

---

## The Example: Notification Channels

Domain: a notification system with three delivery channels.

### The fat interface and who it hurts

`NotificationChannel` bundles four capabilities into one type: sending, batching, scheduling, and metrics.

| Channel | Send | Batch | Schedule | Metrics |
|---|---|---|---|---|
| `EmailChannel` | ✓ | ✓ | ✓ | ✓ |
| `SmsChannel` | ✓ | ✓ | ✗ (throws) | ✓ |
| `WebhookChannel` | ✓ | ✗ (semantically wrong) | ✗ (throws) | ✗ (throws) |

`SmsChannel` and `WebhookChannel` implement the full interface because the type system demands it. They lie about scheduling and metrics, then throw at runtime when those methods are called.

### The two harms in `NotificationService`

**1. Silent partial execution (`scheduleCampaign`)**

```typescript
scheduleCampaign(message: Message, deliverAt: Date): void {
  for (const channel of this.channels) {
    try {
      channel.schedule(message, deliverAt); // ← throws for 2 of 3 channels
    } catch {
      // silently ignored
    }
  }
}
```

The method returns `void`. Callers have no way to know which channels actually scheduled the message. The campaign may reach 10% of recipients while appearing to have succeeded entirely.

**2. Silent data loss (`collectMetrics`)**

```typescript
collectMetrics(): ChannelMetrics[] {
  const results: ChannelMetrics[] = [];
  for (const channel of this.channels) {
    try {
      results.push(channel.getMetrics()); // ← throws for WebhookChannel
    } catch { /* silently dropped */ }
  }
  return results;
}
```

Three channels configured. Two metrics returned. The caller asked for all of them.

Both harms share the same root cause: the type system promised capabilities that the runtime could not deliver. The defensive try/catch is not a feature — it is evidence of an ISP violation.

---

## What the `after/` Version Does Instead

Four focused interfaces replace one fat interface:

```
MessageSender    → name + send()
BatchSender      → sendBatch()
Schedulable      → schedule() + cancel()
MetricsProvider  → getMetrics()
```

Each channel implements only what it genuinely supports:

```
EmailChannel   → MessageSender, BatchSender, Schedulable, MetricsProvider
SmsChannel     → MessageSender, BatchSender, MetricsProvider
WebhookChannel → MessageSender
```

`NotificationService` methods declare the narrowest parameter type they actually need:

```typescript
scheduleCampaign(channels: Schedulable[], message: Message, deliverAt: Date): string[]
collectMetrics(providers: MetricsProvider[]): ChannelMetrics[]
```

Passing an `SmsChannel` to `scheduleCampaign` is now a **compile-time error**, not a silent runtime skip:

```typescript
// Before — compiles, runs, silently skips:
service.scheduleCampaign(message, new Date()); // SmsChannel is in this.channels

// After — caught during development:
service.scheduleCampaign([sms], message, new Date());
// Error: Argument of type 'SmsChannel[]' is not assignable to
//        parameter of type 'Schedulable[]'
//        SmsChannel has no 'schedule' method.
```

The try/catch blocks disappear. `scheduleCampaign` returns `string[]` — one job ID per channel — so callers know exactly how many channels were reached. `collectMetrics` returns exactly one result per provider.

---

## How ISP Improves Testability

**Before**: every mock must implement five methods regardless of what the test exercises.
A test for `broadcast()` must stub `schedule()`, `cancel()`, and `getMetrics()` — methods that have nothing to do with sending. This noise is ISP surfacing in test setup: the interface is wider than any single concern.

**After**: mock setup size is proportional to the capability being tested.

```typescript
// Testing broadcast: mock only needs send()
const sender: MessageSender = { name: 'mock', send: vi.fn() };

// Testing scheduleCampaign: mock only needs schedule() and cancel()
const schedulable: Schedulable = { schedule: vi.fn(() => 'job-1'), cancel: vi.fn() };
```

Each `after/` class test file is also cleaner: `sms-channel.test.ts` has no Schedulable tests because `SmsChannel` is not one. The test surface area matches the class surface area.

---

## The Reverse Direction: Testability as a Design Signal

The friction appears first in the test:

> "I want to test `scheduleCampaign` with a channel that doesn't support scheduling. But I can't make the assertion I want — the service just swallows the error and says nothing. I don't know if the right channels were scheduled or not."

That frustration is ISP surfacing through the test. The method's return type (`void`) and the suppressed exception are both symptoms of a caller being forced to depend on a capability it cannot trust.

The natural fix when trying to make the test meaningful: "The method should only accept channels that actually support scheduling." That narrows the parameter type to `Schedulable[]` — and that IS the ISP fix, arrived at by asking "what would make this test honest?"

---

## When to Apply ISP

- When implementations throw `UnsupportedOperationException` (or equivalent) for interface methods
- When client code does `instanceof` checks to decide which methods are safe to call
- When a method wraps every call in try/catch just to handle "the channels that don't support it"
- When a mock in a test implements 5 methods but the test only exercises 1

## When NOT to Over-Apply It

- **Don't split just for size.** A 5-method interface is not automatically a violation. If a client genuinely needs all 5, and all implementors genuinely support all 5, the interface is fine.
- **Don't create trivial one-method interfaces everywhere.** Extreme granularity creates its own complexity. Split when there are real implementors that cannot support part of the contract.
- **ISP and LSP are often solved together.** In the LSP example, we split `BankAccount` into `WithdrawableAccount` and `DepositableAccount`. That was an ISP fix too — `InvestmentAccount` was forced to implement `withdraw()` it could not honour.
- **Extending interfaces is fine.** `EmailChannel` implements four interfaces. Implementing many interfaces is not a violation — implementing methods that throw is.

---

## Connection to LSP and DIP

- **LSP**: In `before/`, `SmsChannel.schedule()` throws — a postcondition never delivered. The same root cause (fat interface → forced stubs → lying implementations) produces both ISP and LSP violations simultaneously.
- **DIP**: The `after/` `NotificationService` depends exclusively on interfaces (`MessageSender`, `Schedulable`, `MetricsProvider`), not on concrete classes. This is DIP. ISP makes the interfaces small enough that DIP is practical: injecting `Schedulable[]` is a meaningful constraint; injecting `NotificationChannel[]` was not.

---

## Discussion Questions

1. In `before/notification-service.ts`, `scheduleCampaign` returns `void` and `collectMetrics` returns `ChannelMetrics[]`. In `after/`, `scheduleCampaign` returns `string[]` and `collectMetrics` returns `ChannelMetrics[]` — with the same length as the input. What enabled the return type improvement in `scheduleCampaign`, and why was it impossible in `before/`?

2. `WebhookChannel.sendBatch()` in `before/` is not just a stub — it does something (it loops). But the TEACHING.md calls it "semantically wrong." What does that mean, and why is implementing a method that works differently from what the caller expects also an ISP violation?

3. A new `PushNotificationChannel` supports send and batch but not scheduling or metrics. In `before/`, adding it requires implementing two throw-not-supported stubs and either updating `NotificationService` or accepting the silent-skip behaviour. In `after/`, what does adding `PushNotificationChannel` require, and what parts of the existing code remain unchanged?
