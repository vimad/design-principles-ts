# OCP — Open/Closed Principle

## Definition

Software entities should be **open for extension** but **closed for modification**.

You should be able to add new behaviour without editing code that is already working. The way you add new behaviour is by writing new code (a new class, a new file), not by opening an existing file and changing it.

---

## The Example: Promotion Engine

Domain: an e-commerce pricing engine that applies discounts — percentage off, flat amount, buy-2-get-1-free, loyalty points, and category bundle deals.

### What `before/PricingEngine` does wrong

The `calculate()` method is a single block of if-else branches, one per promotion type:

```
if (promo.type === 'percentage') { ... }
else if (promo.type === 'flat') { ... }
else if (promo.type === 'buy_two_get_one') { ... }
else if (promo.type === 'loyalty') { ... }
else if (promo.type === 'category_bundle') { ... }
// ← next promo type goes here
```

**Two places must stay in sync for every new type:**
1. The `PromotionType` string union — add the new literal
2. The if-else chain in `calculate()` — add the new branch

Miss step 2 and the promo silently applies a $0 discount. TypeScript can't warn you — the union type is satisfied, and there's no exhaustiveness check forcing all branches to be handled.

**The concrete modification risk:** when a developer adds a `'flash_sale'` branch at the bottom of `calculate()`, they are editing a method that already handles four other promotion types. A misplaced brace, an off-by-one on the discount arithmetic, a wrong variable name — any of these can silently break a promotion that was working yesterday. The test suite may catch it, but the risk is proportional to the number of times the method is touched.

### What the `after/` version does instead

There is no switch statement. `PricingEngine` knows nothing about promotion types:

```typescript
for (const strategy of this.strategies) {
  const discount = strategy.apply(cart, subtotal);
  ...
}
```

Each promotion type is its own class implementing `DiscountStrategy`. Adding a new promotion means **creating a new file** — `FlashSaleDiscount`, `ReferralDiscount`, `FirstTimeBuyerDiscount` — without opening any existing file. `PricingEngine` is permanently closed to this kind of change.

The `PricingEngine` tests above continue to pass even after you add ten more strategies, because the engine itself didn't change.

---

## The Implementation Pattern: Strategy

OCP doesn't prescribe a specific implementation. But the most direct way to achieve it in object-oriented code is the **Strategy Pattern**:

- Define an interface (`DiscountStrategy`) that captures the extension point
- Inject implementations at construction time (`new PricingEngine([...strategies])`)
- The host class (`PricingEngine`) depends only on the interface, never on concrete types

Variations: plugins, event handlers, middleware pipelines, visitors. All are OCP applied to different structures. The common thread is always the same — a stable interface that new behaviour implements, never the class that uses it.

---

## How OCP Improves Testability

**Before**: you cannot test `BuyTwoGetOneDiscount` logic without routing through the entire `calculate()` method, past the `'percentage'` and `'flat'` branches. There is no object to instantiate, no method to call directly.

**After**: `buy-two-get-one-discount.test.ts` imports `BuyTwoGetOneDiscount` and calls `apply()` directly. It knows nothing about percentages or loyalty points. It tests edge cases (qty 2 → no discount, qty 5 → one free, qty 6 → two free) with no ambient noise from other strategies.

The test for `PricingEngine` uses a hand-crafted `DiscountStrategy` object literal (`{ name: '...', apply: () => ... }`) to verify orchestration without needing any concrete strategy class at all. This is only possible because the engine depends on an interface, not on specific classes.

---

## The Reverse Direction: Testability as a Design Signal

Trying to test the BOGO logic in the `before/` version reveals the problem before you know OCP exists:

> "I want to test what happens when the customer buys 6 units. But the discount logic is inside an if-else inside `calculate()`. I can't call it directly. I have to construct a full Cart, pass a `{ type: 'buy_two_get_one' }` promotion, and route through the whole method just to probe one edge case."

That frustration is OCP pressure. The natural response — "I wish this were a class I could instantiate and call directly" — describes the Strategy Pattern. You write a new class with a `apply()` method. You've just implemented OCP without naming it.

**The test-first signal for OCP**: if writing a test requires routing through another class to reach the logic you want, you're looking at code that wants to be extracted into its own strategy.

---

## Connection to SRP

Notice that the `before/` `PricingEngine` violates *both* SRP and OCP simultaneously:

- **SRP**: it has five reasons to change (percentage business rules, BOGO rules, loyalty rules…)
- **OCP**: each new promotion type requires modifying it

These two violations are often co-located. A class with a switch/if-else over types is usually doing too many things (SRP) and is open for modification when new types arrive (OCP). Fixing one tends to fix the other: splitting into strategies satisfies SRP (each class has one job) and OCP (the host class doesn't change) at the same time.

---

## When to Apply OCP

- When you find yourself adding an else-if or a case every time a new variant arrives
- When the host class changes every sprint for the same reason ("new promo type this week")
- When you want to test variants in isolation without routing through the host class
- When different teams or plugins should be able to add behaviour independently

## When NOT to Over-Apply It

- **Don't abstract the first case.** If there is only one promotion type and no second in sight, an interface and a Strategy class are premature. Add the if-else; extract to strategies when the second case appears. (This is YAGNI working alongside OCP.)
- **Not everything varies.** The subtotal calculation, clamping, and result building in `PricingEngine` will not change with new promotion types. Those lines stay in the host class — they are already closed.
- **OCP applies to the axis of variation.** Identify *what* changes between cases and extract that. Everything else remains stable in the host.

---

## Discussion Questions

1. In `before/PricingEngine`, what happens if a developer adds `'flash_sale'` to the `PromotionType` union but forgets to add the else-if? How does the `after/` design make this mistake impossible?

2. Look at `after/pricing-engine.test.ts`, specifically the "accepts a custom strategy" test. It creates a `DiscountStrategy` as an object literal without importing any strategy class. Why is this possible, and what does it tell you about the coupling between `PricingEngine` and its strategies?

3. The `CategoryBundleDiscount` is configurable via its constructor: `new CategoryBundleDiscount(3, 8)`. In the `before/` version, the `3` and `8` are hardcoded inside the method. What would you have to do in the `before/` version to support two different bundle thresholds (3 categories and 5 categories) simultaneously? Compare that to the `after/` version.
