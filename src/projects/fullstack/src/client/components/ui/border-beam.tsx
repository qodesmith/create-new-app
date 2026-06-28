import type {MotionStyle, Transition} from 'motion/react'

import {cn} from '@/client/lib/utils'

import {m, useReducedMotion} from 'motion/react'

type BorderBeamProps = {
  /**
   * The size of the border beam.
   */
  size?: number
  /**
   * The duration of the border beam.
   */
  duration?: number
  /**
   * The delay of the border beam.
   */
  delay?: number
  /**
   * The color of the border beam from.
   */
  colorFrom?: string
  /**
   * The color of the border beam to.
   */
  colorTo?: string
  /**
   * The motion transition of the border beam.
   */
  transition?: Transition
  /**
   * The class name of the border beam.
   */
  className?: string
  /**
   * The style of the border beam.
   */
  style?: React.CSSProperties
  /**
   * Whether to reverse the animation direction.
   */
  reverse?: boolean
  /**
   * The initial offset position (0-100).
   */
  initialOffset?: number
  /**
   * The border width of the beam.
   */
  borderWidth?: number
  /**
   * The border color. Defaults to `border-transparent`.
   */
  borderColor?: string
}

// https://magicui.design/docs/components/border-beam
export const BorderBeam = ({
  className,
  size = 50,
  delay = 0,
  duration = 6,
  colorFrom = '#ffaa40',
  colorTo = '#9c40ff',
  transition,
  style,
  reverse = false,
  initialOffset = 0,
  borderWidth = 1,
  borderColor = 'border-transparent',
}: BorderBeamProps) => {
  // Respect the user's "reduce motion" OS setting (WCAG 2.3.3): hold the beam
  // still instead of looping it forever for users prone to motion sickness.
  const shouldReduceMotion = useReducedMotion()

  return (
    <div
      className={cn(
        'border-(length:--border-beam-width) mask-[linear-gradient(transparent,transparent),linear-gradient(#000,#000)] mask-intersect pointer-events-none absolute inset-0 rounded-[inherit] [mask-clip:padding-box,border-box]',
        borderColor
      )}
      style={
        {
          '--border-beam-width': `${borderWidth}px`,
        } as React.CSSProperties
      }
    >
      <m.div
        className={cn(
          'absolute aspect-square',
          'bg-linear-to-l from-(--color-from) via-(--color-to) to-transparent',
          className
        )}
        style={
          {
            width: size,
            offsetPath: `rect(0 auto auto 0 round ${size}px)`,
            '--color-from': colorFrom,
            '--color-to': colorTo,
            ...style,
          } as MotionStyle
        }
        initial={{offsetDistance: `${initialOffset}%`}}
        animate={
          shouldReduceMotion
            ? undefined
            : {
                offsetDistance: reverse
                  ? [`${100 - initialOffset}%`, `${-initialOffset}%`]
                  : [`${initialOffset}%`, `${100 + initialOffset}%`],
              }
        }
        transition={
          shouldReduceMotion
            ? undefined
            : {
                repeat: Infinity,
                ease: 'linear',
                duration,
                delay: -delay,
                ...transition,
              }
        }
      />
    </div>
  )
}
