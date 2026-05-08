import type {ErrorLike} from 'bun'

import {captureError} from '@/server/errorCapture/captureError'

import {errorToObject} from '@qodestack/utils'

import {log} from './logger'

export function handleBunServerError(error: ErrorLike) {
  log.error('BUN SERVER ERROR:', errorToObject(error))
  log.error('-'.repeat(80))
  captureError({error, context: 'bun:topLevel:exception'})

  /**
   * Bun and Hono servers will both return 500 in their error handlers. They can
   * be distinguished on the client by their type:
   * Bun - JSON
   * Hono - Text
   */
  return Response.json(null, {status: 500})
}
