import type {BunFile} from 'bun'

import {readdirSync, readFileSync} from 'node:fs'
import path from 'node:path'
import process from 'node:process'

import {noDirectRequestMiddleware} from '@/server/middleware/noDirectRequestMiddleware'

import {Hono} from 'hono'

export type StaticAsset = {fileName: string; isProtected: boolean}
type RouteData = {route: string; isProtected: boolean; data: BunFile}

/**
 * These routes are for static assets produced by the build. Some are protected
 * (i.e. cannot be accessed via direct browser url bar), others are not.
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
  // In dev, Bun serves all static assets automatically, minus the server ones.
  if (process.env.NODE_ENV !== 'production') {
    const serverAssetsPath = path.resolve(import.meta.dirname, '../assets')
    const serverProtectedAssetDirents = readdirSync(serverAssetsPath, {
      recursive: true,
      withFileTypes: true,
    })

    return serverProtectedAssetDirents.reduce<RouteData[]>((acc, dirent) => {
      if (dirent.isFile()) {
        const route = `/${dirent.name}`
        const filePath = `${dirent.parentPath}/${dirent.name}`
        const data = Bun.file(filePath)

        acc.push({route, isProtected: true, data})
      }

      return acc
    }, [])
  }

  const fileList = JSON.parse(
    readFileSync('/app/assets.json', {encoding: 'utf8'})
  ) as StaticAsset[]
  const forbiddenChars = ['..', '/', '\\']

  return fileList.map(({fileName, isProtected}) => {
    if (forbiddenChars.some(val => fileName.includes(val))) {
      throw new Error(
        `Malformed fileName present in /app/assets.json - "${fileName}"`
      )
    }

    return {
      route: `/${fileName}`,
      isProtected,
      data: Bun.file(`/app/${fileName}`),
    }
  })
}
