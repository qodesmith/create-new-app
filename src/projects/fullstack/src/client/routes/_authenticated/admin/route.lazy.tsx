import {Button} from '@/client/components/ui/button'
import {useBoolean} from '@/client/hooks/useBoolean'
import {AccountCard} from '@/client/routes/_authenticated/-AccountCard'

import {createLazyFileRoute} from '@tanstack/react-router'
import {PlusIcon} from 'lucide-react'

import {AdminAuditLogsTable} from './-AdminAuditLogsTable'
import {AdminSection} from './-AdminSection'
import {CreateUserDialog} from './-CreateUserDialog'
import {DatabaseBackup} from './-DatabaseBackup'
import {StaleRecords} from './-StaleRecords'
import {SystemAuditLogsTable} from './-SystemAuditLogsTable'
import {UsersTable} from './-UsersTable'

export const Route = createLazyFileRoute('/_authenticated/admin')({
  component: AdminPage,
})

function AdminPage() {
  const createDialog = useBoolean()

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-12 p-4 pb-8 md:p-6">
      <header className="space-y-1">
        <h1 className="pt-0">Admin</h1>
      </header>

      <AdminSection
        title="Users"
        action={
          <Button size="sm" onClick={createDialog.setTrue}>
            <PlusIcon className="size-4" />
            Create user
          </Button>
        }
      >
        <UsersTable />
      </AdminSection>

      <AdminSection title="System">
        <div className="grid max-w-3xl gap-4 md:grid-cols-2">
          <AccountCard title="Database backup">
            <DatabaseBackup />
          </AccountCard>

          <AccountCard title="Stale records">
            <StaleRecords />
          </AccountCard>
        </div>
      </AdminSection>

      <AdminSection title="Admin audit logs">
        <AdminAuditLogsTable />
      </AdminSection>

      <AdminSection title="System audit logs">
        <SystemAuditLogsTable />
      </AdminSection>

      <CreateUserDialog
        open={createDialog.value}
        onOpenChange={createDialog.setValue}
      />
    </div>
  )
}
