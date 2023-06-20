import express from 'express'
import { print } from 'listening-on'
import { getPort, storageDir, publicDir } from './config.js'
import {
  loadConfigs,
  getCurrentConfig,
  saveConfigs,
  applyConfig,
} from './core.js'
import open from 'open'

console.log('config dir:', storageDir)
// console.log('public dir:', publicDir)

async function main() {
  let app = express()

  app.use(express.static(publicDir))

  app.use(express.json())
  app.use(express.urlencoded({ extended: false }))

  app.get('/configs', (req, res) => {
    let configs = loadConfigs()
    res.json({ configs })
  })

  app.get('/current-config', (req, res) => {
    let config = getCurrentConfig()
    res.json({ config })
  })

  app.post('/configs', (req, res) => {
    saveConfigs(req.body)
    res.json({})
  })

  app.post('/config/apply', (req, res) => {
    applyConfig(req.body)
    res.json({})
  })

  app.post('/server/stop', (req, res) => {
    console.log('stopping server...')
    server.close()
    res.json({})
    // setTimeout(() => {
    // }, 100)
  })

  let port = await getPort()
  let server = app.listen(port, () => {
    let address = server.address() as any
    port = address.port
    print(port)
    open('http://localhost:' + port)
  })
}

main()
