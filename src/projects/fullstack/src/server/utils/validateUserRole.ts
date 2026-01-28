import type {SessionData} from '@/server/db/auth/auth'

import {userRoles} from '@/server/constants'

/**
 * NOTE: roles defined in the `admin` plugin for `authOptions`.
 */

export function isAdminUser(user: SessionData['user'] | undefined) {
  return !!user && user.role === userRoles.admin
}
