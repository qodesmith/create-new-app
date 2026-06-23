import {generateStrongPassword} from '@/client/lib/utils'

import {useCallback, useRef, useState} from 'react'
import {toast} from 'sonner'

type UsePasswordGeneratorOptions = {
  /** Receives a freshly generated password; set it on your form field(s). */
  onGenerate: (password: string) => void
  /** Returns the current password value to copy to the clipboard. */
  getValue: () => string
}

/**
 * Encapsulates the admin "Generate password" + "Copy to clipboard" behavior
 * shared by the create-user and set-password dialogs: generates a strong
 * password, tracks whether one was generated (to reveal the copy button), and
 * manages the transient "copied" state.
 *
 * `onGenerate`/`getValue` are read through refs so the returned handlers stay
 * stable across renders without callers needing to memoize their closures.
 */
export function usePasswordGenerator({
  onGenerate,
  getValue,
}: UsePasswordGeneratorOptions) {
  const [hasGeneratedPassword, setHasGeneratedPassword] = useState(false)
  const [didCopy, setDidCopy] = useState(false)

  const onGenerateRef = useRef(onGenerate)
  const getValueRef = useRef(getValue)
  onGenerateRef.current = onGenerate
  getValueRef.current = getValue

  const generate = useCallback(() => {
    onGenerateRef.current(generateStrongPassword())
    setHasGeneratedPassword(true)
    setDidCopy(false)
  }, [])

  const copy = useCallback(async () => {
    const current = getValueRef.current()
    if (!current) return
    try {
      await navigator.clipboard.writeText(current)
      setDidCopy(true)
      toast.success('Password copied to clipboard')
      setTimeout(() => setDidCopy(false), 2000)
    } catch {
      toast.error('Failed to copy password')
    }
  }, [])

  /** Clears the generated/copied state (on manual edit or form reset). */
  const reset = useCallback(() => {
    setHasGeneratedPassword(false)
    setDidCopy(false)
  }, [])

  return {hasGeneratedPassword, didCopy, generate, copy, reset} as const
}
