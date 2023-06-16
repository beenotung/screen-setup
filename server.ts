import express from 'express'
import { print } from 'listening-on'
import { loadConfigs, getCurrentConfig, saveConfigs } from './core'

let app = express()

app.use(express.static('public'))
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

let port = 8100
app.listen(port, () => {
  print(port)
})
