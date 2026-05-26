import type {ReactNode} from 'react'

type AdminSectionProps = {
  title: string
  description?: ReactNode
  action?: ReactNode
  children: ReactNode
}

export function AdminSection({
  title,
  description,
  action,
  children,
}: AdminSectionProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-xl">{title}</h2>
        {action}
      </div>
      {description && (
        <p className="text-muted-foreground text-sm">{description}</p>
      )}
      <div className="space-y-2">{children}</div>
    </section>
  )
}
