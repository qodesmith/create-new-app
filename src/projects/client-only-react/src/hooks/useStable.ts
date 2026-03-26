import {useRef} from 'react'

const UNINITIALIZED: symbol = Symbol('stable')

export function useStable<T>(initialValueCallback: () => T): T {
  // @ts-expect-error TypeScript Is Hard™
  const ref = useRef<T>(UNINITIALIZED)
  if (ref.current === UNINITIALIZED) {
    ref.current = initialValueCallback()
  }
  return ref.current
}
