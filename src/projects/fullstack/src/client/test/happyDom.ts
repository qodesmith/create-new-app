import {afterAll, beforeAll} from 'bun:test'

import {GlobalRegistrator} from '@happy-dom/global-registrator'

/**
 * Registers happy-dom globals (window, document, navigator, ...) for the
 * calling test file so React components and hooks can render via
 * @testing-library/react.
 *
 * Why bracket it per file instead of a `[test] preload` in bunfig:
 * `GlobalRegistrator.register()` replaces global `Headers`/`Response` with
 * happy-dom's, whose `Headers.getSetCookie()` doesn't aggregate Set-Cookie the
 * way Bun's native one does. The server auth tests build real `Response`s and
 * read cookies off them, so a process-wide registration breaks them. Bun runs
 * each test file to completion (including `afterAll`) before the next, so
 * registering in `beforeAll` and unregistering in `afterAll` keeps the DOM
 * globals contained to DOM test files.
 *
 * Call once at the top level of a DOM test file, before any render.
 */
export function setupHappyDom(): void {
  beforeAll(() => {
    GlobalRegistrator.register()
  })

  afterAll(async () => {
    await GlobalRegistrator.unregister()
  })
}
