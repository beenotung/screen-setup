import {
  button,
  span,
  div,
  fragment,
  h1,
  h2,
  h3,
  h4,
  input,
  label,
  p,
  select,
  option,
} from 'dom-proxy'
import type { Config, Configs, Screen } from '../core.js'
import { format_2_digit, format_datetime } from '@beenotung/tslib/format.js'

let configList = div()
let configListMessage = span({ style: { marginInlineStart: '0.5rem' } })
let filterSelect = select()

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

function NumberInput(screen: Screen, key: 'x' | 'y') {
  return input({
    style: { width: '4ch' },
    type: 'text',
    inputMode: 'numeric',
    value: String(screen[key]),
    onchange: e => {
      let input = e.currentTarget as HTMLInputElement
      let value = calc(input.value)
      Object.assign(screen, { [key]: value })
      input.value = String(value)
    },
  })
}

function calc(text: string): number {
  let value = +text
  if (Number.isFinite(value)) {
    return value
  }

  let parts = text.split('+')
  if (parts.length === 2) {
    value = +parts[0] + +parts[1]
    if (Number.isFinite(value)) {
      return value
    }
    reject()
  }

  parts = text.split('-')
  if (parts.length === 2) {
    value = +parts[0] - +parts[1]
    if (Number.isFinite(value)) {
      return value
    }
    reject()
  }

  reject()

  function reject(): never {
    throw new Error('Invalid expression: ' + JSON.stringify(text))
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
  function formatTimestamp() {
    if (!config.last_applied) return '-'
    let date = new Date(config.last_applied)
    let y = date.getFullYear()
    let m = format_2_digit(date.getMonth() + 1)
    let d = format_2_digit(date.getDate())
    let H = format_2_digit(date.getHours())
    let M = format_2_digit(date.getMinutes())
    let S = format_2_digit(date.getSeconds())
    return `${y}-${m}-${d} ${H}:${M}:${S}`
  }
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
            marginBottom: '0.25rem',
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
      p({ style: { margin: '0.5rem 0', color: '#666' } }, [
        'Last used: ',
        formatTimestamp(),
      ]),
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
      ...config.screens.map(screen => {
        let { name, w, h } = screen
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
            div([
              `${w}x${h}+`,
              NumberInput(screen, 'x'),
              '+',
              NumberInput(screen, 'y'),
            ]),
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
  let filtered = configs
  let filterValue = filterSelect.value
  if (filterValue) {
    filtered = configs.filter(c =>
      c.screens.some(s => `${s.w}x${s.h}` === filterValue),
    )
  }
  configListMessage.textContent = `Showing ${filtered.length} of ${configs.length} configs`
  configList.textContent = ''
  configList.appendChild(fragment(filtered.map(ConfigNode)))
}

function updateFilterOptions(configs: Config[]) {
  let sizes = new Set<string>()
  for (let config of configs) {
    for (let screen of config.screens) {
      if (screen.name.includes('HDMI')) {
        sizes.add(`${screen.w}x${screen.h}`)
      }
    }
  }
  let savedValue =
    localStorage.getItem('screen-setup-filter') || filterSelect.value
  filterSelect.textContent = ''
  filterSelect.appendChild(option({ value: '', textContent: 'Show all' }).node)
  for (let size of Array.from(sizes).sort()) {
    filterSelect.appendChild(option({ value: size, textContent: size }).node)
  }
  if (savedValue && Array.from(sizes).includes(savedValue)) {
    filterSelect.value = savedValue
  }
}

async function loadConfigList() {
  try {
    let res = await fetch('/configs')
    let json = (await res.json()) as { configs: Configs }
    configs = json.configs
    updateFilterOptions(configs)
    showConfigs(configs)
  } catch (error) {
    configList.textContent = String(error)
  }
}
loadConfigList()

filterSelect.onchange = () => {
  if (configs) showConfigs(configs)
  localStorage.setItem('screen-setup-filter', filterSelect.value)
}

async function loadCurrentConfig() {
  try {
    if (!configs) {
      throw new Error('Configs not loaded yet')
    }
    let res = await fetch('/current-config')
    let json = (await res.json()) as { config: Config }
    configs.unshift(json.config)
    updateFilterOptions(configs)
    showConfigs(configs)
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

let stopServerMessage = p()
async function stopServer() {
  stopServerMessage.textContent = 'stopping server...'
  let res = await fetch('/server/stop', { method: 'POST' })
  let json = await res.json()
  stopServerMessage.textContent = 'stopped server.'
  window.close()
}

document.body.appendChild(
  fragment([
    h1({ textContent: 'Screen Setup' }),
    button({ textContent: 'Stop Server', onclick: stopServer }),
    stopServerMessage,
    h2({ textContent: 'Config List' }, [
      button({
        style: { marginInlineStart: '0.5rem' },
        textContent: 'Load Current Config',
        onclick: loadCurrentConfig,
      }),
      button({
        style: { marginInlineStart: '0.5rem' },
        textContent: 'Save Configs',
        onclick: saveConfigs,
      }),
    ]),
    saveMessage,
    label(['Filter: ', filterSelect]),
    configListMessage,
    configList,
  ]),
)
