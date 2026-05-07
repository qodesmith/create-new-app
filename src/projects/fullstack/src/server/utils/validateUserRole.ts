import type {AuthedSessionData} from '@/server/db/auth/auth'

import {userRoles} from '@/server/constants'

/**
 * NOTE: roles defined in the `admin` plugin for `authOptions`.
 */

export function isAdminUser(user: AuthedSessionData['user']) {
  return !!user && user.role === userRoles.admin
}
