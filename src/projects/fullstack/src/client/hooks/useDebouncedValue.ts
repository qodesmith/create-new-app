import {useEffect, useRef, useState} from 'react'

export function useDebouncedValue<T>(
  value: T,
  delay: number,
  onDebounced?: (value: T) => void
): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  // Keep the latest callback in a ref so changing it doesn't reset the timer
  // and we never fire a stale closure.
  const callbackRef = useRef(onDebounced)
  callbackRef.current = onDebounced

  // Track the last committed value so the callback fires only on real changes:
  // never on the initial mount, and never when the value settles back to what
  // it already was.
  const previousValueRef = useRef(value)

  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedValue(value)

      if (!Object.is(previousValueRef.current, value)) {
        previousValueRef.current = value
        callbackRef.current?.(value)
      }
    }, delay)

    return () => clearTimeout(id)
  }, [value, delay])

  return debouncedValue
}
