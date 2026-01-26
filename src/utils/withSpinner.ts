import {spinner} from '@clack/prompts'

/**
 * Display a spinner while running an async operation
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
    s.stop('Failed')
    throw err
  }
}
