import type React from 'react'

import {cn} from '@/lib/utils'

import {motion, useMotionTemplate, useMotionValue} from 'motion/react'
import {useCallback, useEffect} from 'react'

type MagicCardProps = {
  children?: React.ReactNode
  className?: string
  gradientSize?: number
  /** The radial gradient that follows the mouse */
  spotlightGradientColor?: string
  gradientOpacity?: number
  /** The inside color of the radial gradient only shown on the border */
  borderGradientFrom?: string
  /** The outside color of the radial gradient only shown on the border */
  borderGradientTo?: string
}

/**
 * Customized version of https://magicui.design/docs/components/magic-card
 */
export function MagicCard({
  children,
  className,
  gradientSize = 200,
  spotlightGradientColor = '#262626',
  gradientOpacity = 0.8,
  borderGradientFrom = '#9E7AFF',
  borderGradientTo = '#FE8BBB',
}: MagicCardProps) {
  const mouseX = useMotionValue(-gradientSize)
  const mouseY = useMotionValue(-gradientSize)
  const reset = useCallback(() => {
    mouseX.set(-gradientSize)
    mouseY.set(-gradientSize)
  }, [gradientSize, mouseX, mouseY])

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      mouseX.set(e.clientX - rect.left)
      mouseY.set(e.clientY - rect.top)
    },
    [mouseX, mouseY]
  )

  useEffect(() => {
    reset()
  }, [reset])

  useEffect(() => {
    const handleGlobalPointerOut = (e: PointerEvent) => {
      if (!e.relatedTarget) {
        reset()
      }
    }

    const handleVisibility = () => {
      if (document.visibilityState !== 'visible') {
        reset()
      }
    }

    window.addEventListener('pointerout', handleGlobalPointerOut)
    window.addEventListener('blur', reset)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      window.removeEventListener('pointerout', handleGlobalPointerOut)
      window.removeEventListener('blur', reset)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [reset])

  return (
    <div
      className={cn('group relative rounded-[inherit]', className)}
      onPointerMove={handlePointerMove}
      onPointerLeave={reset}
      onPointerEnter={reset}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-[inherit] bg-border duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
          radial-gradient(${gradientSize}px circle at ${mouseX}px ${mouseY}px,
          ${borderGradientFrom},
          ${borderGradientTo},
          var(--border) 100%
          )
          `,
        }}
      />
      <div className="absolute inset-px rounded-[inherit] bg-background" />
      <motion.div
        className="pointer-events-none absolute inset-px rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(${gradientSize}px circle at ${mouseX}px ${mouseY}px, ${spotlightGradientColor}, transparent 100%)
          `,
          opacity: gradientOpacity,
        }}
      />
      <div className="relative">{children}</div>
    </div>
  )
}
