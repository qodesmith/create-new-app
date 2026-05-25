import {getRandomNumber} from '@qodestack/utils'
import {memo, useMemo} from 'react'

type Speed = 'default' | 'slow' | 'fast'

const durations = [4.3, 2, 1.4, 2, 3, 1.8, 1]
const cssKeyframeCount = durations.length
const durationMultipliers: Record<Speed, number> = {
  default: 1,
  slow: 2,
  fast: 0.5,
}

export const AudioLoader = memo(function AudioLoader({
  width = 55,
  height = 60,
  gap = 3,
  bars = 4,
  rounded = 3,
  speed = 'default',
}: {
  width?: number
  height?: number
  gap?: number
  bars?: number
  rounded?: number
  speed?: Speed
}) {
  const rectWidth = width / bars - gap
  const animationDurations = useMemo(() => {
    const multiplier = durationMultipliers[speed]
    return durations.map(duration => duration * multiplier)
  }, [speed])

  // Randomize the start point within the animation sequence.
  const animationDelay = useMemo(() => {
    const maxDuration = Math.max(...animationDurations)
    const negativeAnimationDelay = getRandomNumber(maxDuration * -100, 0)
    return `${negativeAnimationDelay / 100}s`
  }, [animationDurations])

  const rectData = useMemo(() => {
    // Example of 4 bars:
    // return [
    //   {x: undefined},
    //   {x: (width / 4) * 1 + (gap / 3) * 1},
    //   {x: (width / 4) * 2 + (gap / 3) * 2},
    //   {x: (width / 4) * 3 + (gap / 3) * 3},
    // ]

    return Array.from({length: bars}, (_, i) => {
      return i === 0
        ? {x: undefined}
        : {x: (width / bars) * i + (gap / (bars - 1)) * i}
    })
  }, [bars, gap, width])

  return (
    /**
     * `span` (not `div`) so this can live inside `<button>` without producing
     * invalid HTML — `LoadingButton` mounts the loader inside a button.
     */
    <span className="inline-block" style={{width, height}}>
      <svg
        // size-auto is here to override Shadcn button's default svg styling
        className="size-auto fill-current"
        viewBox={`0 0 ${width} ${height}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <title>Audio bars loading svg</title>
        <g transform={`matrix(1 0 0 -1 0 ${height})`}>
          {rectData.map(({x}, i) => {
            const index = i % cssKeyframeCount // Round robin
            const animationName = `audio-bar-${index + 1}`
            const animationDuration = `${animationDurations[index]}s`

            return (
              <rect
                key={`x-${x}`}
                width={rectWidth}
                rx={rounded}
                x={x}
                style={{
                  animationName,
                  animationDuration,
                  animationTimingFunction: 'linear',
                  animationIterationCount: 'infinite',
                  animationDelay,
                }}
              />
            )
          })}
        </g>
      </svg>
    </span>
  )
})
