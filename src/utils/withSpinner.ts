import {spinner} from '@clack/prompts'

/**
 * Display a spinner while running an async operation. On failure, stops the
 * spinner with the error message (preserving the existing UX) and re-throws
 * so the caller can decide whether to exit, retry, or recover.
 */
export async function withSpinner<T>(
  message: string,
  fn: () => Promise<T>
): Promise<T> {
  const s = spinner()
  s.start(message)
  try {
    const result = await fn()
    s.stop(message)
    return result
  } catch (err) {
    s.stop(Error.isError(err) ? err.message : 'An error occurred')
    throw err
  }
}
