---
name: add-test
description: Scaffold tests using Bun test runner — component tests with testing-library, unit tests, or Playwright E2E stubs. Use when user wants to add tests, write specs, or test a feature.
argument-hint: "[file-or-feature]"
---

# Add Test

## Test Pyramid

| Level     | Tool                               | When                     |
|-----------|------------------------------------|--------------------------|
| Component | happy-dom + @testing-library/react | Testing UI behavior      |
| Unit      | Bun test (no DOM)                  | Pure logic/utils only    |
| E2E       | Playwright                         | Critical user paths only |

## File Naming

Colocate tests next to source: `foo.test.ts` next to `foo.ts`

Run: `bun test` or `bun test <path>`

## Component Test

```ts
import {describe, expect, test} from 'bun:test'
import {render, screen} from '@testing-library/react'
import {ItemCard} from './-ItemCard'

describe('ItemCard', () => {
  test('renders title', () => {
    render(<ItemCard title="Hello" />)
    expect(screen.getByText('Hello')).toBeDefined()
  })
})
```

## Unit Test

```ts
import {describe, expect, test} from 'bun:test'
import {formatPrice} from './formatPrice'

describe('formatPrice', () => {
  test('formats cents to dollars', () => {
    expect(formatPrice(1999)).toBe('$19.99')
  })
})
```

## E2E (Playwright)

```ts
import {test, expect} from '@playwright/test'

test('user can navigate to items', async ({page}) => {
  await page.goto('/')
  await page.click('a:has-text("Items")')
  await expect(page.locator('text=Items')).toBeVisible()
})
```

## TDD Workflow

See [tdd](../tdd/SKILL.md) for the red-green-refactor loop, vertical slice discipline, and test planning process.

## Philosophy

- Test behavior, not implementation details
- Integration-style through public APIs, not mocked internals
- happy-dom for component tests (not jsdom)

## NEVER

- Use npm/node — always `bun test`
- Use Jest or Vitest — use Bun's built-in test runner
