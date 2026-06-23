import type {ReactNode} from 'react'

export function DetailText({children}: {children: ReactNode}) {
  return <span className="text-muted-foreground text-sm">{children}</span>
}
