import express from 'express'
import { print } from 'listening-on'
import { join } from 'path'
import { getPort, storageDir } from './config'
import { loadConfigs, getCurrentConfig, saveConfigs, applyConfig } from './core'

let app = express()

console.log('config dir:', storageDir)
app.use(express.static(join(__dirname, 'public')))
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

getPort().then(port => {
  let server = app.listen(port, () => {
    let address = server.address() as any
    print(address.port)
  })
})
