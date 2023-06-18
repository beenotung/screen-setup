import { join } from 'path'
import { createServer } from 'net'

export let storageDir = join(
  process.env.HOME || '~',
  '.config',
  'screen-setup',
  '.db',
)
// mkdirSync(storageDir)

export function getPort() {
  return new Promise<number>((resolve, reject) => {
    let port = +process.env.PORT! || 8456
    let server = createServer()
    server.listen(port, () => {
      resolve(port)
      server.close()
    })
    server.on('error', () => {
      server.close()
      resolve(0)
    })
  })
}
