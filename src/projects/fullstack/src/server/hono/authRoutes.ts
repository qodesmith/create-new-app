import type {SessionData} from '@/server/db/auth/auth'

import {getDatabase} from '@/server/db/getDatabase'
import {avatarsTable} from '@/server/db/schema/appSchema'
import {authMiddleware} from '@/server/middleware/authMiddleware'
import {
  maxAvatarDimension,
  maxAvatarFileSize,
  maxAvatarUploadSize,
} from '@/shared/constants'

import {arktypeValidator} from '@hono/arktype-validator'
import {bytesToSize} from '@qodestack/utils'
import {type} from 'arktype'
import {eq} from 'drizzle-orm'
import {Hono} from 'hono'
import sharp from 'sharp'

export type HonoAuthServer = typeof authRoutes

// biome-ignore lint/style/useNamingConvention: Hono expects `Variables` as a type argument
export const authRoutes = new Hono<{Variables: SessionData}>()
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
        const buffer = Buffer.from(await avatar.arrayBuffer())
        const raw = await sharp(buffer)
          .resize(maxAvatarDimension, maxAvatarDimension, {fit: 'cover'})
          .raw()
          .toBuffer({resolveWithObject: true})
        const qualityReductionAmount = 5
        let quality = 90

        webpBuffer = await sharp(raw.data, {raw: raw.info})
          .webp({quality})
          .toBuffer()

        while (webpBuffer.byteLength > maxAvatarFileSize && quality > 5) {
          quality -= qualityReductionAmount
          webpBuffer = await sharp(raw.data, {raw: raw.info})
            .webp({quality})
            .toBuffer()
        }

        if (webpBuffer.byteLength > maxAvatarFileSize) {
          return c.json({error: 'Image too large after compression'}, 400)
        }
      } catch {
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
