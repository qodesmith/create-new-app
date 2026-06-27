import type {ReactNode} from 'react'
import type {ApiClient} from '@/client/types'

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  mock,
  spyOn,
  test,
} from 'bun:test'

import {useMutationWithToast} from '@/client/hooks/useMutationWithToast'
import {apiClientAtom} from '@/client/state/globalState'
import {setupHappyDom} from '@/client/test/happyDom'
import {serverValidationErrorCode} from '@/shared/constants'

import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {act, renderHook} from '@testing-library/react'
import {createStore, Provider as JotaiProvider} from 'jotai'
import {createElement} from 'react'
import {toast} from 'sonner'

setupHappyDom()

/**
 * First client-side test in the repo. `useMutationWithToast` is the seam every mutation
 * runs through, so testing it once locks down the toast/error/invalidate policy
 * for all ~20 call sites — they no longer need their own tests for the envelope.
 */

// Records each logClientError POST so we can assert on exception logging.
function makeApiClient() {
  const post = mock(() => Promise.resolve(new Response()))
  const apiClient = {'client-error': {$post: post}} as unknown as ApiClient
  return {apiClient, post}
}

function setup() {
  const {apiClient, post} = makeApiClient()
  const store = createStore()
  store.set(apiClientAtom, apiClient)

  const queryClient = new QueryClient()
  const invalidate = spyOn(queryClient, 'invalidateQueries').mockResolvedValue(
    undefined
  )

  const wrapper = ({children}: {children: ReactNode}) =>
    createElement(
      QueryClientProvider,
      {client: queryClient},
      createElement(JotaiProvider, {store}, children)
    )

  return {wrapper, logPost: post, invalidate}
}

let success: ReturnType<typeof spyOn>
let error: ReturnType<typeof spyOn>

beforeEach(() => {
  success = spyOn(toast, 'success').mockReturnValue('' as never)
  error = spyOn(toast, 'error').mockReturnValue('' as never)
})

afterEach(() => {
  // Spies layer on the shared `toast` singleton; restore so call counts don't
  // leak between tests.
  mock.restore()
})

describe('useMutationWithToast', () => {
  test('success: toasts, invalidates every key, runs onSuccess, returns true', async () => {
    const {wrapper, invalidate} = setup()
    const onSuccess = mock(() => {})
    const {result} = renderHook(
      () =>
        useMutationWithToast(async () => ({error: null}), {
          context: 'client:adminSetRole:exception',
          errorFallback: 'Failed',
          success: 'Saved',
          invalidate: [
            ['admin', 'users'],
            ['admin', 'users', 'x', 'sessions'],
          ],
          onSuccess,
        }),
      {wrapper}
    )

    let outcome: boolean | undefined
    await act(async () => {
      outcome = await result.current.run()
    })

    expect(outcome).toBe(true)
    expect(success).toHaveBeenCalledWith('Saved')
    expect(error).not.toHaveBeenCalled()
    expect(invalidate).toHaveBeenCalledTimes(2)
    expect(onSuccess).toHaveBeenCalledTimes(1)
  })

  test('single QueryKey invalidates once (not once per segment)', async () => {
    const {wrapper, invalidate} = setup()
    const {result} = renderHook(
      () =>
        useMutationWithToast(async () => undefined, {
          context: 'client:adminSetRole:exception',
          errorFallback: 'Failed',
          invalidate: ['admin', 'users'],
        }),
      {wrapper}
    )

    await act(async () => {
      await result.current.run()
    })

    expect(invalidate).toHaveBeenCalledTimes(1)
    expect(invalidate).toHaveBeenCalledWith({queryKey: ['admin', 'users']})
  })

  test('{error} envelope (raw): shows error.message, skips invalidate/onSuccess, returns false', async () => {
    const {wrapper, invalidate} = setup()
    const onSuccess = mock(() => {})
    const {result} = renderHook(
      () =>
        useMutationWithToast(
          async () => ({error: {message: 'Already exists'}}),
          {
            context: 'client:adminSetRole:exception',
            errorFallback: 'Failed to create user',
            success: 'Saved',
            invalidate: ['admin', 'users'],
            onSuccess,
          }
        ),
      {wrapper}
    )

    let outcome: boolean | undefined
    await act(async () => {
      outcome = await result.current.run()
    })

    expect(outcome).toBe(false)
    expect(error).toHaveBeenCalledWith('Already exists')
    expect(success).not.toHaveBeenCalled()
    expect(invalidate).not.toHaveBeenCalled()
    expect(onSuccess).not.toHaveBeenCalled()
  })

  test('{error} envelope (static): ignores server message, shows fallback', async () => {
    const {wrapper} = setup()
    const {result} = renderHook(
      () =>
        useMutationWithToast(
          async () => ({error: {message: 'leaky internal detail'}}),
          {
            context: 'client:deleteAccount:exception',
            errorFallback: 'Failed to request account deletion',
            errorMessage: 'static',
          }
        ),
      {wrapper}
    )

    await act(async () => {
      await result.current.run()
    })

    expect(error).toHaveBeenCalledWith('Failed to request account deletion')
  })

  test('{error} envelope (safe): shows message only when server-tagged', async () => {
    const {wrapper} = setup()
    const {result} = renderHook(
      () =>
        useMutationWithToast(
          async () => ({
            error: {code: serverValidationErrorCode, message: 'Name too long'},
          }),
          {
            context: 'client:changeName:exception',
            errorFallback: 'Failed to update name',
            errorMessage: 'safe',
          }
        ),
      {wrapper}
    )

    await act(async () => {
      await result.current.run()
    })

    expect(error).toHaveBeenCalledWith('Name too long')
  })

  test('{error} envelope (safe): falls back when error is untagged', async () => {
    const {wrapper} = setup()
    const {result} = renderHook(
      () =>
        useMutationWithToast(
          async () => ({error: {code: 'OTHER', message: 'leaky'}}),
          {
            context: 'client:changeName:exception',
            errorFallback: 'Failed to update name',
            errorMessage: 'safe',
          }
        ),
      {wrapper}
    )

    await act(async () => {
      await result.current.run()
    })

    expect(error).toHaveBeenCalledWith('Failed to update name')
  })

  test('thrown: shows exception toast and logs to the server, returns false', async () => {
    const {wrapper, logPost} = setup()
    const {result} = renderHook(
      () =>
        useMutationWithToast(
          async () => {
            throw new Error('network down')
          },
          {
            context: 'client:adminSetRole:exception',
            errorFallback: 'Failed to update role',
            exception: 'An unexpected error occurred while updating the role',
          }
        ),
      {wrapper}
    )

    let outcome: boolean | undefined
    await act(async () => {
      outcome = await result.current.run()
    })

    expect(outcome).toBe(false)
    expect(error).toHaveBeenCalledWith(
      'An unexpected error occurred while updating the role'
    )
    expect(logPost).toHaveBeenCalledTimes(1)
  })

  test('suppress: swallows a matching thrown error silently', async () => {
    const {wrapper, logPost} = setup()
    const {result} = renderHook(
      () =>
        useMutationWithToast(
          async () => {
            throw new DOMException('cancelled', 'NotAllowedError')
          },
          {
            context: 'client:passkeyAdd:exception',
            errorFallback: 'Failed to add passkey',
            suppress: e =>
              e instanceof DOMException && e.name === 'NotAllowedError',
          }
        ),
      {wrapper}
    )

    let outcome: boolean | undefined
    await act(async () => {
      outcome = await result.current.run()
    })

    expect(outcome).toBe(false)
    expect(error).not.toHaveBeenCalled()
    expect(logPost).not.toHaveBeenCalled()
  })

  test('isPending: false → true while running → false after', async () => {
    const {wrapper} = setup()
    let release: () => void = () => {}
    const gate = new Promise<void>(resolve => {
      release = resolve
    })
    const {result} = renderHook(
      () =>
        useMutationWithToast(
          async () => {
            await gate
            return {error: null}
          },
          {
            context: 'client:adminSetRole:exception',
            errorFallback: 'Failed',
          }
        ),
      {wrapper}
    )

    expect(result.current.isPending).toBe(false)

    let runPromise: Promise<boolean>
    act(() => {
      runPromise = result.current.run()
    })
    expect(result.current.isPending).toBe(true)

    await act(async () => {
      release()
      await runPromise
    })
    expect(result.current.isPending).toBe(false)
  })
})
