import {cn} from '@/lib/utils'

export function SonarPulse({
  className,
  color,
  doublePulse = false,
}: {
  className?: string
  color?: string
  doublePulse?: boolean
}) {
  return (
    <span className={className}>
      <span className="relative flex size-1.5">
        <span
          className={cn(
            'absolute inline-flex h-full w-full animate-sonar rounded-full opacity-75',
            color ?? 'bg-cyan-400'
          )}
        />
        {doublePulse && (
          <span
            className={cn(
              'animation-delay-300 absolute inline-flex h-full w-full animate-sonar rounded-full opacity-50',
              color ?? 'bg-cyan-400'
            )}
          />
        )}
        <span
          className={cn(
            'relative inline-flex size-1.5 rounded-full',
            color ?? 'bg-cyan-400'
          )}
        />
      </span>
    </span>
  )
}
