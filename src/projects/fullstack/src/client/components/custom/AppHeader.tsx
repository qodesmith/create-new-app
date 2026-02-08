import {Button} from '@/client/components/ui/button'
import {useSignOut} from '@/client/hooks/useSignOut'
import {isSignedInAtom} from '@/client/state/globalState'

import {Link, useRouterState} from '@tanstack/react-router'
import {useAtomValue} from 'jotai'

export function AppHeader() {
  const parsedLocation = useRouterState({select: s => s.location})
  const isLoggedIn = useAtomValue(isSignedInAtom)
  const {signOut, isSigningOut} = useSignOut()

  return (
    <header className="flex items-center justify-between border-b p-2">
      <div>
        Current route:{' '}
        <code className="rounded bg-secondary p-1">
          {parsedLocation.pathname}
        </code>
      </div>
      {isLoggedIn ? (
        <Button size="sm" onClick={signOut} disabled={isSigningOut}>
          Log Out
        </Button>
      ) : (
        <div className="flex gap-2">
          <Link to="/signin">Sign in</Link>
          <span>/</span>
          <Link to="/signup">Sign up</Link>
        </div>
      )}
    </header>
  )
}
