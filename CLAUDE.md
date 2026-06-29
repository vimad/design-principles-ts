# Design Principles in TypeScript

A teaching repository that demonstrates software design principles through realistic TypeScript examples. Each section includes runnable code and a teaching guide.

## Purpose

Teach design principles by example — not toy code, not over-engineered systems. Each example should be complex enough to feel the pain the principle solves, then show the better design side-by-side.

## Project Structure

```
src/
  solid/
    srp/          # Single Responsibility Principle
    ocp/          # Open/Closed Principle
    lsp/          # Liskov Substitution Principle
    isp/          # Interface Segregation Principle
    dip/          # Dependency Inversion Principle
  simple-design/
  dry/
  kiss/
  yagni/
  coupling-cohesion/
  complexity/
  modularity/
```

Each principle directory contains:
- `before/` — code that violates the principle (with intentional pain points)
- `after/` — refactored code that applies the principle
- `TEACHING.md` — explanation, what to notice, discussion questions

## Language and Tooling

- **Language**: TypeScript (strict mode)
- **Test framework**: Vitest
- **Module system**: ESM (`"type": "module"` in package.json, `"module": "ESNext"`, `"moduleResolution": "bundler"`)
- **tsconfig**: strict, noUncheckedIndexedAccess, exactOptionalPropertyTypes, verbatimModuleSyntax enabled
- Use `import type` for type-only imports (required by verbatimModuleSyntax)

## Commands

```bash
npm install           # first-time setup
npm test              # run all tests once
npm run test:watch    # watch mode
npm run typecheck     # type-check without emitting
npx vitest run src/solid/srp   # run tests for a specific principle
```

## Current Focus

SOLID principles — working through them in order: SRP → OCP → LSP → ISP → DIP.

## Example Design Rules

**Complexity sweet spot**: Examples should be complex enough that the problem is felt — a few interacting classes, a realistic domain (e-commerce, reporting, notifications, etc.) — but not so large that the principle gets lost in incidental complexity. Aim for 50–200 lines per example.

**Before/after pairs**: Every principle gets a `before/` version that clearly shows the violation and its cost, and an `after/` version that shows the fix. The delta should be obvious.

**Teaching guide (`TEACHING.md`)**: Each section must have one. Include:
1. One-line definition of the principle
2. What hurts in the `before/` example and why
3. What changed in the `after/` example
4. When to apply this (and when not to over-apply it)
5. 2–3 discussion questions

**Tests**: Each class in `after/` gets its own test file (e.g., `order-validator.test.ts`, `payment-gateway.test.ts`). Tests must demonstrate *isolation* — a unit test for validation should need zero knowledge of payment or inventory. An integration test for the orchestrator uses `vi.fn()` for collaborators so call assertions are possible. Tests are not just correctness checks; they prove that SRP (or the principle being taught) created a testability improvement.

**Test file layout**: In `before/`, one test file shows the friction. In `after/`, one test file per class (pure isolation) plus one integration test for the orchestrator.

## Principles Planned

| Principle | Status |
|-----------|--------|
| SRP — Single Responsibility | done |
| OCP — Open/Closed | done |
| LSP — Liskov Substitution | done |
| ISP — Interface Segregation | done |
| DIP — Dependency Inversion | planned |
| Simple Design (XP rules) | planned |
| DRY — Don't Repeat Yourself | planned |
| KISS — Keep It Simple | planned |
| YAGNI — You Aren't Gonna Need It | planned |
| Coupling & Cohesion | planned |
| Complexity (cyclomatic, cognitive) | planned |
| Modularity | planned |

## Testability and Design — Two Sides of the Same Coin

Every example must make two arguments simultaneously:

1. **Good design → better tests.** When a class has one responsibility and its dependencies are injected, tests for it are small, isolated, and readable. Show this explicitly: the `after/` test for a validator needs nothing but a validator. The `after/` test for the orchestrator uses `vi.fn()` to assert on collaborator calls.

2. **The desire to test → good design emerges.** Start from the test-first perspective: "I can't test payment decline without setting up inventory and validation first. I wish I could inject just the payment logic." That instinct *is* SRP (or DIP, or ISP). When adding examples, note in the `TEACHING.md` how trying to make the `before/` code testable naturally leads to the `after/` design — they are the same insight from different angles.

Practically: **if a test is hard to write, ask what it depends on that it shouldn't.** The answer points to a responsibility or coupling that a design principle can fix.

## Coding Conventions

- No `any` — use `unknown` and narrow properly
- Prefer interfaces over type aliases for object shapes
- Prefer composition over inheritance in `after/` examples
- Keep each file focused — one class or one cohesive group of functions
- No barrel `index.ts` files; import directly from source files
- Comments only when the "why" is non-obvious; never describe what the code does
