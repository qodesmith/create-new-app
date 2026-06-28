---
name: add-test
description: Scaffold tests using Bun test runner — API integration with Hono testClient, component tests with testing-library, unit tests, or Playwright E2E stubs. Use when user wants to add tests, write specs, or test a feature.
argument-hint: "[file-or-feature]"
---

# Add Test

## Test Pyramid

Thick API integration middle, thin unit tests, small E2E suite.

| Level           | Tool                                  | When                     |
|-----------------|---------------------------------------|--------------------------|
| API integration | Hono `testClient` + SQLite `:memory:` | Testing endpoints        |
| Component       | happy-dom + @testing-library/react    | Testing UI behavior      |
| Unit            | Bun test (no DOM)                     | Pure logic/utils only    |
| E2E             | Playwright                            | Critical user paths only |

## File Naming

Colocate tests next to source: `foo.test.ts` next to `foo.ts`

Run: `bun test` or `bun test <path>`

## API Integration Test

```ts
import {describe, expect, test, beforeAll} from 'bun:test'
import {testClient} from 'hono/testing'
import {drizzle} from 'drizzle-orm/bun-sqlite'
import {migrate} from 'drizzle-orm/bun-sqlite/migrator'
import {Database} from 'bun:sqlite'

describe('POST /items', () => {
  let client: ReturnType<typeof testClient>

  beforeAll(() => {
    const sqlite = new Database(':memory:')
    const db = drizzle(sqlite)
    migrate(db, {migrationsFolder: './src/server/db/drizzle'})
    // Build test Hono app with db override
  })

  test('creates item', async () => {
    const res = await client.items.$post({
      json: {title: 'Test', body: 'Content'},
    })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.title).toBe('Test')
  })
})
```

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

test('user can create item', async ({page}) => {
  await page.goto('/signin')
  // Login flow...
  await page.goto('/items')
  await page.click('button:has-text("New")')
  await page.fill('input[name="title"]', 'Test Item')
  await page.click('button:has-text("Save")')
  await expect(page.locator('text=Test Item')).toBeVisible()
})
```

## TDD Workflow

See [tdd](../tdd/SKILL.md) for the red-green-refactor loop, vertical slice discipline, and test planning process.

## Philosophy

- Test behavior, not implementation details
- Integration-style through public APIs, not mocked internals
- SQLite `:memory:` for API tests — never touch real DB
- happy-dom for component tests (not jsdom)

## NEVER

- Use npm/node — always `bun test`
- Use Jest or Vitest — use Bun's built-in test runner
