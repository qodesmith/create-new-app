import type {ErrorRow} from './-errorsColumns'

import {Badge} from '@/client/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/client/components/ui/dialog'

type ErrorDetailDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  error: ErrorRow | null
}

export function ErrorDetailDialog({
  open,
  onOpenChange,
  error,
}: ErrorDetailDialogProps) {
  if (!error) return null

  const {user} = error

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Error detail</DialogTitle>
          <DialogDescription>
            Full error payload and metadata captured at{' '}
            {new Date(error.createdAt).toLocaleString()}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge variant="secondary">{error.context}</Badge>
            <span className="text-muted-foreground">
              {user
                ? `${user.name} ${user.lastName} · ${user.email}`
                : 'System / anonymous'}
            </span>
          </div>

          <section className="space-y-1">
            <h3 className="font-medium text-sm">Error</h3>
            <JsonBlock value={error.error} />
          </section>

          <section className="space-y-1">
            <h3 className="font-medium text-sm">Metadata</h3>
            <JsonBlock value={error.metadata} />
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function JsonBlock({value}: {value: unknown}) {
  if (value == null) {
    return <p className="text-muted-foreground text-sm">None.</p>
  }

  return (
    <pre className="max-h-72 overflow-auto rounded-md border bg-muted p-3 text-xs">
      {JSON.stringify(value, null, 2)}
    </pre>
  )
}
