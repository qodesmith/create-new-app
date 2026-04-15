import {CryptoHasher, file} from 'bun'

import {getEnvVar} from './getEnvVar'

export async function genDbHash() {
  const sqlitePath = getEnvVar('SQLITE_PATH')
  const dbBytes = await file(sqlitePath).arrayBuffer()

  return CryptoHasher.hash('sha1', dbBytes).toString('hex')
}
