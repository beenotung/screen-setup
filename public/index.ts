import { button, div, fragment, h1, h2, h3, h4, p, text } from 'dom-proxy'
import type { Config, Configs } from '../core.js'

let configList = div()
let configListMessage = p()

let configs: Config[] | undefined

function ConfigNode(config: Config) {
  return div(
    {
      style: {
        display: 'inline-block',
        border: '1px solid black',
        padding: '0.5rem',
        margin: '0.5rem',
      },
    },
    [
      h3({ textContent: 'Profile: ' + config.profile_name }),
      ...config.screens.map(({ name, w, h, x, y }) => {
        return div(
          {
            style: {
              display: 'inline-block',
              border: '1px solid black',
              padding: '0.5rem',
              margin: '0.5rem',
            },
          },
          [
            h4({ textContent: 'Screen: ' + name }),
            div({ textContent: `${w}x${h}+${x}+${y}` }),
          ],
        )
      }),
    ],
  )
}

function showConfigs(configs: Config[]) {
  configListMessage.textContent = configs.length + ' saved configs'
  configList.textContent = ''
  configList.appendChild(fragment(configs.map(ConfigNode)))
}

async function loadConfigList() {
  try {
    let res = await fetch('/configs')
    let json = (await res.json()) as { configs: Configs }
    configs = json.configs
    showConfigs(configs)
  } catch (error) {
    configList.textContent = String(error)
  }
}
loadConfigList()

async function loadCurrentConfig() {
  try {
    if (!configs) {
      throw new Error('Configs not loaded yet')
    }
    let res = await fetch('/current-config')
    let json = (await res.json()) as { config: Config }
    configs.push(json.config)
    configListMessage.textContent = configs.length + ' saved configs'
    configList.prepend(ConfigNode(json.config).node)
  } catch (error) {
    configList.textContent = String(error)
  }
}

let saveMessage = p()

async function saveConfigs() {
  try {
    if (!configs) {
      throw new Error('Configs not loaded yet')
    }
    let res = await fetch('/configs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(configs),
    })
    let json = await res.json()
    saveMessage.textContent = `Saved configs (${new Date().toLocaleTimeString()})`
    showConfigs(configs)
  } catch (error) {
    saveMessage.textContent = String(error)
  }
}

document.body.appendChild(
  fragment([
    h1({ textContent: 'Screen Setup' }),
    h2({ textContent: 'Config List' }, [
      button({
        style: { marginInlineStart: '0.5rem' },
        textContent: 'Save Configs',
        onclick: saveConfigs,
      }),
    ]),
    saveMessage,
    button({ textContent: 'Load Current Config', onclick: loadCurrentConfig }),
    configListMessage,
    configList,
  ]),
)
