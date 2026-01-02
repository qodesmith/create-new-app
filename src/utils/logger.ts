import process from 'node:process'

import * as p from '@clack/prompts'

/**
 * Display intro banner
 */
export function intro(message: string): void {
  p.intro(message)
}

/**
 * Display outro message
 */
export function outro(message: string): void {
  p.outro(message)
}

/**
 * Log an info message
 */
export function info(message: string): void {
  p.log.info(message)
}

/**
 * Log a success message
 */
export function success(message: string): void {
  p.log.success(message)
}

/**
 * Log a warning message
 */
export function warn(message: string): void {
  p.log.warn(message)
}

/**
 * Log an error message
 */
export function error(message: string): void {
  p.log.error(message)
}

/**
 * Log a step message
 */
export function step(message: string): void {
  p.log.step(message)
}

/**
 * Display a spinner while running an async operation
 */
export async function withSpinner<T>(
  message: string,
  fn: () => Promise<T>
): Promise<T> {
  const s = p.spinner()
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

/**
 * Cancel and exit
 */
export function cancel(message: string): never {
  p.cancel(message)
  process.exit(1)
}
