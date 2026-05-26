import {AccountCard} from '@/client/routes/_authenticated/-AccountCard'

import {createLazyFileRoute} from '@tanstack/react-router'

import {DatabaseBackup} from './-DatabaseBackup'
import {StaleRecords} from './-StaleRecords'

export const Route = createLazyFileRoute('/_authenticated/admin')({
  component: AdminPage,
})

function AdminPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-4 pb-8 md:p-6">
      <header className="space-y-1">
        <h1 className="pt-0">Admin</h1>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <AccountCard title="Database backup">
          <DatabaseBackup />
        </AccountCard>

        <AccountCard title="Stale records">
          <StaleRecords />
        </AccountCard>
      </section>
    </div>
  )
}
