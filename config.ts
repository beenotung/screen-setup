import { join } from 'path'
import { createServer } from 'net'
import { fileURLToPath } from 'url'

export let storageDir = join(
  process.env.HOME || '~',
  '.config',
  'screen-setup',
  '.db',
)

export let publicDir = join(
  fileURLToPath(new URL('.', import.meta.url)),
  'public',
)

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
