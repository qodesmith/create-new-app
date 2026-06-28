import type {ReactNode} from 'react'

import {BorderBeam} from '@/client/components/ui/border-beam'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/client/components/ui/card'
import {cn} from '@/client/lib/utils'

export function AccountCard({
  title,
  children,
  isDestructive,
}: {
  title: string
  children: ReactNode
  isDestructive?: boolean
}) {
  return (
    <Card className="group relative h-full overflow-hidden border-none">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
      <BorderBeam
        className={cn(
          'from-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100',
          isDestructive ? 'via-destructive' : 'via-cyan-400/80'
        )}
        size={240}
        duration={6}
        borderColor={isDestructive ? 'border-destructive/50' : 'border-border'}
      />
    </Card>
  )
}
