import type {QueryKey} from '@tanstack/react-query'
import type {ErrorContext} from '@/shared/types'

import {useLogClientError} from '@/client/hooks/useLogClientError'
import {getSafeAuthErrorMessage} from '@/client/lib/utils'

import {useQueryClient} from '@tanstack/react-query'
import {useCallback, useState} from 'react'
import {toast} from 'sonner'

/**
 * The two ways a mutation surfaces failure to the client:
 *
 * 1. It resolves with an `{error}` envelope (Better Auth's RPC shape).
 * 2. It throws (network failure, a thrown DOMException from WebAuthn, etc.).
 *
 * `useMutationWithToast` handles both so callers never re-type a try/catch again.
 */
type MutationError = {message?: string; code?: string}
type MutationResult = {error?: MutationError | null} | null | undefined

/**
 * How to derive the toast text from a resolved `{error}` envelope:
 *
 * - `raw` — `error.message ?? errorFallback`. Trusted admin endpoints surface
 *   their own messages.
 * - `safe` — `getSafeAuthErrorMessage(error, errorFallback)`. Account-facing
 *   auth errors can leak; only show messages we tagged server-side.
 * - `static` — always `errorFallback`; ignore the server message entirely.
 */
type ErrorMessageMode = 'raw' | 'safe' | 'static'

export type UseMutationWithToastOptions = {
  /** logClientError context recorded when the mutation throws (typed union). */
  context: ErrorContext

  /** toast.error text when the mutation resolves with an `{error}` envelope. */
  errorFallback: string

  /** toast.success text on success; omit to show no success toast. */
  success?: string

  /**
   * Query key(s) to invalidate on success. A single `QueryKey` (e.g.
   * `['admin', 'users']`) or an array of them. Every key in this app starts
   * with a string segment, so a nested array unambiguously means "many keys".
   */
  invalidate?: QueryKey | QueryKey[]

  /** How to derive the error toast from an `{error}` envelope. Default `raw`. */
  errorMessage?: ErrorMessageMode

  /** toast.error text when the mutation throws. Defaults to `errorFallback`. */
  exception?: string

  /** Runs after the success toast and invalidation, e.g. close a dialog. */
  onSuccess?: () => void | Promise<void>

  /**
   * Predicate over a thrown error: return `true` to swallow it silently (no
   * toast, no log), e.g. a WebAuthn `NotAllowedError` when the user dismisses
   * the native prompt.
   */
  suppress?: (error: unknown) => boolean
}

function deriveErrorMessage(
  error: MutationError,
  mode: ErrorMessageMode,
  fallback: string
): string {
  if (mode === 'safe') return getSafeAuthErrorMessage(error, fallback)
  if (mode === 'static') return fallback
  return error.message ?? fallback
}

function normalizeKeys(invalidate: QueryKey | QueryKey[]): QueryKey[] {
  // A QueryKey is itself an array; an array-of-arrays is QueryKey[]. Since every
  // query key in this app leads with a string, a nested array means "many keys".
  return Array.isArray(invalidate[0])
    ? (invalidate as QueryKey[])
    : [invalidate as QueryKey]
}

/**
 * Runs a mutation and handles everything you'd otherwise hand-write around it:
 * it calls the mutation, shows a success toast, refreshes any affected queries,
 * and on failure shows an error toast and reports the error to the server.
 *
 * Across this app, almost every user-triggered mutation (change a role, ban a
 * user, update your name, add a passkey, ...) needs the exact same wrapper: a
 * try/catch that tells apart the two ways an auth call fails — it either
 * resolves with an `{error}` object or throws — toasts the right message for
 * each, toasts success, invalidates the relevant React Query keys, logs thrown
 * errors via `logClientError`, and tracks a pending flag for button state.
 * Before this hook that ~15-line block was copy-pasted into every dialog and
 * form, so the toast wording and error policy lived in ~20 places and drifted.
 * This hook is the single home for that policy: change how mutations report
 * success or failure once here, and every call site changes with it.
 *
 * You pass the mutation as a thunk plus a small options object describing the
 * messages and side effects (see {@link UseMutationWithToastOptions}). You get
 * back `run` — call it to perform the mutation; it returns `true` on success
 * and `false` on any handled failure — and `isPending` for disabling buttons.
 *
 * The hook owns only the network round-trip and its feedback. Pre-flight
 * checks that should happen *before* the request (nothing-to-change warnings,
 * password-match validation, custom-duration parsing) stay in the caller and
 * guard the call to `run`.
 *
 * @example
 * const {run, isPending} = useMutationWithToast(
 *   (userId: string) => authClient.admin.setRole({userId, role}),
 *   {
 *     success: 'Role updated',
 *     invalidate: ['admin', 'users'],
 *     context: 'client:adminSetRole:exception',
 *     errorFallback: 'Failed to update role',
 *     exception: 'An unexpected error occurred while updating the role',
 *     onSuccess: () => onOpenChange(false),
 *   }
 * )
 */
export function useMutationWithToast<Args extends unknown[]>(
  mutation: (...args: Args) => Promise<MutationResult>,
  options: UseMutationWithToastOptions
) {
  const {
    context,
    errorFallback,
    success,
    invalidate,
    errorMessage = 'raw',
    exception,
    onSuccess,
    suppress,
  } = options
  const logClientError = useLogClientError()
  const queryClient = useQueryClient()
  const [isPending, setIsPending] = useState(false)

  const run = useCallback(
    async (...args: Args): Promise<boolean> => {
      setIsPending(true)
      try {
        const result = await mutation(...args)

        if (result?.error) {
          toast.error(
            deriveErrorMessage(result.error, errorMessage, errorFallback)
          )
          return false
        }

        if (success) toast.success(success)

        if (invalidate) {
          await Promise.all(
            normalizeKeys(invalidate).map(queryKey =>
              queryClient.invalidateQueries({queryKey})
            )
          )
        }

        await onSuccess?.()
        return true
      } catch (error) {
        if (suppress?.(error)) return false
        toast.error(exception ?? errorFallback)
        logClientError({error, context})
        return false
      } finally {
        setIsPending(false)
      }
    },
    [
      mutation,
      context,
      errorFallback,
      success,
      invalidate,
      errorMessage,
      exception,
      onSuccess,
      suppress,
      logClientError,
      queryClient,
    ]
  )

  return {run, isPending}
}
