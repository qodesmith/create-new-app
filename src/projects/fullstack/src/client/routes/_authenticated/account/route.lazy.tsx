import {AccountCard} from '@/client/routes/_authenticated/-AccountCard'

import {createLazyFileRoute} from '@tanstack/react-router'

import {AccountAvatar} from './-AccountAvatar'
import {Appearance} from './-Appearance'
import {ChangeEmail} from './-ChangeEmail'
import {ChangeName} from './-ChangeName'
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

      <section className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        {/* CHANGE NAME */}
        <AccountCard title="Change name">
          <ChangeName />
        </AccountCard>

        {/* ADD PASSKEY */}
        <AccountCard title="Passkeys">
          <Passkeys />
        </AccountCard>
      </section>

      {/* DELETE ACCOUNT */}
      <section>
        <AccountCard title="Delete account" isDestructive>
          <DeleteAccount />
        </AccountCard>
      </section>
    </div>
  )
}
