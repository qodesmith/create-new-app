import type {ReactNode} from 'react'

import {BorderBeam} from '@/client/components/ui/border-beam'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/client/components/ui/card'

import {createLazyFileRoute} from '@tanstack/react-router'

import {AccountAvatar} from './-AccountAvatar'
import {Appearance} from './-Appearance'
import {ChangeEmail} from './-ChangeEmail'
import {ChangePassword} from './-ChangePassword'
import {DeleteAccount} from './-DeleteAccount'
import {Passkeys} from './-Passkeys'

export const Route = createLazyFileRoute('/_authenticated/account')({
  component: AccountPage,
})

function AccountPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-4 pb-8 md:p-6">
      <header className="space-y-1">
        <h1 className="pt-0">Account</h1>
        <p className="text-muted-foreground text-sm">
          Manage your profile, security, and appearance preferences.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        {/* PROFILE & AVATAR */}
        <AccountCard title="Profile">
          <AccountAvatar />
        </AccountCard>

        {/* THEME PREFERENCES */}
        <AccountCard title="Appearance">
          <Appearance />
        </AccountCard>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {/* CHANGE EMAIL */}
        <AccountCard title="Change email">
          <ChangeEmail />
        </AccountCard>

        {/* CHANGE PASSWORD */}
        <AccountCard title="Change password">
          <ChangePassword />
        </AccountCard>
      </section>

      {/* ADD PASSKEY */}
      <section>
        <AccountCard title="Passkeys">
          <Passkeys />
        </AccountCard>
      </section>

      {/* DELETE ACCOUNT */}
      <section>
        <AccountCard title="Delete account">
          <DeleteAccount />
        </AccountCard>
      </section>
    </div>
  )
}

function AccountCard({title, children}: {title: string; children: ReactNode}) {
  return (
    <Card className="group relative h-full overflow-hidden">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
      <BorderBeam
        className="overflow-hidden from-transparent via-cyan-400/80 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        size={240}
        duration={6}
      />
    </Card>
  )
}
