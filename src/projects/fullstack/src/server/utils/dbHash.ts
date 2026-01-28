import {CryptoHasher, file} from 'bun'

import {getEnvVar} from './getEnvVar'
import {log} from './logger'

const sqlitePath = getEnvVar('SQLITE_PATH')
const dbBytes = await file(sqlitePath).arrayBuffer()
const dbHash = CryptoHasher.hash('sha1', dbBytes).toString('hex')

log.text({dbHash})
