import {ThemeCycler} from '@/components/custom/ThemeCycler'

import {Link, useRouterState} from '@tanstack/react-router'

export function AppHeader() {
  const parsedLocation = useRouterState({select: s => s.location})

  return (
    <header className="flex items-center justify-between border-b p-2">
      <div>
        Current route:{' '}
        <code className="rounded bg-secondary p-1">
          {parsedLocation.pathname}
        </code>
      </div>
      <div className="flex items-center gap-8">
        <Link to="/" className="" activeProps={{className: 'underline'}}>
          Home
        </Link>
        <ThemeCycler />
      </div>
    </header>
  )
}
