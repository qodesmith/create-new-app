import type {SessionData} from '@/server/db/auth/auth'

import {getDatabase} from '@/server/db/getDatabase'
import {avatarsTable} from '@/server/db/schema/appSchema'
import {authMiddleware} from '@/server/middleware/authMiddleware'
import {maxAvatarUploadSize} from '@/shared/constants'

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

  // Upload avatar - resize 128px at 20KB max.
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

        webpBuffer = await sharp(buffer)
          .resize(128, 128, {fit: 'cover'})
          .webp({quality: 90})
          .toBuffer()

        let quality = 90

        // If still over 20KB, reduce quality
        while (webpBuffer.byteLength > 20 * 1024) {
          quality -= 5
          webpBuffer = await sharp(buffer)
            .resize(128, 128, {fit: 'cover'})
            .webp({quality})
            .toBuffer()
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
    const userId = +c.get('user').id
    const db = getDatabase()
    const avatar = db
      .select()
      .from(avatarsTable)
      .where(eq(avatarsTable.userId, userId))
      .get()

    if (!avatar) {
      return c.body(null, 404)
    }

    c.header('Content-Type', avatar.mimeType)
    c.header('Cache-Control', 'private, max-age=3600')
    return c.body(new Uint8Array(avatar.data))
  })

  // Delete avatar
  .delete('/avatar', c => {
    const user = c.get('user')
    const db = getDatabase()

    db.delete(avatarsTable).where(eq(avatarsTable.userId, +user.id)).run()

    return c.body(null, 204)
  })
