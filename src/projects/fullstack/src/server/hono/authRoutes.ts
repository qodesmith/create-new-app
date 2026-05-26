import {getDatabase} from '@/server/db/getDatabase'
import {avatarsTable, errorsTable} from '@/server/db/schema/appSchema'
import {authMiddleware} from '@/server/middleware/authMiddleware'
import {
  maxAvatarDimension,
  maxAvatarFileSize,
  maxAvatarUploadSize,
} from '@/shared/constants'

import {arktypeValidator} from '@hono/arktype-validator'
import {bestEffort, bytesToSize, errorToObject} from '@qodestack/utils'
import {type} from 'arktype'
import {eq} from 'drizzle-orm'
import {Hono} from 'hono'

export type HonoAuthServer = typeof authRoutes

export const authRoutes = new Hono()
  .use(authMiddleware)

  /**
   * Upload avatar - resize dimensions, reduce file size.
   *
   * SQLite handles small BLOBs well - there's a well-known SQLite benchmark
   * ("35% Faster Than The Filesystem") showing that for blobs under roughly
   * 100KB, SQLite can be faster than reading individual files off disk, because
   * you save the per-file syscall overhead.
   */
  .post(
    '/avatar',
    arktypeValidator('form', type({avatar: 'File'})),
    async c => {
      const {avatar} = c.req.valid('form')

      if (!(avatar instanceof File)) {
        return c.json({error: 'No file provided'}, 400)
      }

      if (avatar.size > maxAvatarUploadSize) {
        return c.json(
          {error: `File too large (max ${bytesToSize(maxAvatarUploadSize)})`},
          400
        )
      }

      let webpBuffer: Buffer

      try {
        const inputBytes = new Uint8Array(await avatar.arrayBuffer())
        const qualityReductionAmount = 5
        let quality = 90

        webpBuffer = await new Bun.Image(inputBytes)
          .resize(maxAvatarDimension, maxAvatarDimension, {fit: 'inside'})
          .webp({quality})
          .buffer()

        while (webpBuffer.byteLength > maxAvatarFileSize && quality > 5) {
          quality -= qualityReductionAmount
          webpBuffer = await new Bun.Image(inputBytes)
            .resize(maxAvatarDimension, maxAvatarDimension, {fit: 'inside'})
            .webp({quality})
            .buffer()
        }

        if (webpBuffer.byteLength > maxAvatarFileSize) {
          return c.json({error: 'Image too large after compression'}, 400)
        }
      } catch (err) {
        bestEffort(() => {
          getDatabase()
            .insert(errorsTable)
            .values({
              error: errorToObject(err),
              context: 'bunImage:avatarUpload:exception',
              userId: c.get('user').id,
            })
            .run()
        })

        return c.json({error: 'Unsupported image format'}, 400)
      }

      const user = c.get('user')
      const db = getDatabase()

      db.insert(avatarsTable)
        .values({
          userId: user.id,
          data: webpBuffer,
          mimeType: 'image/webp',
        })
        .onConflictDoUpdate({
          target: avatarsTable.userId,
          set: {data: webpBuffer, mimeType: 'image/webp'},
        })
        .run()

      return c.json({success: true})
    }
  )

  // Get avatar
  .get('/avatar', c => {
    const db = getDatabase()
    const avatar = db
      .select()
      .from(avatarsTable)
      .where(eq(avatarsTable.userId, c.get('user').id))
      .get()

    if (!avatar) {
      return c.body(null, 404)
    }

    const etag = `W/"${avatar.updatedAt.getTime()}"`

    // Weak validator the browser echoes back as `If-None-Match` on revalidation.
    c.header('ETag', etag)

    /**
     * Force revalidation on every request but allow 304 responses, so a new
     * upload is seen immediately instead of being masked by a stale cache.
     */
    c.header('Cache-Control', 'private, no-cache')

    // If the client's cached ETag still matches, skip sending the image bytes.
    if (c.req.header('If-None-Match') === etag) {
      return c.body(null, 304)
    }

    c.header('Content-Type', avatar.mimeType)
    return c.body(new Uint8Array(avatar.data))
  })

  // Delete avatar
  .delete('/avatar', c => {
    const user = c.get('user')
    const db = getDatabase()

    db.delete(avatarsTable).where(eq(avatarsTable.userId, user.id)).run()

    return c.body(null, 204)
  })
