---
name: add-component
description: Add a React component — Shadcn UI install, custom shared, or colocated route component. Use when user wants to create a component, add a UI element, install a shadcn component, or build a reusable widget.
argument-hint: "[component-name]"
---

# Add Component

## Determine Location

| Type             | Location                        | When                           |
|------------------|---------------------------------|--------------------------------|
| Shadcn           | `src/client/components/ui/`     | Standard UI primitive          |
| 3rd-party Shadcn | `src/client/components/ui/`     | From shadcn registry/community |
| Custom shared    | `src/client/components/custom/` | Reusable across routes         |
| Colocated        | Next to route file, `-Name.tsx` | Route-specific only            |

## Shadcn — Install From Registry

```sh
bunx shadcn@latest add <component>
```

Example: `bunx shadcn@latest add table`

Check available components before building custom solutions.

## 3rd-Party Shadcn

Add URL comment at top of file for housekeeping:
```ts
// https://magicui.design/docs/components/border-beam
```

## Custom Shared Component

`src/client/components/custom/MyWidget.tsx`:
```tsx
import {cn} from '@/client/lib/utils'
import {Button} from '@/client/components/ui/button'
import {Card, CardContent} from '@/client/components/ui/card'

export function MyWidget({className}: {className?: string}) {
  return (
    <Card className={cn('p-4', className)}>
      <CardContent>
        <Button>Click me</Button>
      </CardContent>
    </Card>
  )
}
```

Build custom components ON TOP of Shadcn primitives.

## Colocated Route Component

`src/client/routes/_authenticated/items/-ItemCard.tsx`:
```tsx
export function ItemCard({title}: {title: string}) {
  return <div>{title}</div>
}
```

Import from route: `import {ItemCard} from './-ItemCard'`

See [CONVENTIONS](../CONVENTIONS.md) for finalize steps and rules.
