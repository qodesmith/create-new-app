import {ThemeCycler} from '@/client/components/custom/ThemeCycler'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/client/components/ui/avatar'
import {Button} from '@/client/components/ui/button'
import {useSignOut} from '@/client/hooks/useSignOut'
import {userAtom, userInitialsAtom} from '@/client/state/globalState'
import {authRoutePath} from '@/shared/constants'

import {Link, useRouterState} from '@tanstack/react-router'
import {useAtomValue} from 'jotai'

export function AppHeader() {
  const parsedLocation = useRouterState({select: s => s.location})
  const user = useAtomValue(userAtom)
  const {signOut, isSigningOut} = useSignOut()
  const initials = useAtomValue(userInitialsAtom)

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
        {user ? (
          <>
            <Link to="/account" activeProps={{className: 'underline'}}>
              Account
            </Link>
            <Button size="sm" onClick={signOut} disabled={isSigningOut}>
              Log out
            </Button>
            <Avatar className="rounded-full">
              <AvatarImage src={`${authRoutePath}/avatar`} alt={user.email} />
              <AvatarFallback className="rounded-lg text-xs uppercase">
                {initials}
              </AvatarFallback>
            </Avatar>
          </>
        ) : (
          <div className="flex gap-2">
            <Link to="/signin" activeProps={{className: 'underline'}}>
              Sign in
            </Link>
            <span>/</span>
            <Link to="/signup" activeProps={{className: 'underline'}}>
              Sign up
            </Link>
          </div>
        )}
        <ThemeCycler />
      </div>
    </header>
  )
}
