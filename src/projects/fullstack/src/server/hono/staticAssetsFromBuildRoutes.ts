import type {BunFile} from 'bun'

import {Glob} from 'bun'
import {readFileSync} from 'node:fs'
import path from 'node:path'
import process from 'node:process'

import {noDirectRequestMiddleware} from '@/server/middleware/noDirectRequestMiddleware'

import {Hono} from 'hono'

export type StaticAsset = {relativePath: string; isProtected: boolean}
type RouteData = {route: string; isProtected: boolean; data: BunFile}

/**
 * These routes are for static assets produced by the build. Some are protected
 * (i.e. cannot be accessed via direct browser url bar), others are not.
 *
 * Protected assets are served under `/assets/...` mirroring the folder
 * structure of `src/server/assets-protected`. Unprotected build outputs are
 * served at the root.
 */
export const staticAssetsFromBuildRoutes = new Hono()

getRoutesAndData().forEach(({route, isProtected, data}) => {
  if (isProtected) {
    staticAssetsFromBuildRoutes.get(
      route,
      noDirectRequestMiddleware,
      () => new Response(data)
    )
  } else {
    staticAssetsFromBuildRoutes.get(route, () => new Response(data))
  }
})

function getRoutesAndData(): RouteData[] {
  /////////
  // DEV //
  /////////

  // In dev, Bun serves all static assets automatically, minus the server ones.
  if (process.env.NODE_ENV !== 'production') {
    const serverAssetsPath = path.resolve(
      import.meta.dirname,
      '../assets-protected'
    )

    return Array.from(
      new Glob('**/*').scanSync({
        cwd: serverAssetsPath,
        absolute: true,
        dot: true,
        onlyFiles: true,
      })
    ).map(filePath => ({
      route: `/assets/${path.relative(serverAssetsPath, filePath)}`,
      isProtected: true,
      data: Bun.file(filePath),
    }))
  }

  ////////////////
  // PRODUCTION //
  ////////////////

  const fileList = JSON.parse(
    readFileSync('/app/assets.json', {encoding: 'utf8'})
  ) as StaticAsset[]

  // `/` is allowed for protected assets (nested folders) but `..` and `\`
  // remain forbidden to prevent path traversal or Windows-style escapes.
  const forbiddenSubstrings = ['..', '\\']

  return fileList.map(({relativePath, isProtected}) => {
    if (forbiddenSubstrings.some(val => relativePath.includes(val))) {
      throw new Error(
        `Malformed relativePath present in /app/assets.json - "${relativePath}"`
      )
    }

    return {
      route: isProtected ? `/assets/${relativePath}` : `/${relativePath}`,
      isProtected,
      data: Bun.file(
        isProtected ? `/app/assets/${relativePath}` : `/app/${relativePath}`
      ),
    }
  })
}
