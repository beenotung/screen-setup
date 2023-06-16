import { button, div, fragment, h1, h2, h3, h4, input, p } from 'dom-proxy'
import type { Config, Configs } from '../core.js'

let configList = div()
let configListMessage = p()

let configs: Config[] | undefined

async function applyConfig(config: Config, applyMessage: HTMLParagraphElement) {
  try {
    let res = await fetch('/config/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    })
    let json = await res.json()
    applyMessage.textContent = `Applied config (${new Date().toLocaleTimeString()})`
  } catch (error) {
    applyMessage.textContent = String(error)
  }
}

function ConfigNode(config: Config) {
  let totalHeight = 0
  let totalWidth = 0
  config.screens.forEach(screen => {
    totalHeight = Math.max(totalHeight, screen.y + screen.h)
    totalWidth = Math.max(totalWidth, screen.x + screen.w)
  })
  let scale = 1 / 10
  let applyMessage = p()
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
      h3(
        {
          textContent: 'Profile: ',
          style: {
            marginTop: '0.5rem',
            marginBottom: '0.5rem',
          },
        },
        [
          input({
            value: config.profile_name,
            oninput: e =>
              (config.profile_name = (
                e.currentTarget as HTMLInputElement
              ).value),
          }),
        ],
      ),
      div({}, [
        button({
          textContent: 'Save',
          onclick: saveConfigs,
          style: {
            marginLeft: '0.5rem',
            marginRight: '0.5rem',
            color: 'darkgreen',
          },
        }),
        button({
          textContent: 'Delete',
          onclick: () => {
            if (!configs) return
            let index = configs.indexOf(config)
            if (index === -1) return
            configs.splice(index, 1)
            saveConfigs()
          },
          style: {
            color: 'red',
          },
        }),
      ]),
      ...config.screens.map(({ name, w, h, x, y }) => {
        return div(
          {
            style: {
              display: 'inline-block',
              border: '1px solid black',
              padding: '0.5rem',
              paddingTop: '0',
              margin: '0.5rem',
            },
          },
          [
            h4({
              textContent: 'Screen: ' + name,
              style: { margin: '0.5rem 0' },
            }),
            div({ textContent: `${w}x${h}+${x}+${y}` }),
          ],
        )
      }),
      h4({ textContent: 'Preview', style: { margin: '0.5rem 0' } }),
      button({
        textContent: 'Apply',
        onclick: () => applyConfig(config, applyMessage),
      }),
      applyMessage,
      div(
        {
          style: {
            border: '1px solid black',
            margin: '0.5rem',
            width: totalWidth * scale + 'px',
            height: totalHeight * scale + 'px',
            position: 'relative',
            backgroundColor: '#666666',
          },
        },
        config.screens.map(screen => {
          return div(
            {
              style: {
                position: 'absolute',
                width: screen.w * scale + 'px',
                height: screen.h * scale + 'px',
                top: screen.y * scale + 'px',
                left: screen.x * scale + 'px',
                border: '1px solid black',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontSize: '2rem',
                backgroundColor: '#ffffff88',
                userSelect: 'none',
              },
            },
            [screen.name],
          )
        }),
      ),
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
